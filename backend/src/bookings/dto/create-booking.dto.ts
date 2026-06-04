import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsUUID,
  IsDateString,
  ValidateIf,
} from 'class-validator';

export class CreateBookingDto {
  @IsDateString(
    {},
    { message: 'La fecha de inicio debe ser una fecha ISO válida.' },
  )
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria.' })
  startTime: string;

  @IsDateString(
    {},
    { message: 'La fecha de fin debe ser una fecha ISO válida.' },
  )
  @IsNotEmpty({ message: 'La fecha de fin es obligatoria.' })
  endTime: string;

  @IsNumber({}, { message: 'El precio total debe ser un número válido.' })
  @IsPositive({ message: 'El precio total debe ser un valor positivo.' })
  @IsNotEmpty({ message: 'El precio total es obligatorio.' })
  totalPrice: number;

  @IsString({
    message: 'El estado de la reserva debe ser una cadena de texto.',
  })
  @IsNotEmpty({ message: 'El estado de la reserva es obligatorio.' })
  status: string;

  @IsString({ message: 'El método de pago debe ser una cadena de texto.' })
  @IsOptional()
  paymentMethod?: string;

  @IsUUID('4', { message: 'El ID de la cancha debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID de la cancha es obligatorio.' })
  fieldId: string;

  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido.' })
  @IsOptional()
  @ValidateIf(
    (o) => o.clientId !== null && o.clientId !== '' && o.clientId !== undefined,
  )
  clientId?: string | null;
}
