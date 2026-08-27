export interface Field {
    id: string;
    name: string;
    type: string;
    surface?: string;
    pricePerHour: number;
    venueId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}

export interface LiveField extends Field {
    isOccupied: boolean;
    booking: any | null; // Will be Booking type later
    progress: number;
    remainingMins: number;
}
