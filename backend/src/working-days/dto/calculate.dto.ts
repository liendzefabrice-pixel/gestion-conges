import { IsDateString } from 'class-validator';

export class CalculateDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
