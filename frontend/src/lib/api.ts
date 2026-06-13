import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Send cookies with every request
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

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

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Attempt to refresh the token
                const response = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
                const { access_token } = response.data;

                if (typeof window !== 'undefined') {
                    localStorage.setItem('fieldiq_token', access_token);
                }

                api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
                processQueue(null, access_token);
                
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                
                if (typeof window !== 'undefined') {
                    // Clear invalid session
                    localStorage.removeItem('fieldiq_token');
                    localStorage.removeItem('fieldiq_user');
                    
                    const path = window.location.pathname;
                    if (path !== '/' && !path.startsWith('/login') && !path.startsWith('/register')) {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

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
    updateSettings: (data: any) => api.patch('/users/settings', data),
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
