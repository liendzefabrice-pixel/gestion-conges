import {
  IsString,
  IsEmail,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsDateString()
  hireDate: string;

  @IsString()
  @MaxLength(100)
  position: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsInt()
  departmentId: number;

  @IsOptional()
  @IsInt()
  serviceId?: number;
}
