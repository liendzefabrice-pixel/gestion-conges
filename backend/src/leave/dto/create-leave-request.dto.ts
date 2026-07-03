import {
  IsInt,
  IsString,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateLeaveRequestDto {
  @IsInt()
  leaveTypeId: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}
