import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CART_REPOSITORY, CartRepository, CartView } from './cart.types';
import { CreateCartItemDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY) private readonly repository: CartRepository,
  ) {}

  async getOrCreateCart(userId?: string, sessionToken?: string): Promise<CartView> {
    let cart: CartView | null = null;

    if (userId) {
      cart = await this.repository.findActiveByUserId(userId);
      // If user has a sessionToken from guest browsing, merge it
      if (sessionToken) {
        const guestCart = await this.repository.findActiveBySessionToken(sessionToken);
        if (guestCart) {
          if (!cart) {
            // Convert guest cart to user cart
            // We'll just create a new one for simplicity or update the guest one
            cart = await this.repository.createCart({
              userId,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });
          }
          await this.repository.mergeCarts(guestCart.id, cart.id);
          // Re-fetch with merged items
          cart = await this.repository.findActiveByUserId(userId);
        }
      }
    } else if (sessionToken) {
      cart = await this.repository.findActiveBySessionToken(sessionToken);
    }

    if (!cart) {
      cart = await this.repository.createCart({
        userId,
        sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    }

    return cart!;
  }

  async addItem(cartId: string, dto: CreateCartItemDto) {
    return this.repository.addItem({
      cartId,
      listingId: dto.listingId,
      quantity: dto.quantity,
    });
  }

  async updateItem(itemId: string, dto: UpdateCartItemDto) {
    return this.repository.updateItemQuantity(itemId, dto.quantity);
  }

  async removeItem(itemId: string) {
    return this.repository.removeItem(itemId);
  }

  async cleanupAbandonedCarts() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.repository.markAsAbandoned(sevenDaysAgo);
  }
}
