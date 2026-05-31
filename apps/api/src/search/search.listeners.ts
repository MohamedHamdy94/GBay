import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SearchListeners {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @OnEvent('product.created')
  async handleProductCreated(payload: { productId: string; sellerId: string }) {
    await this.queueListingJobsForProduct(payload.productId, 'INDEX');
  }

  @OnEvent('product.updated')
  async handleProductUpdated(payload: { productId: string; sellerId: string }) {
    await this.queueListingJobsForProduct(payload.productId, 'UPDATE');
  }

  @OnEvent('product.deleted')
  async handleProductDeleted(payload: { productId: string; sellerId: string }) {
    // We need to know which listings were deleted. 
    // Usually, we should queue this BEFORE deletion or have a soft delete.
    // For now, let's assume we have listing IDs or we find them.
    const listings = await this.prisma.listing.findMany({
      where: { productId: payload.productId },
    });
    for (const listing of listings) {
      await this.prisma.searchIndexJob.create({
        data: {
          entityType: 'LISTING',
          entityId: listing.id,
          operation: 'DELETE',
        },
      });
    }
  }

  @OnEvent('auction.created')
  async handleAuctionCreated(payload: { auctionId: string; listingId: string }) {
    await this.prisma.searchIndexJob.create({
      data: {
        entityType: 'LISTING',
        entityId: payload.listingId,
        operation: 'UPDATE',
      },
    });
  }

  @OnEvent('auction.updated')
  async handleAuctionUpdated(payload: { auctionId: string; listingId: string }) {
    await this.prisma.searchIndexJob.create({
      data: {
        entityType: 'LISTING',
        entityId: payload.listingId,
        operation: 'UPDATE',
      },
    });
  }

  private async queueListingJobsForProduct(productId: string, operation: string) {
    const listings = await this.prisma.listing.findMany({
      where: { productId },
    });
    for (const listing of listings) {
      await this.prisma.searchIndexJob.create({
        data: {
          entityType: 'LISTING',
          entityId: listing.id,
          operation,
        },
      });
    }
  }
}
