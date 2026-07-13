import { IsString, IsDateString, IsOptional, MaxLength } from 'class-validator';

export class SubmitProposalDto {
  @IsDateString()
  desiredStartDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
