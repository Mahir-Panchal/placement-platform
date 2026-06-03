import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — adds JWT token to every request
api.interceptors.request.use((config) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor — handles token expiry
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        // If 401 and we haven't retried yet
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    // No refresh token — redirect to login
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // Try to get a new access token
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/token/refresh/`,
                    { refresh: refreshToken }
                );

                const { access } = response.data;
                localStorage.setItem('access_token', access);

                // Retry the original request with new token
                original.headers.Authorization = `Bearer ${access}`;
                return api(original);
            } catch {
                // Refresh failed — clear tokens and redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;