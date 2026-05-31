import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum LocaleDto {
  en = 'en',
  de = 'de',
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(LocaleDto)
  preferredLanguage?: LocaleDto;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  @MinLength(32)
  refreshToken!: string;
}
