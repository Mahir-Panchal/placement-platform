import api from './api';

export interface User {
    id: string;
    email: string;
    full_name: string;
    created_at: string;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
}

export interface RegisterResponse {
    user: User;
    tokens: AuthTokens;
}

// Save tokens to localStorage
export const saveTokens = (tokens: AuthTokens) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
};

// Clear tokens from localStorage
export const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

// Check if user is logged in
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
};

// Register new user
export const register = async (
    email: string,
    password: string,
    full_name: string
): Promise<RegisterResponse> => {
    const response = await api.post('/api/auth/register/', {
        email,
        password,
        full_name,
    });
    saveTokens(response.data.tokens);
    return response.data;
};

// Login existing user
export const login = async (
    email: string,
    password: string
): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/login/', { email, password });
    saveTokens(response.data);
    return response.data;
};

// Logout
export const logout = async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
        await api.post('/api/auth/logout/', { refresh: refreshToken });
    } finally {
        clearTokens();
    }
};

// Get current user profile
export const getMe = async (): Promise<User> => {
    const response = await api.get('/api/auth/me/');
    return response.data;
};