import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
