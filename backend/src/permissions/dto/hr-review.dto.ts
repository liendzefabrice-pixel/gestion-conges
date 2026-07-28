import { IsString, IsOptional, MaxLength } from 'class-validator';

export class HrReviewDto {
  @IsOptional()
  @IsString({ message: 'Le commentaire RH doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'Le commentaire RH ne peut pas dépasser 500 caractères' })
  hrComment?: string;

  @IsOptional()
  @IsString({ message: 'L\'avis RH doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'L\'avis RH ne peut pas dépasser 50 caractères' })
  hrOpinion?: string;
}
