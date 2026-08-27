export interface ApiResponse<T> {
    data: T;
    message?: string;
    status?: number;
}

export type PlanType = 'free_trial' | 'starter' | 'pro' | 'enterprise' | 'basic' | 'super_admin';

export interface PlanPermissions {
    canDeleteBookings?: boolean;
    canExportData?: boolean;
    limitBookings?: number;
    limitVenues?: number;
    limitFields?: number;
    [key: string]: any;
}
