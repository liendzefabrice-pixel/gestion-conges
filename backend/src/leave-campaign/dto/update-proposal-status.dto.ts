import { IsString, IsIn } from 'class-validator';

export class UpdateProposalStatusDto {
  @IsString()
  @IsIn(['RECUE', 'EN_ANALYSE', 'ACCEPTEE', 'REPROGRAMMEE', 'REFUSEE'])
  status: string;
}
