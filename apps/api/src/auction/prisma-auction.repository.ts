import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient, AuctionStatus as PrismaAuctionStatus } from '@gbay/database';
import { PrismaService } from '../prisma.service';
import {
  AuctionRepository,
  AuctionView,
  CreateAuctionInput,
  AuctionStatus,
  BidView,
  BidderType,
} from './auction.types';

@Injectable()
export class PrismaAuctionRepository implements AuctionRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  async create(input: CreateAuctionInput): Promise<AuctionView> {
    return this.prisma.auction.create({
      data: {
        listingId: input.listingId,
        sellerId: input.sellerId,
        currency: input.currency,
        startPriceCents: input.startPriceCents,
        reservePriceCents: input.reservePriceCents,
        minBidIncrementCents: input.minBidIncrementCents ?? 100,
        startTime: input.startTime,
        endTime: input.endTime,
        antiSnipingSeconds: input.antiSnipingSeconds ?? 120,
        status: 'SCHEDULED',
      },
    }) as unknown as Promise<AuctionView>;
  }

  async findById(id: string): Promise<AuctionView | null> {
    return this.prisma.auction.findUnique({
      where: { id },
    }) as unknown as Promise<AuctionView | null>;
  }

  async findByIdForUpdate(id: string, tx: any): Promise<AuctionView | null> {
    // Using raw query for pessimistic lock
    const result = await tx.$queryRaw<any[]>`
      SELECT * FROM gbay."Auction" WHERE id = ${id} FOR UPDATE
    `;
    if (!result[0]) return null;
    
    const auction = result[0];
    const bids = await tx.bid.findMany({
      where: { auctionId: id },
      orderBy: { amountCents: 'desc' },
    });

    return { ...auction, bids };
  }

  async listActive(filter: { categoryId?: string; limit?: number; offset?: number }): Promise<AuctionView[]> {
    return this.prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        listing: filter.categoryId ? {
          product: {
            categoryId: filter.categoryId
          }
        } : undefined
      },
      include: {
        bids: {
          orderBy: { amountCents: 'desc' },
          take: 1,
        }
      },
      orderBy: { endTime: 'asc' },
      take: filter.limit ?? 20,
      skip: filter.offset ?? 0,
    }) as unknown as Promise<AuctionView[]>;
  }

  async updateStatus(id: string, status: AuctionStatus, version: number): Promise<AuctionView> {
    return this.prisma.auction.update({
      where: { id, version },
      data: {
        status: status as PrismaAuctionStatus,
        version: { increment: 1 },
      },
      include: {
        bids: {
          orderBy: { amountCents: 'desc' },
        }
      }
    }) as unknown as Promise<AuctionView>;
  }

  async updateBiddingState(id: string, data: { currentHighestBidCents: number; endTime?: Date; version: number }, tx: any): Promise<AuctionView> {
    return tx.auction.update({
      where: { id, version: data.version },
      data: {
        currentHighestBidCents: data.currentHighestBidCents,
        endTime: data.endTime,
        version: { increment: 1 },
      },
      include: {
        bids: {
          orderBy: { amountCents: 'desc' },
        }
      }
    }) as unknown as Promise<AuctionView>;
  }

  async addBid(data: { auctionId: string; bidderId: string; amountCents: number; bidderType: BidderType; isAutoBid: boolean; idempotencyKey: string }, tx: any): Promise<BidView> {
    return tx.bid.create({
      data: {
        auctionId: data.auctionId,
        bidderId: data.bidderId,
        amountCents: data.amountCents,
        bidderType: data.bidderType,
        isAutoBid: data.isAutoBid,
        idempotencyKey: data.idempotencyKey,
      },
    }) as unknown as Promise<BidView>;
  }

  async findBidByIdempotencyKey(key: string): Promise<BidView | null> {
    return this.prisma.bid.findUnique({
      where: { idempotencyKey: key },
    }) as unknown as Promise<BidView | null>;
  }

  async getBidHistory(auctionId: string): Promise<BidView[]> {
    return this.prisma.bid.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Promise<BidView[]>;
  }

  async getHighestProxyBid(auctionId: string, excludeBidderId?: string): Promise<BidView | null> {
    return this.prisma.bid.findFirst({
      where: {
        auctionId,
        bidderType: 'PROXY',
        bidderId: excludeBidderId ? { not: excludeBidderId } : undefined,
      },
      orderBy: { amountCents: 'desc' },
    }) as unknown as Promise<BidView | null>;
  }
}
