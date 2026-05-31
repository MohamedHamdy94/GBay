import { IsEnum, IsString, IsOptional, IsJSON, IsBoolean } from 'class-validator';
import { FraudAction, FraudSeverity, FraudSignalStatus } from '@prisma/client';

export class CreateFraudRuleDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsJSON()
  condition: any;

  @IsEnum(FraudAction)
  action!: FraudAction;

  @IsEnum(FraudSeverity)
  severity!: FraudSeverity;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class ResolveFraudSignalDto {
  @IsString()
  resolution!: string;

  @IsEnum(FraudSignalStatus)
  status!: FraudSignalStatus;
}
