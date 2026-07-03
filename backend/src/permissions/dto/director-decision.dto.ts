import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';

export class DirectorDecisionDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  directorComment?: string;
}
