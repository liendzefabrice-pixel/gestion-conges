import { IsString, MaxLength, IsEnum } from 'class-validator';

export class DirectorDecisionDto {
  @IsEnum(['APPROUVE', 'REFUSE'])
  decision: 'APPROUVE' | 'REFUSE';

  @IsString()
  @MaxLength(500)
  directorComment: string;
}
