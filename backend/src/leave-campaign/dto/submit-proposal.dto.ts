import { IsString, IsDateString, IsOptional, MaxLength, IsInt, Min } from 'class-validator';

export class SubmitProposalDto {
  @IsDateString()
  desiredStartDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
