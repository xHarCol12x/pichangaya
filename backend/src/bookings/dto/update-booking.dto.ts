import { IsString, IsOptional, IsNumber, IsPositive, IsUUID, IsDateString, ValidateIf } from 'class-validator';

export class UpdateBookingDto {
    @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha ISO válida.' })
    @IsOptional()
    startTime?: string;

    @IsDateString({}, { message: 'La fecha de fin debe ser una fecha ISO válida.' })
    @IsOptional()
    endTime?: string;

    @IsNumber({}, { message: 'El precio total debe ser un número válido.' })
    @IsPositive({ message: 'El precio total debe ser un valor positivo.' })
    @IsOptional()
    totalPrice?: number;

    @IsString({ message: 'El estado de la reserva debe ser una cadena de texto.' })
    @IsOptional()
    status?: string;

    @IsString({ message: 'El método de pago debe ser una cadena de texto.' })
    @IsOptional()
    paymentMethod?: string;

    @IsUUID('4', { message: 'El ID de la cancha debe ser un UUID válido.' })
    @IsOptional()
    fieldId?: string;

    @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido.' })
    @IsOptional()
    @ValidateIf((o) => o.clientId !== null && o.clientId !== '' && o.clientId !== undefined)
    clientId?: string | null;
}
