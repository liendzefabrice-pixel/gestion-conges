import { IsString, IsBoolean, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateHolidayDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsDateString()
  date: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
