import { IsString, IsOptional, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class UpdateFieldDto {
    @IsString({ message: 'El nombre de la cancha debe ser una cadena de texto.' })
    @IsOptional()
    name?: string;

    @IsString({ message: 'El tipo de cancha debe ser una cadena de texto.' })
    @IsOptional()
    type?: string;

    @IsString({ message: 'La superficie de la cancha debe ser una cadena de texto.' })
    @IsOptional()
    surface?: string;

    @IsNumber({}, { message: 'El precio por hora debe ser un número válido.' })
    @IsPositive({ message: 'El precio por hora debe ser un valor positivo.' })
    @IsOptional()
    pricePerHour?: number;

    @IsUUID('4', { message: 'El ID de la sede debe ser un UUID válido.' })
    @IsOptional()
    venueId?: string;
}
