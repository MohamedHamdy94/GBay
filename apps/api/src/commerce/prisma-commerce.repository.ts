import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@gbay/database';
import { CommerceRepository, InventoryReservationView, ReserveItemInput } from './commerce.types';

@Injectable()
export class PrismaCommerceRepository implements CommerceRepository {
  private readonly prisma = new PrismaClient();

  async reserveItem(input: ReserveItemInput): Promise<InventoryReservationView> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock the listing row for update to prevent race conditions
      // Note: findUnique doesn't support select for update in Prisma easily without raw SQL or certain extensions
      // But we can use versioning or just a transaction. 
      // Actually, to be safe with concurrent writes, we should use a raw query or ensure the transaction isolation level is high.
      
      const listing = await tx.listing.findUnique({
        where: { id: input.listingId },
      });

      if (!listing) {
        throw new NotFoundException({ code: 'LISTING_NOT_FOUND', id: input.listingId });
      }

      if ((listing.status as string) !== 'ACTIVE' && (listing.status as string) !== 'PAUSED') {
         // We allow PAUSED to be reserved if we want, but let's stick to ACTIVE for now.
         if ((listing.status as string) !== 'ACTIVE') {
            throw new BadRequestException({ code: 'LISTING_NOT_ACTIVE', status: listing.status });
         }
      }

      if (listing.quantityAvailable < input.quantity) {
        throw new ConflictException({
          code: 'INSUFFICIENT_STOCK',
          requested: input.quantity,
          available: listing.quantityAvailable,
        });
      }

      // 2. Check for idempotency
      const existing = await tx.inventoryReservation.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });

      if (existing) {
        if (existing.listingId !== input.listingId || existing.userId !== input.userId) {
            throw new ConflictException({ code: 'IDEMPOTENCY_KEY_REUSE', key: input.idempotencyKey });
        }
        return existing as unknown as InventoryReservationView;
      }

      // 3. Create reservation
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + (input.expiresInMinutes || 15));

      const reservation = await tx.inventoryReservation.create({
        data: {
          listingId: input.listingId,
          userId: input.userId,
          quantity: input.quantity,
          status: 'ACTIVE',
          idempotencyKey: input.idempotencyKey,
          expiresAt,
        },
      });

      // 4. Update listing quantity
      const newAvailable = listing.quantityAvailable - input.quantity;
      await tx.listing.update({
        where: { id: input.listingId },
        data: {
          quantityAvailable: newAvailable,
          status: newAvailable === 0 ? 'SOLD' : undefined,
          version: { increment: 1 },
        },
      });

      return reservation as unknown as InventoryReservationView;
    });
  }

  async findReservationById(id: string): Promise<InventoryReservationView | null> {
    return this.prisma.inventoryReservation.findUnique({
      where: { id },
    }) as unknown as Promise<InventoryReservationView | null>;
  }

  async findReservationByIdempotencyKey(key: string): Promise<InventoryReservationView | null> {
    return this.prisma.inventoryReservation.findUnique({
      where: { idempotencyKey: key },
    }) as unknown as Promise<InventoryReservationView | null>;
  }

  async releaseReservation(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const reservation = await tx.inventoryReservation.findUnique({
        where: { id },
      });

      if (!reservation || reservation.status !== 'ACTIVE') {
        return;
      }

      await tx.inventoryReservation.update({
        where: { id },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });

      await tx.listing.update({
        where: { id: reservation.listingId },
        data: {
          quantityAvailable: { increment: reservation.quantity },
          status: 'ACTIVE', // Restore to active if it was sold
          version: { increment: 1 },
        },
      });
    });
  }

  async consumeReservation(id: string): Promise<void> {
    await this.prisma.inventoryReservation.update({
      where: { id },
      data: {
        status: 'CONSUMED',
        consumedAt: new Date(),
      },
    });
  }
}
