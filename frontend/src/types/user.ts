import { PlanType, PlanPermissions } from './common';
import { DashboardLayouts, LayoutItem } from './dashboard';

export type UserRole = 'ADMIN' | 'USER' | 'SUPER_ADMIN';

export interface UserFeatureOverrides extends PlanPermissions {
    dashboardLayouts?: DashboardLayouts;
    dashboardLayout?: LayoutItem[];
    dashboardVersion?: string;
    [key: string]: any;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    isActive: boolean;
    plan: PlanType;
    subscriptionEndsAt?: string;
    themePreference: string;
    emailNotifications: boolean;
    featureOverrides?: UserFeatureOverrides | string;
    createdAt: string;
    updatedAt: string;
}

export interface UserWithPermissions extends User {
    planPermissions?: PlanPermissions;
}


