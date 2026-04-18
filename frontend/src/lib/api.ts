import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: API_URL,
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('fieldiq_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export const venues = {
    getAll: () => api.get('/venues'),
    create: (data: any) => api.post('/venues', data),
    update: (id: string, data: any) => api.patch(`/venues/${id}`, data),
    delete: (id: string) => api.delete(`/venues/${id}`),
};


export const fields = {
    getAll: (venueId?: string) => api.get(`/fields${venueId ? `?venueId=${venueId}` : ''}`),
    create: (data: any) => api.post('/fields', data),
    update: (id: string, data: any) => api.patch(`/fields/${id}`, data),
    delete: (id: string) => api.delete(`/fields/${id}`),
};

export const clients = {
    getAll: (venueId?: string) => api.get(`/clients${venueId ? `?venueId=${venueId}` : ''}`),
    create: (data: any) => api.post('/clients', data),
    update: (id: string, data: any) => api.patch(`/clients/${id}`, data),
    delete: (id: string) => api.delete(`/clients/${id}`),
};

export const bookings = {
    getAll: () => api.get('/bookings'),
    create: (data: any) => api.post('/bookings', data),
    update: (id: string, data: any) => api.patch(`/bookings/${id}`, data),
    delete: (id: string) => api.delete(`/bookings/${id}`),
};

export const users = {
    getAll: () => api.get('/users'),
    getMe: () => api.get('/users/me'),
    updateSettings: (data: any) => api.patch('/users/me/settings', data),
    changePassword: (data: any) => api.post('/users/me/change-password', data),
};

export const plans = {
    getAll: () => api.get('/plans'),
    getAllAdmin: () => api.get('/plans/all'),
    update: (id: string, data: any) => api.patch(`/plans/${id}`, data),
    create: (data: any) => api.post('/plans', data),
};

export const audit = {
    getAll: (limit: number = 50) => api.get(`/audit?limit=${limit}`),
};

export default api;
