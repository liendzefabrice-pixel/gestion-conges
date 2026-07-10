import { IsString, IsInt, IsOptional, IsBoolean, MinLength, MaxLength, Min } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsInt()
  @Min(0)
  defaultDays: number;

  @IsOptional()
  @IsBoolean()
  requiresRhValidation?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresDirectorValidation?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresJustification?: boolean;

  @IsOptional()
  @IsBoolean()
  deductsFromAnnualBalance?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minDuration?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
