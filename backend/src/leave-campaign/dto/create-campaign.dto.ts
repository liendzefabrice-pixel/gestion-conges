import { IsString, IsInt, MinLength, Min } from 'class-validator';

export class CreateCampaignDto {
  @IsInt()
  @Min(2020)
  year: number;

  @IsString()
  @MinLength(1)
  label: string;
}
