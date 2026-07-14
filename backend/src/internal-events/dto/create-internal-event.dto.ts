import { IsString, IsDateString, IsOptional, IsIn, IsInt, IsBoolean, MinLength } from 'class-validator';

export class CreateInternalEventDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsIn(['SEMINAIRE', 'AUDIT', 'INVENTAIRE', 'FORMATION', 'REUNION', 'MAINTENANCE', 'FERMETURE_ANNUELLE', 'AUTRE'])
  type: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  allCompany?: boolean;

  @IsOptional()
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['FAIBLE', 'MOYENNE', 'HAUTE', 'CRITIQUE'])
  priority?: string;

  @IsOptional()
  @IsString()
  @IsIn(['BROUILLON', 'ACTIF', 'ARCHIVE'])
  status?: string;
}
