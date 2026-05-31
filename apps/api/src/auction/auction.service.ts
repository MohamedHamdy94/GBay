import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuctionRepository, AuctionStatus, AuctionView, CreateAuctionInput } from './auction.types';
import { SellerService } from '../seller/seller.service';

export const AUCTION_REPOSITORY = Symbol('AUCTION_REPOSITORY');

@Injectable()
export class AuctionService {
  constructor(
    @Inject(AUCTION_REPOSITORY) private readonly repository: AuctionRepository,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
    @Inject(SellerService) private readonly sellerService: SellerService,
  ) {}

  async create(input: CreateAuctionInput): Promise<AuctionView> {
    // Basic validation could be done here or in DTO
    return this.repository.create(input);
  }

  async findById(id: string): Promise<AuctionView> {
    const auction = await this.repository.findById(id);
    if (!auction) throw new NotFoundException({ code: 'AUCTION_NOT_FOUND' });
    return auction;
  }

  async listActive(filter: { categoryId?: string; limit?: number; offset?: number }) {
    return this.repository.listActive(filter);
  }

  async cancel(id: string, userId: string, isAdmin = false) {
    const auction = await this.findById(id);
    
    if (!isAdmin) {
      const sellerProfile = await this.sellerService.getMine(userId);
      if (auction.sellerId !== sellerProfile.id) {
        throw new ConflictException({ code: 'AUCTION_CANCEL_UNAUTHORIZED' });
      }
    }

    if (auction.status !== 'SCHEDULED' && auction.status !== 'ACTIVE') {
      throw new ConflictException({ code: 'AUCTION_INVALID_STATE_TRANSITION', status: auction.status });
    }

    // Check if bids exist (if not admin)
    if (!isAdmin) {
      const history = await this.repository.getBidHistory(id);
      if (history.length > 0) {
        throw new ConflictException({ code: 'AUCTION_CANCEL_HAS_BIDS' });
      }
    }

    return this.repository.updateStatus(id, 'CANCELLED', auction.version);
  }

  async activate(id: string) {
    const auction = await this.findById(id);
    if (auction.status !== 'SCHEDULED') return auction;
    return this.repository.updateStatus(id, 'ACTIVE', auction.version);
  }

  async end(id: string) {
    const auction = await this.findById(id);
    if (auction.status !== 'ACTIVE') return auction;
    const updated = await this.repository.updateStatus(id, 'ENDED', auction.version);

    // If there's a winner, emit auction.won
    if (updated.currentHighestBidCents && updated.bids && updated.bids.length > 0) {
      const winner = updated.bids[0]; // Assuming bids are sorted DESC by amount
      this.eventEmitter.emit('auction.won', { 
        auctionId: updated.id, 
        winnerId: winner.bidderId, 
        sellerId: updated.sellerId,
        amountCents: updated.currentHighestBidCents 
      });
    }

    return updated;
  }
}
