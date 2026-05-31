import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Locale } from './catalog.types';

export enum LocaleDto {
  en = 'en',
  de = 'de',
}

export class CategoryTranslationDto {
  @IsEnum(LocaleDto)
  locale!: LocaleDto;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;
}

export class CreateCategoryDto {
  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationDto)
  translations!: CategoryTranslationDto[];
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationDto)
  translations?: CategoryTranslationDto[];
}

export class ProductTranslationDto {
  @IsEnum(LocaleDto)
  locale!: LocaleDto;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}

export class MediaAssetDto {
  @IsString()
  @IsNotEmpty()
  bucketKey!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsInt()
  @Min(0)
  sizeBytes!: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class ListingDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  buyNowPriceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantityTotal?: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  sellerId!: string;

  @IsOptional()
  @IsString()
  sellerUserId?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsString()
  @IsNotEmpty()
  condition!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationDto)
  translations!: ProductTranslationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaAssetDto)
  media?: MediaAssetDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ListingDto)
  listing?: ListingDto;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationDto)
  translations?: ProductTranslationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaAssetDto)
  media?: MediaAssetDto[];
}

export class ProductFilterDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceMin?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceMax?: number;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  offset?: number;
}
