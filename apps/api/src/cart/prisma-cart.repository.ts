import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@gbay/database';
import { AddCartItemInput, CartRepository, CartView, CartItemView, CartStatus } from './cart.types';

@Injectable()
export class PrismaCartRepository implements CartRepository {
  private readonly prisma = new PrismaClient();

  async findActiveByUserId(userId: string): Promise<CartView | null> {
    return this.prisma.cart.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { items: { include: { listing: true } } },
    }) as unknown as CartView | null;
  }

  async findActiveBySessionToken(sessionToken: string): Promise<CartView | null> {
    return this.prisma.cart.findFirst({
      where: { sessionToken, status: 'ACTIVE' },
      include: { items: { include: { listing: true } } },
    }) as unknown as CartView | null;
  }

  async createCart(data: { userId?: string; sessionToken?: string; expiresAt: Date }): Promise<CartView> {
    return this.prisma.cart.create({
      data: {
        userId: data.userId,
        sessionToken: data.sessionToken,
        status: 'ACTIVE',
        expiresAt: data.expiresAt,
      },
      include: { items: true },
    }) as unknown as CartView;
  }

  async addItem(input: AddCartItemInput): Promise<CartItemView> {
    return this.prisma.cartItem.upsert({
      where: {
        cartId_listingId: {
          cartId: input.cartId,
          listingId: input.listingId,
        },
      },
      update: {
        quantity: { increment: input.quantity },
      },
      create: {
        cartId: input.cartId,
        listingId: input.listingId,
        quantity: input.quantity,
      },
    }) as unknown as CartItemView;
  }

  async updateItemQuantity(itemId: string, quantity: number): Promise<CartItemView> {
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    }) as unknown as CartItemView;
  }

  async removeItem(itemId: string): Promise<void> {
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(cartId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }

  async mergeCarts(sourceCartId: string, targetCartId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const sourceItems = await tx.cartItem.findMany({
        where: { cartId: sourceCartId },
      });

      for (const item of sourceItems) {
        await tx.cartItem.upsert({
          where: {
            cartId_listingId: {
              cartId: targetCartId,
              listingId: item.listingId,
            },
          },
          update: {
            quantity: { increment: item.quantity },
          },
          create: {
            cartId: targetCartId,
            listingId: item.listingId,
            quantity: item.quantity,
          },
        });
      }

      await tx.cart.update({
        where: { id: sourceCartId },
        data: { status: 'ABANDONED' },
      });
    });
  }

  async markAsAbandoned(olderThan: Date): Promise<number> {
    const result = await this.prisma.cart.updateMany({
      where: {
        status: 'ACTIVE',
        updatedAt: { lt: olderThan },
      },
      data: {
        status: 'ABANDONED',
      },
    });
    return result.count;
  }
}
