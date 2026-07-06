import { IsInt, Min, Max } from 'class-validator';

export class CreateLeavePlanningDto {
  @IsInt()
  employeeId: number;

  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}
