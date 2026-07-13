import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['email', 'password'] as const),
) {
  @IsOptional()
  @IsInt()
  roleId?: number;
}
