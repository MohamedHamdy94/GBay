import { Injectable, Inject, BadRequestException, ConflictException } from '@nestjs/common';
import { EscrowStatus, Currency } from '@gbay/database';
import { ESCROW_REPOSITORY, IEscrowRepository, EscrowHoldView } from './escrow.types';

@Injectable()
export class EscrowService {
  constructor(
    @Inject(ESCROW_REPOSITORY)
    private escrowRepo: IEscrowRepository
  ) {}

  async createHold(data: {
    orderId: string;
    buyerId: string;
    sellerId: string;
    amountCents: number;
    currency: Currency;
  }, tx?: any): Promise<EscrowHoldView> {
    const existing = await this.escrowRepo.findByOrderId(data.orderId, tx);
    if (existing) {
      return existing;
    }
    return this.escrowRepo.createHold(data, tx);
  }

  async releaseToSeller(escrowId: string, metadata?: any, tx?: any): Promise<EscrowHoldView> {
    const hold = await this.getHoldOrThrow(escrowId, tx);
    if (hold.status === EscrowStatus.RELEASED_TO_SELLER) return hold;
    if (hold.status !== EscrowStatus.HELD && hold.status !== EscrowStatus.DISPUTED) {
      throw new ConflictException(`Cannot release escrow in status ${hold.status}`);
    }
    return this.escrowRepo.updateStatus(escrowId, EscrowStatus.RELEASED_TO_SELLER, metadata, tx);
  }

  async refundToBuyer(escrowId: string, metadata?: any, tx?: any): Promise<EscrowHoldView> {
    const hold = await this.getHoldOrThrow(escrowId, tx);
    if (hold.status === EscrowStatus.REFUNDED_TO_BUYER) return hold;
    if (hold.status !== EscrowStatus.HELD && hold.status !== EscrowStatus.DISPUTED) {
      throw new ConflictException(`Cannot refund escrow in status ${hold.status}`);
    }
    return this.escrowRepo.updateStatus(escrowId, EscrowStatus.REFUNDED_TO_BUYER, metadata, tx);
  }

  async disputeEscrow(escrowId: string, metadata?: any, tx?: any): Promise<EscrowHoldView> {
    const hold = await this.getHoldOrThrow(escrowId, tx);
    if (hold.status === EscrowStatus.DISPUTED) return hold;
    if (hold.status !== EscrowStatus.HELD) {
      throw new ConflictException(`Only HELD escrow can be disputed`);
    }
    return this.escrowRepo.updateStatus(escrowId, EscrowStatus.DISPUTED, metadata, tx);
  }

  async getHold(id: string, tx?: any): Promise<EscrowHoldView | null> {
    return this.escrowRepo.findById(id, tx);
  }

  async getHoldByOrderId(orderId: string, tx?: any): Promise<EscrowHoldView | null> {
    return this.escrowRepo.findByOrderId(orderId, tx);
  }

  async getAllEscrows(filters?: {
    buyerId?: string;
    sellerId?: string;
    status?: EscrowStatus;
  }, tx?: any): Promise<EscrowHoldView[]> {
    return this.escrowRepo.findAll(filters, tx);
  }

  private async getHoldOrThrow(id: string, tx?: any): Promise<EscrowHoldView> {
    const hold = await this.escrowRepo.findById(id, tx);
    if (!hold) {
      throw new BadRequestException(`Escrow hold ${id} not found`);
    }
    return hold;
  }
}
