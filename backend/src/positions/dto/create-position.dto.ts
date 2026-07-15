import { IsString, IsOptional, IsBoolean, IsInt, MinLength, MaxLength, Matches } from 'class-validator';

const namePattern = /^(?=.*[a-zA-ZÀ-ÿ\u00C0-\u024F\u1E00-\u1EFF])[a-zA-ZÀ-ÿ\u00C0-\u024F\u1E00-\u1EFF\-' ]+$/;
const nameMessage = 'Le nom ne peut contenir que des lettres, espaces, apostrophes et traits d\'union.';

export class CreatePositionDto {
  @IsString({ message: 'Le nom du poste est obligatoire' })
  @MinLength(1, { message: 'Le nom du poste est obligatoire' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  @Matches(namePattern, { message: nameMessage })
  name: string;

  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'La description ne peut pas dépasser 255 caractères' })
  description?: string;

  @IsInt({ message: 'Veuillez sélectionner un département' })
  departmentId: number;

  @IsOptional()
  @IsBoolean({ message: 'Le statut doit être un booléen' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Le statut critique doit être un booléen' })
  isCritical?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Le statut de remplacement doit être un booléen' })
  canBeReplaced?: boolean;
}
