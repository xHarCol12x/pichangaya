import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'El correo electrónico proporcionado no es válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'El rol debe ser una cadena de texto.' })
  @IsOptional()
  role?: string;

  @IsString({ message: 'El plan debe ser una cadena de texto.' })
  @IsOptional()
  plan?: string;
}
