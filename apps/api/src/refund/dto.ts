import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { RefundStatus } from '@gbay/database';

export class RejectRefundDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class CreateDisputeDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  evidence?: any;
}
