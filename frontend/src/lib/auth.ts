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

// ── Resume API functions ──────────────────────────────────────────────────

export interface Resume {
    id: string;
    original_filename: string;
    ats_score: number;
    skills: string[];
    ai_suggestions: AISuggestions;
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
    is_active: boolean;
    created_at: string;
}

export interface AISuggestions {
    summary_feedback: string;
    ats_analysis: string;
    missing_skills: string[];
    improvements: { section: string; issue: string; fix: string }[];
    action_items: string[];
    strengths: string[];
    error?: string;
}

export interface ResumeStatus {
    id: string;
    status: string;
    ats_score: number;
}

// Upload a resume PDF
export const uploadResume = async (file: File): Promise<Resume> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/resume/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// Get all resumes
export const getResumes = async (): Promise<Resume[]> => {
    const response = await api.get('/api/resume/');
    return response.data.results || response.data;
};

// Get resume status
export const getResumeStatus = async (id: string): Promise<ResumeStatus> => {
    const response = await api.get(`/api/resume/${id}/status/`);
    return response.data;
};

// Get resume suggestions
export const getResumeSuggestions = async (id: string) => {
    const response = await api.get(`/api/resume/${id}/suggestions/`);
    return response.data;
};

// Delete resume
export const deleteResume = async (id: string): Promise<void> => {
    await api.delete(`/api/resume/${id}/delete/`);
};

// ── Roadmap API functions ─────────────────────────────────────────────────

export interface RoadmapWeek {
    week: number;
    theme: string;
    focus: string;
    daily_tasks: string[];
    resources: string[];
    goal: string;
    skills_covered: string[];
}

export interface RoadmapContent {
    target_role: string;
    summary: string;
    weeks: RoadmapWeek[];
    key_topics: string[];
    interview_tips: string[];
    error?: string;
}

export interface Roadmap {
    id: string;
    target_role: string;
    content: RoadmapContent;
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
    created_at: string;
}

export const generateRoadmap = async (
    target_role: string,
    resume_id?: string
): Promise<Roadmap> => {
    const response = await api.post('/api/roadmap/generate/', {
        target_role,
        resume_id: resume_id || null,
    });
    return response.data;
};

export const getRoadmap = async (): Promise<Roadmap | null> => {
    const response = await api.get('/api/roadmap/');
    return response.data.roadmap || response.data;
};

export const getRoadmapById = async (id: string): Promise<Roadmap> => {
    const response = await api.get(`/api/roadmap/${id}/`);
    return response.data;
};

export const getRoadmapStatus = async (id: string) => {
    const response = await api.get(`/api/roadmap/${id}/status/`);
    return response.data;
};