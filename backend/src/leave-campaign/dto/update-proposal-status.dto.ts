import { IsString, IsIn, IsOptional, IsDateString } from 'class-validator';

export class UpdateProposalStatusDto {
  @IsString()
  @IsIn(['RECUE', 'EN_ANALYSE', 'ACCEPTEE', 'REPROGRAMMEE', 'REFUSEE'])
  status: string;

  @IsOptional()
  @IsDateString()
  newStartDate?: string;

  @IsOptional()
  @IsDateString()
  newEndDate?: string;
}
