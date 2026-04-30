// src/services/api.service.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Создаем экземпляр axios с базовой конфигурацией
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Добавляем Basic Auth к каждому запросу
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
    role: 'admin' | 'cleaner';
}

export interface CreateReportRequest {
    cabinet_number: string;
    checklist: string;
    photos?: string[];
}

class ApiService {
    async login(username: string, password: string): Promise<CurrentUser> {
        try {
            // Сохраняем учетные данные
            localStorage.setItem('admin_username', username);
            localStorage.setItem('admin_password', password);
            
            // Проверяем, работают ли учетные данные
            return await this.getCurrentUser();
        } catch (error) {
            // Если ошибка - удаляем учетные данные
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
    
    async getReports(cabinetNumber?: string, date?: string): Promise<Report[]> {
        const params: any = {};
        if (cabinetNumber) params.cabinet_number = cabinetNumber;
        if (date) params.date = date;
        
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
}

export const apiService = new ApiService();
