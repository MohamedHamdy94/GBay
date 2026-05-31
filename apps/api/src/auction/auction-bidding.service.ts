import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaClient } from '@gbay/database';
import Redis from 'ioredis';
import { AUCTION_REPOSITORY } from './auction.service';
import { AuctionRepository, AuctionView, BidderType, BidView } from './auction.types';
import { AuctionGateway } from './auction.gateway';
import { MetricsService } from '../observability/metrics/metrics.service';

@Injectable()
export class AuctionBiddingService {
  private readonly redis: Redis | null = null;
  private readonly prisma = new PrismaClient();
  private readonly memoryLocks = new Set<string>();

  constructor(
    @Inject(AUCTION_REPOSITORY) private readonly repository: AuctionRepository,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
    @Inject(AuctionGateway) private readonly gateway: AuctionGateway,
    @Inject(MetricsService) private readonly metricsService: MetricsService,
  ) {
    try {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });
      this.redis.on('error', (err) => {
        // Silent error to avoid crashing, but log it
        // console.warn('Redis connection failed, falling back to in-memory locks', err.message);
      });
    } catch (e) {
      // console.warn('Failed to initialize Redis, falling back to in-memory locks');
    }
  }

  async placeBid(auctionId: string, bidderId: string, amountCents: number, isProxy: boolean, idempotencyKey: string): Promise<BidView> {
    const lockKey = `auction:lock:${auctionId}`;
    let locked = false;

    if (this.redis && this.redis.status === 'ready') {
      try {
        const result = await this.redis.set(lockKey, '1', 'EX', 5, 'NX');
        locked = result === 'OK';
      } catch (e) {
        locked = this.acquireMemoryLock(lockKey);
      }
    } else {
      locked = this.acquireMemoryLock(lockKey);
    }
    
    if (!locked) {
      throw new ConflictException({ code: 'AUCTION_BUSY', message: 'Auction is currently processing another bid. Please try again.' });
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const auction = await this.repository.findByIdForUpdate(auctionId, tx);
        if (!auction) throw new NotFoundException({ code: 'AUCTION_NOT_FOUND' });

        this.validateBid(auction, bidderId, amountCents);

        const existingBid = await this.repository.findBidByIdempotencyKey(idempotencyKey);
        if (existingBid) return existingBid;

        const bidderType: BidderType = isProxy ? 'PROXY' : 'USER';
        
        // Vickrey / Proxy Bidding Logic
        const highestOtherProxy = await this.repository.getHighestProxyBid(auctionId, bidderId);
        
        let newVisiblePrice = auction.currentHighestBidCents || auction.startPriceCents;
        
        if (isProxy) {
          if (highestOtherProxy) {
            if (amountCents > highestOtherProxy.amountCents) {
              // New proxy beats old proxy
              newVisiblePrice = highestOtherProxy.amountCents + auction.minBidIncrementCents;
            } else {
              // Old proxy beats new proxy (auto-bid)
              newVisiblePrice = amountCents + auction.minBidIncrementCents;
            }
          } else {
            // First proxy bid, price doesn't change from current (unless current is below start)
            newVisiblePrice = auction.currentHighestBidCents || auction.startPriceCents;
          }
        } else {
          if (highestOtherProxy) {
            if (amountCents > highestOtherProxy.amountCents) {
              newVisiblePrice = amountCents;
            } else {
              // Proxy beats normal bid (auto-bid)
              newVisiblePrice = amountCents + auction.minBidIncrementCents;
            }
          } else {
            newVisiblePrice = amountCents;
          }
        }

        // Cap newVisiblePrice by the absolute max bid if necessary
        // (This happens if increment pushes it above the max bid of the winner)
        const absoluteMax = isProxy ? amountCents : (highestOtherProxy ? Math.max(amountCents, highestOtherProxy.amountCents) : amountCents);
        newVisiblePrice = Math.min(newVisiblePrice, absoluteMax);

        // Anti-sniping
        let newEndTime = auction.endTime;
        const now = new Date();
        const secondsRemaining = (auction.endTime.getTime() - now.getTime()) / 1000;
        let extended = false;
        
        if (secondsRemaining > 0 && secondsRemaining < auction.antiSnipingSeconds) {
          newEndTime = new Date(now.getTime() + auction.antiSnipingSeconds * 1000);
          extended = true;
        }

        const bid = await this.repository.addBid({
          auctionId,
          bidderId,
          amountCents,
          bidderType,
          isAutoBid: false,
          idempotencyKey,
        }, tx);

        await this.repository.updateBiddingState(auctionId, {
          currentHighestBidCents: newVisiblePrice,
          endTime: newEndTime,
          version: auction.version,
        }, tx);

        // Real-time updates
        this.gateway.emitBid(auctionId, {
          amountCents: newVisiblePrice,
          bidderId, 
          createdAt: bid.createdAt,
        });

        if (extended) {
          this.gateway.emitExtension(auctionId, newEndTime.toISOString());
        }

        // Notify previous highest bidder they were outbid
        if (auction.currentHighestBidCents && auction.bids && auction.bids.length > 0) {
           const previousHighestBid = auction.bids[0]; // Assuming bids are sorted by amount desc or we fetch the highest
           if (previousHighestBid.bidderId !== bidderId) {
             this.eventEmitter.emit('auction.outbid', { 
               auctionId, 
               userId: previousHighestBid.bidderId, 
               newPriceCents: newVisiblePrice 
             });
           }
        }
        
        this.metricsService.incrementBids();
        
        return bid;
      });
      return result;
    } finally {
      if (this.redis && this.redis.status === 'ready') {
        await this.redis.del(lockKey).catch(() => this.releaseMemoryLock(lockKey));
      } else {
        this.releaseMemoryLock(lockKey);
      }
    }
  }

  private acquireMemoryLock(key: string): boolean {
    if (this.memoryLocks.has(key)) return false;
    this.memoryLocks.add(key);
    setTimeout(() => this.releaseMemoryLock(key), 5000);
    return true;
  }

  private releaseMemoryLock(key: string) {
    this.memoryLocks.delete(key);
  }

  private validateBid(auction: AuctionView, bidderId: string, amountCents: number) {
    if (auction.status !== 'ACTIVE') {
      throw new ConflictException({ code: 'AUCTION_NOT_ACTIVE', status: auction.status });
    }

    if (auction.sellerId === bidderId) {
      throw new ForbiddenException({ code: 'AUCTION_BID_SELF', message: 'Sellers cannot bid on their own auctions.' });
    }

    const now = new Date();
    if (now < auction.startTime) {
      throw new ConflictException({ code: 'AUCTION_NOT_STARTED' });
    }
    if (now > auction.endTime) {
      throw new ConflictException({ code: 'AUCTION_ALREADY_ENDED' });
    }

    const minRequired = (auction.currentHighestBidCents || (auction.startPriceCents - auction.minBidIncrementCents)) + auction.minBidIncrementCents;
    if (amountCents < minRequired) {
      throw new ConflictException({ 
        code: 'AUCTION_BID_TOO_LOW', 
        minRequired,
        currentHighest: auction.currentHighestBidCents 
      });
    }
  }
}
