import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class InitiateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  cartId!: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @IsNotEmpty()
  shippingAddress!: any;
}

export class ConfirmCheckoutDto {
  @IsString()
  @IsNotEmpty()
  checkoutSessionId!: string;
}
