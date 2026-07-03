import { IsString, IsDateString, MinLength, MaxLength } from 'class-validator';

export class CreatePermissionRequestDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}
