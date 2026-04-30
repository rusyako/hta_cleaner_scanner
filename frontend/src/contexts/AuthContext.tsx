import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/services/api.service';
import { toast } from '@/components/ui';

interface User {
    username: string;
    full_name: string;
    role: 'admin' | 'cleaner';
}

interface LoginRequest {
    email: string;
    password: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (data: LoginRequest) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Проверка авторизации при загрузке
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        if (!apiService.isAuthenticated()) {
            setIsLoading(false);
            return;
        }

        try {
            const userInfo = await apiService.getCurrentUser();
            setUser({
                username: userInfo.username,
                full_name: userInfo.full_name,
                role: userInfo.role,
            });
        } catch (error) {
            console.error('Auth check failed:', error);
            apiService.logout();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (data: LoginRequest) => {
        setIsLoading(true);
        try {
            const userInfo = await apiService.login(data.email, data.password);
            setUser({
                username: userInfo.username,
                full_name: userInfo.full_name,
                role: userInfo.role,
            });
            toast.success(`Добро пожаловать, ${userInfo.username}!`);
        } catch (error: any) {
            console.error('Login error:', error);
            const message = error.response?.data?.detail || 'Ошибка авторизации';
            toast.error(message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            apiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            toast.success('Вы вышли из системы');
        }
    };

    return (
        <AuthContext.Provider 
            value={{ 
                user, 
                isLoading, 
                isAuthenticated: !!user,
                login, 
                logout,
                checkAuth
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
