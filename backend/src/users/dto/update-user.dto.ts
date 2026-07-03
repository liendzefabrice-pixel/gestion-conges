import { IsInt, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsInt()
  roleId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
