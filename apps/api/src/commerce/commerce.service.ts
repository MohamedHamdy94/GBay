import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommerceRepository, ReserveItemInput, COMMERCE_REPOSITORY } from './commerce.types';

@Injectable()
export class CommerceService {
  constructor(
    @Inject(COMMERCE_REPOSITORY) private readonly repository: CommerceRepository,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
  ) {}

  async reserveItem(input: ReserveItemInput) {
    const reservation = await this.repository.reserveItem(input);
    this.eventEmitter.emit('inventory.reserved', {
      reservationId: reservation.id,
      listingId: reservation.listingId,
      userId: reservation.userId,
      quantity: reservation.quantity,
    });
    return reservation;
  }

  async getReservation(id: string) {
    return this.repository.findReservationById(id);
  }

  async releaseReservation(id: string) {
    await this.repository.releaseReservation(id);
    this.eventEmitter.emit('inventory.released', { reservationId: id });
  }

  async consumeReservation(id: string) {
    await this.repository.consumeReservation(id);
    this.eventEmitter.emit('inventory.consumed', { reservationId: id });
  }
}
