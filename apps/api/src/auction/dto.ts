import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsDate, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum CurrencyDto {
  EUR = 'EUR',
  USD = 'USD',
}

export class CreateAuctionDto {
  @IsString()
  @IsNotEmpty()
  listingId!: string;

  @IsEnum(CurrencyDto)
  currency!: CurrencyDto;

  @IsInt()
  @Min(1)
  startPriceCents!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  reservePriceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minBidIncrementCents?: number;

  @IsDate()
  @Type(() => Date)
  startTime!: Date;

  @IsDate()
  @Type(() => Date)
  endTime!: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  antiSnipingSeconds?: number;
}

export class PlaceBidDto {
  @IsInt()
  @Min(1)
  amountCents!: number;

  @IsBoolean()
  isProxy!: boolean;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}

export class AuctionFilterDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  offset?: number;
}
