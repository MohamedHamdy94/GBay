import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RecommendationService } from './recommendation.service';
import { PrismaService } from '../prisma.service';
import { InteractionType } from './dto';

@Injectable()
export class RecommendationListeners {
  constructor(
    private readonly service: RecommendationService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('product.viewed')
  async handleProductViewed(payload: { userId: string; productId: string }) {
    await this.service.trackView(payload.userId, payload.productId);
  }

  @OnEvent('order.confirmed')
  async handleOrderConfirmed(payload: { orderId: string; userId?: string; items?: { productId: string }[] }) {
    let { userId, items, orderId } = payload;

    if (!orderId && (!userId || !items)) {
      return;
    }

    // If payload is incomplete, fetch from database
    if (!userId || !items) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (order) {
        userId = order.userId;
        items = order.items
          .filter(item => item.listingId !== null)
          .map(item => ({ productId: item.listingId as string }));
      }
    }

    if (userId && items) {
      for (const item of items) {
        if (item.productId) {
          // Track purchase as a CLICK interaction for now
          await this.service.trackInteraction(userId, item.productId, InteractionType.CLICK);
        }
      }
    }
  }
}
