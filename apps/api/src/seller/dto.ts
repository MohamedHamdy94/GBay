import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export enum SellerCurrencyDto {
  EUR = 'EUR',
  USD = 'USD',
}

export class SubmitSellerOnboardingDto {
  @IsString()
  @Length(2, 80)
  displayName!: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  businessName?: string;

  @IsString()
  @Length(2, 40)
  businessType!: string;

  @IsString()
  @Length(2, 2)
  countryCode!: string;

  @IsOptional()
  @IsEnum(SellerCurrencyDto)
  payoutCurrency?: SellerCurrencyDto;
}

export class SellerReviewDto {
  @IsOptional()
  @IsString()
  @Length(3, 500)
  reason?: string;
}
