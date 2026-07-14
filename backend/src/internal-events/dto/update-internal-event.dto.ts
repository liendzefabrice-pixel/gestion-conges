import { IsString, IsDateString, IsOptional, IsIn, IsInt, IsBoolean, MinLength } from 'class-validator';

export class UpdateInternalEventDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['SEMINAIRE', 'AUDIT', 'INVENTAIRE', 'FORMATION', 'REUNION', 'MAINTENANCE', 'FERMETURE_ANNUELLE', 'AUTRE'])
  type?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  allCompany?: boolean;

  @IsOptional()
  @IsInt()
  departmentId?: number | null;

  @IsOptional()
  @IsString()
  @IsIn(['FAIBLE', 'MOYENNE', 'HAUTE', 'CRITIQUE'])
  priority?: string;

  @IsOptional()
  @IsString()
  @IsIn(['BROUILLON', 'ACTIF', 'ARCHIVE'])
  status?: string;
}
