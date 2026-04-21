/**
 * PichangaLibre Dashboard Cache
 * Strategy: "Stale-While-Revalidate"
 * - Show cached data immediately (instant load)
 * - Fetch fresh data in background
 * - Update UI silently when fresh data arrives
 */

const CACHE_KEY = 'pl_dashboard_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface DashboardCacheData {
  bookings: any[];
  fields: any[];
  venues: any[];
  user: any;
  clients: any[];
  timestamp: number;
}

export function getDashboardCache(): DashboardCacheData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: DashboardCacheData = JSON.parse(raw);
    // Cache is valid for 5 minutes
    if (Date.now() - data.timestamp > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

export function setDashboardCache(data: Omit<DashboardCacheData, 'timestamp'>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
  } catch {
    // localStorage might be full, fail silently
  }
}

export function clearDashboardCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch { /* noop */ }
}
