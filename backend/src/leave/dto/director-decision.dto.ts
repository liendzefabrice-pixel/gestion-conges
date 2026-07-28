import { IsString, MaxLength, IsEnum } from 'class-validator';

export class DirectorDecisionDto {
  @IsEnum(['APPROUVE', 'REFUSE'], { message: 'La décision doit être APPROUVE ou REFUSE' })
  decision: 'APPROUVE' | 'REFUSE';

  @IsString({ message: 'Le commentaire du directeur est requis' })
  @MaxLength(500, { message: 'Le commentaire ne peut pas dépasser 500 caractères' })
  directorComment: string;
}
