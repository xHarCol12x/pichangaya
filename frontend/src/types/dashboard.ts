import { Booking } from './booking';

export interface DashboardStats {
    confirmed: Booking[];
    pending: Booking[];
    todayBookings: Booking[];
    revenue: number;
    todayRevenue: number;
    occupancy: number;
}

export interface PredictionData {
    pct: string;
    avg: string;
    text: string;
}

export interface LayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    static?: boolean;
}

export interface DashboardLayouts {
    lg: LayoutItem[];
    md: LayoutItem[];
    sm: LayoutItem[];
    xs: LayoutItem[];
    xxs: LayoutItem[];
}

export interface ChartDataPoint {
    name: string;
    revenue: number;
    [key: string]: any;
}

