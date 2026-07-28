import {
  IsInt,
  IsString,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateLeaveRequestDto {
  @IsInt({ message: 'Le type de congé est requis et doit être un nombre' })
  leaveTypeId: number;

  @IsDateString({}, { message: 'La date de début est requise et doit être une date valide' })
  startDate: string;

  @IsDateString({}, { message: 'La date de fin est requise et doit être une date valide' })
  endDate: string;

  @IsString({ message: 'Le motif est requis' })
  @MinLength(3, { message: 'Le motif doit contenir au moins 3 caractères' })
  @MaxLength(500, { message: 'Le motif ne peut pas dépasser 500 caractères' })
  reason: string;
}
