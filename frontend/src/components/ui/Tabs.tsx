// src/components/ui/Tabs.tsx
import { ReactNode, useState } from 'react';
import { cn } from '@/utils/cn';

export interface TabItem {
    id: string;
    label: string;
    content: ReactNode;
    disabled?: boolean;
}

export interface TabsProps {
    tabs: TabItem[];
    defaultTab?: string;
    onChange?: (tabId: string) => void;
    variant?: 'default' | 'pills' | 'underline';
    fullWidth?: boolean;
}

export function Tabs({ tabs, defaultTab, onChange, variant = 'default', fullWidth = false }: TabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    const handleTabChange = (tabId: string) => {
        if (tabs.find(t => t.id === tabId)?.disabled) return;
        setActiveTab(tabId);
        onChange?.(tabId);
    };

    const variantClasses = {
        default: 'border-b border-gray-200 dark:border-gray-700',
        pills: 'space-x-2',
        underline: 'border-b border-gray-200 dark:border-gray-700',
    };

    const buttonClasses = (tab: TabItem, isActive: boolean) => {
        if (variant === 'pills') {
            return cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                tab.disabled && 'cursor-not-allowed opacity-50'
            );
        }

        if (variant === 'underline') {
            return cn(
                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
                tab.disabled && 'cursor-not-allowed opacity-50'
            );
        }

        // default variant
        return cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            isActive
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
            tab.disabled && 'cursor-not-allowed opacity-50'
        );
    };

    return (
        <div>
            <div className={cn('flex', variantClasses[variant], fullWidth && 'w-full')}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        disabled={tab.disabled}
                        className={cn(
                            buttonClasses(tab, activeTab === tab.id),
                            fullWidth && 'flex-1 justify-center'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="mt-4">
                {tabs.find((tab) => tab.id === activeTab)?.content}
            </div>
        </div>
    );
}