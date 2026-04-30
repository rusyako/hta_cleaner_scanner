// src/components/ui/Dropdown.tsx
import { Fragment, ReactNode } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

export interface DropdownItem {
    label: string;
    value: string;
    icon?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    danger?: boolean;
}

export interface DropdownProps {
    trigger: ReactNode;
    items: DropdownItem[];
    align?: 'left' | 'right';
    width?: 'auto' | 'full';
}

export function Dropdown({ trigger, items, align = 'left', width = 'auto' }: DropdownProps) {
    return (
        <Menu as="div" className="relative inline-block text-left">
            <Menu.Button as={Fragment}>{trigger}</Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items
                    className={cn(
                        'absolute z-10 mt-2 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800',
                        align === 'right' ? 'right-0' : 'left-0',
                        width === 'full' ? 'w-full' : 'w-56'
                    )}
                >
                    <div className="py-1">
                        {items.map((item, index) => (
                            <Menu.Item key={index}>
                                {({ active }) => (
                                    <button
                                        onClick={item.onClick}
                                        disabled={item.disabled}
                                        className={cn(
                                            'flex w-full items-center px-4 py-2 text-sm',
                                            active && 'bg-gray-100 dark:bg-gray-700',
                                            item.disabled && 'cursor-not-allowed opacity-50',
                                            item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                                        )}
                                    >
                                        {item.icon && <span className="mr-3 h-5 w-5">{item.icon}</span>}
                                        {item.label}
                                    </button>
                                )}
                            </Menu.Item>
                        ))}
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}

export function DropdownButton({ children }: { children: ReactNode }) {
    return (
        <button className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            {children}
            <ChevronDownIcon className="ml-2 h-4 w-4" />
        </button>
    );
}