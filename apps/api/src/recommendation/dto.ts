import { IsEnum, IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum RecommendationType {
  BASED_ON_HISTORY = 'BASED_ON_HISTORY',
  SIMILAR_PRODUCTS = 'SIMILAR_PRODUCTS',
  TRENDING = 'TRENDING',
  FREQUENTLY_BOUGHT_TOGETHER = 'FREQUENTLY_BOUGHT_TOGETHER',
  AUCTIONS_ENDING_SOON = 'AUCTIONS_ENDING_SOON',
}

export enum InteractionType {
  VIEW = 'VIEW',
  SEARCH = 'SEARCH',
  CLICK = 'CLICK',
}

export enum TrendingWindow {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export class GetRecommendationsDto {
  @IsEnum(RecommendationType)
  type!: RecommendationType;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class RefreshRecommendationsDto {
  @IsOptional()
  @IsEnum(RecommendationType)
  type?: RecommendationType;
}
