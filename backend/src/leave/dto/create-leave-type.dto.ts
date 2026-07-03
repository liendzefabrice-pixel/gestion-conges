import { IsString, IsInt, IsOptional, MinLength, MaxLength, Min } from 'class-validator';

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
}
