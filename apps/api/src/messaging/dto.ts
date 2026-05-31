import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateThreadDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  disputeId?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsNotEmpty()
  @IsString()
  body!: string;
}

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  body!: string;
}
