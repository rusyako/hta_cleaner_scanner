// src/pages/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!user) {
            router.push('/login');
            return;
        }

        router.push(user.role === 'cleaner' ? '/cleaner' : '/admin');
    }, [router, user, isLoading]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Spinner size="lg" />
        </div>
    );
}
