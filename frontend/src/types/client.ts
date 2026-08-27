export interface Client {
    id: string;
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    venueId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}
