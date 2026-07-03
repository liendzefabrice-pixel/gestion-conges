import { IsString, IsOptional, MaxLength } from 'class-validator';

export class HrReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  hrComment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  hrOpinion?: string;
}
