import { IsString, IsOptional } from 'class-validator';

export class UpdateVenueDto {
  @IsString({ message: 'El nombre de la sede debe ser una cadena de texto.' })
  @IsOptional()
  name?: string;

  @IsString({
    message: 'La dirección de la sede debe ser una cadena de texto.',
  })
  @IsOptional()
  address?: string;

  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @IsOptional()
  description?: string;
}
