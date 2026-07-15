import { IsString, IsInt, IsOptional, IsBoolean, MinLength, MaxLength, Min, Matches } from 'class-validator';

const namePattern = /^(?=.*[a-zA-ZÀ-ÿ\u00C0-\u024F\u1E00-\u1EFF])[a-zA-ZÀ-ÿ\u00C0-\u024F\u1E00-\u1EFF\-' ]+$/;
const nameMessage = 'Le nom ne peut contenir que des lettres, espaces, apostrophes et traits d\'union.';

export class CreateDepartmentDto {
  @IsString({ message: 'Le nom du département est obligatoire' })
  @MinLength(1, { message: 'Le nom du département est obligatoire' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  @Matches(namePattern, { message: nameMessage })
  name: string;

  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'La description ne peut pas dépasser 255 caractères' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'Le responsable sélectionné est invalide' })
  headId?: number;

  @IsOptional()
  @IsBoolean({ message: 'Le statut doit être un booléen' })
  isActive?: boolean;

  @IsOptional()
  @IsInt({ message: 'L\'effectif minimum doit être un nombre' })
  @Min(0, { message: 'L\'effectif minimum doit être un nombre positif' })
  minEmployees?: number;
}
