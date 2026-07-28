import { IsString, IsDateString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';

export class CreatePermissionRequestDto {
  @IsDateString({}, { message: 'La date de début est requise et doit être une date valide' })
  startDate: string;

  @IsDateString({}, { message: 'La date de fin est requise et doit être une date valide' })
  endDate: string;

  @IsString({ message: 'Le motif est requis' })
  @MinLength(3, { message: 'Le motif doit contenir au moins 3 caractères' })
  @MaxLength(500, { message: 'Le motif ne peut pas dépasser 500 caractères' })
  reason: string;

  @IsOptional()
  @IsEnum(['PERMISSION', 'MARIAGE', 'NAISSANCE', 'DECES', 'FAMILIAL'], { message: 'Type de permission invalide' })
  permissionType?: 'PERMISSION' | 'MARIAGE' | 'NAISSANCE' | 'DECES' | 'FAMILIAL';
}
