// src/types/index.ts
export interface Cabinet {
    id: string;
    number: string;
    building: string;
    floor: number;
    status: 'clean' | 'dirty' | 'in-progress';
    lastCleanedAt: string | null;
    lastCleanerId?: string;
    lastCleanerName?: string;
    qrCode: string;
    notes?: string;
}

export interface CleaningReport {
    id: string;
    cabinetId: string;
    cabinetNumber: string;
    cabinetBuilding: string;
    cleanerId: string;
    cleanerName: string;
    startedAt: string;
    completedAt: string;
    duration: number; // в минутах
    status: 'pending' | 'verified' | 'rejected';
    photos?: string[];
    notes?: string;
    verifiedBy?: string;
    verifiedAt?: string;
    rejectionReason?: string;
}

export interface Cleaner {
    id: string;
    name: string;
    email: string;
    phone?: string;
    shift: 'morning' | 'afternoon' | 'night';
    active: boolean;
    rating: number; // 0-5
    totalCleanings: number;
    lastActiveAt?: string;
}

export interface DashboardStats {
    totalCabinets: number;
    cleanToday: number;
    dirtyCabinets: number;
    pendingVerification: number;
    activeCleaners: number;
    avgCleaningTime: number;
    completionRate: number; // процент выполненных уборок
}