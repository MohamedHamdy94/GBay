import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateCartItemDto {
  @IsString()
  @IsNotEmpty()
  listingId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}
