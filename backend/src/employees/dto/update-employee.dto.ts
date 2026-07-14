import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, IsDateString } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['email', 'password'] as const),
) {
  @IsOptional()
  @IsInt({ message: 'Rôle invalide' })
  roleId?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La date d\'embauche est invalide' })
  hireDate?: string;
}
