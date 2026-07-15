import {
  IsString,
  IsEmail,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  IsDateString,
  Matches,
} from 'class-validator';

const namePattern = /^(?=.*[a-zA-ZÀ-ÿ\u00C0-\u024F\u1E00-\u1EFF])[a-zA-ZÀ-ÿ\u00C0-\u024F\u1E00-\u1EFF\-' ]+$/;
const nameMessage = 'Le nom ne peut contenir que des lettres, espaces, apostrophes et traits d\'union.';

export class CreateEmployeeDto {
  @IsString({ message: 'Le matricule est obligatoire' })
  @MinLength(2, { message: 'Le matricule doit contenir au moins 2 caractères' })
  @MaxLength(20, { message: 'Le matricule ne peut pas dépasser 20 caractères' })
  matricule: string;

  @IsString({ message: 'Le prénom est obligatoire' })
  @MinLength(1, { message: 'Le prénom est obligatoire' })
  @MaxLength(10, { message: 'Le prénom ne peut pas dépasser 10 caractères' })
  @Matches(namePattern, { message: nameMessage })
  firstName: string;

  @IsString({ message: 'Le nom est obligatoire' })
  @MinLength(1, { message: 'Le nom est obligatoire' })
  @MaxLength(10, { message: 'Le nom ne peut pas dépasser 10 caractères' })
  @Matches(namePattern, { message: nameMessage })
  lastName: string;

  @IsDateString({}, { message: 'La date d\'embauche est invalide' })
  hireDate: string;

  @IsOptional()
  @IsString({ message: 'Le poste doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le poste ne peut pas dépasser 100 caractères' })
  position?: string;

  @IsOptional()
  @IsInt({ message: 'Le poste sélectionné est invalide' })
  positionId?: number;

  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @IsString({ message: 'Le mot de passe est obligatoire' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @IsInt({ message: 'Veuillez sélectionner un département' })
  departmentId: number;
}
