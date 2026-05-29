import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateVenueDto {
    @IsString({ message: 'El nombre de la sede debe ser una cadena de texto.' })
    @IsNotEmpty({ message: 'El nombre de la sede es obligatorio.' })
    name: string;

    @IsString({ message: 'La dirección de la sede debe ser una cadena de texto.' })
    @IsNotEmpty({ message: 'La dirección de la sede es obligatoria.' })
    address: string;

    @IsString({ message: 'La descripción debe ser una cadena de texto.' })
    @IsOptional()
    description?: string;
}
