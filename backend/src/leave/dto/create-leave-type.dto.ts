import { IsString, IsInt, IsOptional, MinLength, MaxLength, Min } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString({ message: 'Le nom du type de congé est requis' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name: string;

  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'La description ne peut pas dépasser 255 caractères' })
  description?: string;

  @IsInt({ message: 'Le nombre de jours par défaut est requis et doit être un nombre' })
  @Min(0, { message: 'Le nombre de jours par défaut ne peut pas être négatif' })
  defaultDays: number;
}
