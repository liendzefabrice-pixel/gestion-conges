import { IsString, IsEmail, IsInt, IsOptional, MinLength, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsString()
  @IsIn(['Homme', 'Femme'])
  gender: string;

  @IsInt()
  roleId: number;

  @IsOptional()
  @IsInt()
  departmentId?: number;
}
