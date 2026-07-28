import { IsString, IsOptional, MaxLength } from 'class-validator';

export class HrReviewDto {
  @IsString({ message: 'Le commentaire RH doit être une chaîne de caractères' })
  @IsOptional()
  @MaxLength(500, { message: 'Le commentaire RH ne peut pas dépasser 500 caractères' })
  hrComment?: string;

  @IsString({ message: 'L\'avis RH doit être une chaîne de caractères' })
  @IsOptional()
  @MaxLength(50, { message: 'L\'avis RH ne peut pas dépasser 50 caractères' })
  hrOpinion?: string;
}
