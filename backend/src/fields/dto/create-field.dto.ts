import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateFieldDto {
    @IsString({ message: 'El nombre de la cancha debe ser una cadena de texto.' })
    @IsNotEmpty({ message: 'El nombre de la cancha es obligatorio.' })
    name: string;

    @IsString({ message: 'El tipo de cancha debe ser una cadena de texto (ej. Futsal, Fútbol 7).' })
    @IsNotEmpty({ message: 'El tipo de cancha es obligatorio.' })
    type: string;

    @IsString({ message: 'La superficie de la cancha debe ser una cadena de texto.' })
    @IsOptional()
    surface?: string;

    @IsNumber({}, { message: 'El precio por hora debe ser un número válido.' })
    @IsPositive({ message: 'El precio por hora debe ser un valor positivo.' })
    @IsNotEmpty({ message: 'El precio por hora es obligatorio.' })
    pricePerHour: number;

    @IsUUID('4', { message: 'El ID de la sede debe ser un UUID válido.' })
    @IsNotEmpty({ message: 'El ID de la sede es obligatorio.' })
    venueId: string;
}
