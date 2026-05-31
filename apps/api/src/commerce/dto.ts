import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class ReserveItemDto {
  @IsString()
  @IsNotEmpty()
  listingId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInMinutes?: number;
}
