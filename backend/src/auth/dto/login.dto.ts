import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'El correo electrónico proporcionado no es válido.' })
    @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
    email: string;

    @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
    @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
    password: string;
}
