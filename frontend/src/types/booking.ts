import { Field } from './field';
import { Client } from './client';

export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

export interface Booking {
    id: string;
    startTime: string;
    endTime: string;
    totalPrice: number;
    status: BookingStatus;
    paymentMethod?: string;
    userId: string;
    fieldId: string;
    clientId?: string;
    paymentId?: string;
    reminderSent: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    
    // Relations (Optional based on API inclusion)
    field?: Field;
    client?: Client;
}
