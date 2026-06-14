import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsObject()
  featureOverrides?: any;

  @IsOptional()
  @IsString()
  themePreference?: string;
}
