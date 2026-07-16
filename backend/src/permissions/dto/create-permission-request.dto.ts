import { IsString, IsDateString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';

export class CreatePermissionRequestDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @MinLength(3, { message: 'Le motif doit contenir au moins 3 caractères' })
  @MaxLength(500, { message: 'Le motif ne peut pas dépasser 500 caractères' })
  reason: string;

  @IsOptional()
  @IsEnum(['PERMISSION', 'MARIAGE', 'NAISSANCE', 'DECES', 'FAMILIAL'], { message: 'Type de permission invalide' })
  permissionType?: 'PERMISSION' | 'MARIAGE' | 'NAISSANCE' | 'DECES' | 'FAMILIAL';
}
