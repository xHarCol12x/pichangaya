import { IsString, IsOptional, IsEmail, IsUUID } from 'class-validator';

export class UpdateClientDto {
  @IsString({ message: 'El nombre del cliente debe ser una cadena de texto.' })
  @IsOptional()
  name?: string;

  @IsString({
    message: 'El teléfono del cliente debe ser una cadena de texto.',
  })
  @IsOptional()
  phone?: string;

  @IsEmail({}, { message: 'El correo electrónico proporcionado no es válido.' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'Las notas deben ser una cadena de texto.' })
  @IsOptional()
  notes?: string;

  @IsUUID('4', { message: 'El ID de la sede debe ser un UUID válido.' })
  @IsOptional()
  venueId?: string;
}
