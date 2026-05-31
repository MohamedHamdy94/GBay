export type AuctionStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
export type BidderType = 'USER' | 'PROXY';
export type AuctionEventType = 'BID' | 'CANCELLED' | 'ENDED' | 'EXTENDED';
export type Currency = 'EUR' | 'USD';

export interface AuctionView {
  id: string;
  listingId: string;
  sellerId: string;
  currency: Currency;
  startPriceCents: number;
  reservePriceCents: number | null;
  currentHighestBidCents: number | null;
  minBidIncrementCents: number;
  startTime: Date;
  endTime: Date;
  status: AuctionStatus;
  antiSnipingSeconds: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  bids?: BidView[];
}

export interface BidView {
  id: string;
  auctionId: string;
  bidderId: string;
  amountCents: number;
  bidderType: BidderType;
  isAutoBid: boolean;
  createdAt: Date;
}

export interface CreateAuctionInput {
  listingId: string;
  sellerId: string;
  currency: Currency;
  startPriceCents: number;
  reservePriceCents?: number;
  minBidIncrementCents?: number;
  startTime: Date;
  endTime: Date;
  antiSnipingSeconds?: number;
}

export interface AuctionRepository {
  create(input: CreateAuctionInput): Promise<AuctionView>;
  findById(id: string): Promise<AuctionView | null>;
  findByIdForUpdate(id: string, tx: any): Promise<AuctionView | null>;
  listActive(filter: { categoryId?: string; limit?: number; offset?: number }): Promise<AuctionView[]>;
  updateStatus(id: string, status: AuctionStatus, version: number): Promise<AuctionView>;
  updateBiddingState(id: string, data: { currentHighestBidCents: number; endTime?: Date; version: number }, tx: any): Promise<AuctionView>;
  addBid(data: { auctionId: string; bidderId: string; amountCents: number; bidderType: BidderType; isAutoBid: boolean; idempotencyKey: string }, tx: any): Promise<BidView>;
  findBidByIdempotencyKey(key: string): Promise<BidView | null>;
  getBidHistory(auctionId: string): Promise<BidView[]>;
  getHighestProxyBid(auctionId: string, excludeBidderId?: string): Promise<BidView | null>;
}
