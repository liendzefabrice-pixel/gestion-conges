import { IsString, IsInt, IsOptional } from 'class-validator';

export class AdjustBalanceDto {
  @IsInt()
  delta: number;

  @IsString()
  comment: string;
}
