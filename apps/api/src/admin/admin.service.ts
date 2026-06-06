import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AdminRepository } from './admin.types';
import { AdminAuditService } from './admin-audit.service';
import { ADMIN_REPOSITORY } from './admin.constants';
export { ADMIN_REPOSITORY };
import { 
  PaginationQueryDto, 
  UserSearchQueryDto, 
  SellerSearchQueryDto, 
  ListingSearchQueryDto, 
  AuctionSearchQueryDto, 
  OrderSearchQueryDto, 
  DisputeSearchQueryDto, 
  RefundSearchQueryDto, 
  AuditLogSearchQueryDto, 
  UpdateUserStatusDto, 
  UpdateSellerStatusDto, 
  UpdateListingStatusDto, 
  ResolveDisputeDto 
} from './dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly repository: AdminRepository,
    private readonly auditService: AdminAuditService,
  ) {}

  async getDashboardMetrics() {
    return this.repository.getDashboardMetrics();
  }

  async listUsers(query: UserSearchQueryDto) {
    return this.repository.listUsers({
      skip: Number(query.skip || 0),
      take: Number(query.take || 20),
      status: query.status,
      q: query.q,
    });
  }

  async getUser(id: string) {
    const user = await this.repository.findUserById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserStatus(adminId: string, id: string, dto: UpdateUserStatusDto) {
    const user = await this.repository.findUserById(id);
    if (!user) throw new NotFoundException('User not found');

    const result = await this.repository.updateUserStatus(id, dto.status);

    await this.auditService.log(adminId, 'UPDATE_USER_STATUS', 'User', id, {
      previousStatus: user.status,
      newStatus: dto.status,
    }, dto.reason);

    return result;
  }

  async listSellers(query: SellerSearchQueryDto) {
    return this.repository.listSellers({
      skip: Number(query.skip || 0),
      take: Number(query.take || 20),
      status: query.status,
    });
  }

  async getSeller(id: string) {
    const seller = await this.repository.findSellerById(id);
    if (!seller) throw new NotFoundException('Seller not found');
    return seller;
  }

  async updateSellerStatus(adminId: string, id: string, dto: UpdateSellerStatusDto) {
    const seller = await this.repository.findSellerById(id);
    if (!seller) throw new NotFoundException('Seller not found');

    const result = await this.repository.updateSellerStatus(id, dto.status, dto.reason);

    await this.auditService.log(adminId, 'UPDATE_SELLER_STATUS', 'SellerProfile', id, {
      previousStatus: seller.status,
      newStatus: dto.status,
    }, dto.reason);

    return result;
  }

  async listListings(query: ListingSearchQueryDto) {
    return this.repository.listListings({
      skip: Number(query.skip || 0),
      take: Number(query.take || 20),
      status: query.status,
      q: query.q,
    });
  }

  async getListing(id: string) {
    const listing = await this.repository.findListingById(id);
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async updateListingStatus(adminId: string, id: string, dto: UpdateListingStatusDto) {
    const listing = await this.repository.findListingById(id);
    if (!listing) throw new NotFoundException('Listing not found');

    const result = await this.repository.updateListingStatus(id, dto.status);

    await this.auditService.log(adminId, 'UPDATE_LISTING_STATUS', 'Listing', id, {
      previousStatus: listing.status,
      newStatus: dto.status,
    }, dto.reason);

    return result;
  }

  async listAuctions(query: AuctionSearchQueryDto) {
    return this.repository.listAuctions({
      skip: Number(query.skip || 0),
      take: Number(query.take || 20),
      status: query.status,
    });
  }

  async getAuction(id: string) {
    const auction = await this.repository.findAuctionById(id);
    if (!auction) throw new NotFoundException('Auction not found');
    return auction;
  }

  async cancelAuction(adminId: string, id: string, reason: string) {
    const auction = await this.repository.findAuctionById(id);
    if (!auction) throw new NotFoundException('Auction not found');

    const result = await this.repository.cancelAuction(id);

    await this.auditService.log(adminId, 'CANCEL_AUCTION', 'Auction', id, {
      previousStatus: auction.status,
      newStatus: 'CANCELLED',
    }, reason);

    return result;
  }

  async listOrders(query: OrderSearchQueryDto) {
    return this.repository.listOrders({
      skip: Number(query.skip || 0),
      take: Number(query.take || 20),
      status: query.status,
    });
  }

  async listDisputes(query: DisputeSearchQueryDto) {
    return this.repository.listDisputes({
      skip: Number(query.skip || 0),
      take: Number(query.take || 20),
      status: query.status,
    });
  }

  async getDispute(id: string) {
    const dispute = await this.repository.findDisputeById(id);
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }

  async updateDisputeStatus(adminId: string, id: string, status: string, reason?: string) {
    const dispute = await this.repository.findDisputeById(id);
    if (!dispute) throw new NotFoundException('Dispute not found');

    const result = await this.repository.updateDisputeStatus(id, status);

    await this.auditService.log(adminId, 'UPDATE_DISPUTE_STATUS', 'Dispute', id, {
      previousStatus: dispute.status,
      newStatus: status,
    }, reason);

    return result;
  }

  async resolveDispute(adminId: string, id: string, dto: ResolveDisputeDto) {
    const dispute = await this.repository.findDisputeById(id);
    if (!dispute) throw new NotFoundException('Dispute not found');

    const result = await this.repository.resolveDispute(id, dto.status, dto.resolution);

    await this.auditService.log(adminId, 'RESOLVE_DISPUTE', 'Dispute', id, {
      previousStatus: dispute.status,
      newStatus: dto.status,
      resolution: dto.resolution,
    }, dto.reason);

    return result;
  }

  async listRefunds(query: RefundSearchQueryDto) {
    return this.repository.listRefunds({
      skip: Number(query.skip || 0),
      take: Number(query.take || 20),
      status: query.status,
    });
  }

  async listAuditLogs(query: AuditLogSearchQueryDto) {
    return this.repository.listAuditLogs({
      skip: Number(query.skip || 0),
      take: Number(query.take || 20),
      action: query.action,
      adminId: query.adminId,
    });
  }

  async getFeatureFlags() {
    return this.repository.getFeatureFlags();
  }

  async updateFeatureFlag(adminId: string, name: string, enabled: boolean) {
    const result = await this.repository.updateFeatureFlag(name, enabled);

    await this.auditService.log(adminId, 'UPDATE_FEATURE_FLAG', 'FeatureFlag', name, {
      name,
      enabled,
    }, `Feature flag ${name} set to ${enabled}`);

    return result;
  }

  async getCommissions() {
    // Placeholder for now as per requirements
    return [
      { id: 'standard', name: 'Standard Plan', rate: 0.10, description: '10% on all sales' },
      { id: 'premium', name: 'Premium Plan', rate: 0.05, description: '5% on all sales' },
    ];
  }
}
