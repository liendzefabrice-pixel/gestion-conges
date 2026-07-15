import { IsString, IsEmail, IsInt, IsOptional, IsBoolean, MinLength, MaxLength, IsIn, Matches } from 'class-validator';

const namePattern = /^(?=.*[a-zA-ZÀ-ÿ\u00C0-\u024F\u1E00-\u1EFF])[a-zA-ZÀ-ÿ\u00C0-\u024F\u1E00-\u1EFF\-' ]+$/;
const nameMessage = 'Le nom ne peut contenir que des lettres, espaces, apostrophes et traits d\'union.';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Adresse email invalide' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Ce champ est obligatoire' })
  @MinLength(1, { message: 'Ce champ est obligatoire' })
  @MaxLength(10, { message: 'Le prénom ne peut pas dépasser 10 caractères' })
  @Matches(namePattern, { message: nameMessage })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Ce champ est obligatoire' })
  @MinLength(1, { message: 'Ce champ est obligatoire' })
  @MaxLength(10, { message: 'Le nom ne peut pas dépasser 10 caractères' })
  @Matches(namePattern, { message: nameMessage })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'Veuillez sélectionner le sexe' })
  @IsIn(['Homme', 'Femme'], { message: 'Veuillez sélectionner le sexe' })
  gender?: string;

  @IsOptional()
  @IsInt({ message: 'Veuillez sélectionner un rôle' })
  roleId?: number;

  @IsOptional()
  @IsBoolean({ message: 'Le statut doit être un booléen' })
  isActive?: boolean;
}
