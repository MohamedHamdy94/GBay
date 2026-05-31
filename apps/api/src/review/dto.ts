import { IsInt, IsString, Min, Max, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class ReviewResponseDto {
  id!: string;
  orderId!: string;
  reviewerId!: string;
  sellerId!: string;
  listingId!: string;
  rating!: number;
  comment!: string | null;
  createdAt!: Date;
  reviewer?: {
    name: string | null;
  };
}
