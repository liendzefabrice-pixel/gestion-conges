import { IsString, IsOptional, MaxLength } from 'class-validator';

export class HrReviewDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  hrComment?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  hrOpinion?: string;
}
