// src/services/api.service.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const username = localStorage.getItem('admin_username');
    const password = localStorage.getItem('admin_password');

    if (username && password) {
        const token = btoa(`${username}:${password}`);
        config.headers.Authorization = `Basic ${token}`;
    }

    return config;
});

export interface CabinetStatus {
    cabinet_number: string;
    status: 'green' | 'yellow';
    last_cleaned: string | null;
    cleaner_name: string | null;
}

export interface Report {
    id: number;
    timestamp: string;
    role: string;
    cabinet_number: string;
    checklist: string | null;
    photos: string[];
}

export interface Statistics {
    total_reports: number;
    cleanings_today: number;
    total_cabinets: number;
}

export interface QRLinkResponse {
    cabinet_number: string;
    link: string;
}

export interface CurrentUser {
    username: string;
    full_name: string;
    role: 'admin' | 'manager' | 'cleaner';
    manager_id: string | null;
    tabs: string[];
}

export interface CreateReportRequest {
    cabinet_number: string;
    checklist: string;
    photos?: string[];
}

export interface UserInfo {
    username: string;
    full_name: string;
    role: string;
    manager_id: string | null;
    tabs: string[];
}

export interface CreateUserRequest {
    username: string;
    password: string;
    role: string;
    full_name: string;
    manager_id?: string;
}

export interface ManagerInfo {
    username: string;
    full_name: string;
    manager_id: string | null;
}

export interface SettingsData {
    users: UserInfo[];
    available_tabs: { id: string; label: string }[];
}

class ApiService {
    async login(username: string, password: string): Promise<CurrentUser> {
        try {
            localStorage.setItem('admin_username', username);
            localStorage.setItem('admin_password', password);
            return await this.getCurrentUser();
        } catch (error) {
            localStorage.removeItem('admin_username');
            localStorage.removeItem('admin_password');
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('admin_username');
        localStorage.removeItem('admin_password');
    }

    isAuthenticated(): boolean {
        return !!(localStorage.getItem('admin_username') && localStorage.getItem('admin_password'));
    }

    async getCurrentUser(): Promise<CurrentUser> {
        const response = await apiClient.get<CurrentUser>('/me');
        return response.data;
    }

    async getCabinets(): Promise<CabinetStatus[]> {
        const response = await apiClient.get<CabinetStatus[]>('/cabinets');
        return response.data;
    }

    async getReports(cabinetNumber?: string, date?: string, cleanerUsername?: string): Promise<Report[]> {
        const params: any = {};
        if (cabinetNumber) params.cabinet_number = cabinetNumber;
        if (date) params.date = date;
        if (cleanerUsername) params.cleaner_username = cleanerUsername;
        const response = await apiClient.get<Report[]>('/reports', { params });
        return response.data;
    }

    async getReportById(id: number): Promise<Report> {
        const response = await apiClient.get<Report>(`/reports/${id}`);
        return response.data;
    }

    async generateQRLink(cabinetNumber: string): Promise<QRLinkResponse> {
        const response = await apiClient.post<QRLinkResponse>('/qr-link', {
            cabinet_number: cabinetNumber,
        });
        return response.data;
    }

    async getStatistics(): Promise<Statistics> {
        const response = await apiClient.get<Statistics>('/stats');
        return response.data;
    }

    async createReport(data: CreateReportRequest): Promise<Report> {
        const response = await apiClient.post<Report>('/reports', data);
        return response.data;
    }

    async getUsers(): Promise<UserInfo[]> {
        const response = await apiClient.get<UserInfo[]>('/users');
        return response.data;
    }

    async createUser(data: CreateUserRequest): Promise<UserInfo> {
        const response = await apiClient.post<UserInfo>('/users', data);
        return response.data;
    }

    async deleteUser(username: string): Promise<void> {
        await apiClient.delete(`/users/${username}`);
    }

    async getUserTabs(username: string): Promise<{ username: string; tabs: string[]; role: string }> {
        const response = await apiClient.get(`/users/${username}/tabs`);
        return response.data;
    }

    async setUserTabs(username: string, tabs: string[]): Promise<void> {
        await apiClient.put(`/users/${username}/tabs`, { tabs });
    }

    async getManagers(): Promise<ManagerInfo[]> {
        const response = await apiClient.get<ManagerInfo[]>('/managers');
        return response.data;
    }

    async getSettings(): Promise<SettingsData> {
        const response = await apiClient.get<SettingsData>('/settings');
        return response.data;
    }

    async deleteReport(id: number): Promise<void> {
        await apiClient.delete(`/reports/${id}`);
    }

    async updateReport(id: number, data: { checklist?: string; photos?: string[] }): Promise<Report> {
        const response = await apiClient.put<Report>(`/reports/${id}`, data);
        return response.data;
    }

    async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        await apiClient.put('/me/password', { old_password: oldPassword, new_password: newPassword });
    }

    async getCleaners(): Promise<any[]> {
        const response = await apiClient.get('/cleaners');
        return response.data;
    }

    async getAnalytics(): Promise<any> {
        const response = await apiClient.get('/analytics');
        return response.data;
    }
}

export const apiService = new ApiService();
