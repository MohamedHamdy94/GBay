import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubmitSellerOnboardingDto } from './dto';
import { assertSellerTransition } from './seller-state-machine';
import { SellerRepository, SellerStatus } from './seller.types';

// We import the events here to listen to them. 
// Note: In a larger app, we might use a shared events package.
import { ProductCreatedEvent, ProductDeletedEvent } from '../catalog/catalog.events';

export const SELLER_REPOSITORY = Symbol('SELLER_REPOSITORY');

@Injectable()
export class SellerService {
  constructor(@Inject(SELLER_REPOSITORY) private readonly repository: SellerRepository) {}

  async submit(userId: string, dto: SubmitSellerOnboardingDto) {
    const existing = await this.repository.findByUserId(userId);
    if (existing) {
      if (existing.status !== 'NEEDS_MORE_INFO' && existing.status !== 'REJECTED') {
        throw new ConflictException({ code: 'SELLER_ONBOARDING_ALREADY_EXISTS', status: existing.status });
      }
      assertSellerTransition(existing.status, 'SUBMITTED');
      return this.repository.transition({ sellerProfileId: existing.id, toStatus: 'SUBMITTED', actorUserId: userId, reason: 'Seller resubmitted onboarding' });
    }
    return this.repository.createSubmitted({
      userId,
      displayName: dto.displayName,
      businessName: dto.businessName,
      businessType: dto.businessType,
      countryCode: dto.countryCode,
      payoutCurrency: dto.payoutCurrency ?? 'EUR',
    });
  }

  async getMine(userId: string) {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundException({ code: 'SELLER_PROFILE_NOT_FOUND' });
    return profile;
  }

  async getDashboard(userId: string) {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundException({ code: 'SELLER_PROFILE_NOT_FOUND' });

    let metrics = await this.repository.getDashboardMetrics(profile.id);

    // If no metrics exist yet, return an empty initialized state (or trigger initial sync)
    if (!metrics) {
      metrics = await this.repository.upsertDashboardMetrics(profile.id, {});
      // Trigger initial refresh
      return this.refreshDashboardMetrics(profile.id);
    }

    return metrics;
  }

  async refreshDashboardMetrics(sellerId: string) {
    const totalListings = await this.repository.countProducts(sellerId);
    const recentOrders = await this.repository.getRecentOrders(sellerId, 5);
    
    // In a real scenario, we would also query active auctions, sold items, etc.
    // For now, we only have totalListings and recentOrders.
    
    return this.repository.upsertDashboardMetrics(sellerId, {
      totalListings,
      recentOrders,
    });
  }

  async updateDashboardMetrics(sellerId: string, data: { averageRating?: number; reviewCount?: number }) {
    return this.repository.upsertDashboardMetrics(sellerId, data as any);
  }

  @OnEvent('product.created')
  async handleProductCreated(event: ProductCreatedEvent) {
    await this.refreshDashboardMetrics(event.sellerId);
  }

  @OnEvent('product.deleted')
  async handleProductDeleted(event: ProductDeletedEvent) {
    await this.refreshDashboardMetrics(event.sellerId);
  }

  @OnEvent('order.confirmed')
  async handleOrderConfirmed(event: { orderId: string, sellerId: string }) {
    await this.refreshDashboardMetrics(event.sellerId);
  }

  async review(sellerProfileId: string, toStatus: SellerStatus, actorUserId: string | undefined, reason?: string) {
    const profile = await this.repository.findById(sellerProfileId);
    if (!profile) throw new NotFoundException({ code: 'SELLER_PROFILE_NOT_FOUND' });
    assertSellerTransition(profile.status, toStatus);
    return this.repository.transition({ sellerProfileId, toStatus, actorUserId, reason });
  }

  async getSeller(id: string) {
    const profile = await this.repository.findById(id);
    if (!profile) throw new NotFoundException({ code: 'SELLER_PROFILE_NOT_FOUND' });
    return profile;
  }

  async getSellerByUserId(userId: string) {
    return this.repository.findByUserId(userId);
  }
}
