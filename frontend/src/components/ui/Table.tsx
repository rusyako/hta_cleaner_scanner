// src/components/ui/Table.tsx
import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
    striped?: boolean;
    hoverable?: boolean;
    compact?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
    ({ className, striped, hoverable, compact, ...props }, ref) => {
        return (
            <div className="relative overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table
                    ref={ref}
                    className={cn(
                        'w-full text-left text-sm',
                        compact && 'text-xs',
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);
Table.displayName = 'Table';

export const TableHead = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <thead
            ref={ref}
            className={cn(
                'border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
                className
            )}
            {...props}
        />
    )
);
TableHead.displayName = 'TableHead';

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => <tbody ref={ref} className={cn('divide-y divide-gray-200 dark:divide-gray-700', className)} {...props} />
);
TableBody.displayName = 'TableBody';

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement> & { hoverable?: boolean }>(
    ({ className, hoverable = true, ...props }, ref) => (
        <tr
            ref={ref}
            className={cn(
                hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                className
            )}
            {...props}
        />
    )
);
TableRow.displayName = 'TableRow';

export const TableHeader = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <th ref={ref} className={cn('px-4 py-3 font-medium', className)} {...props} />
    )
);
TableHeader.displayName = 'TableHeader';

export const TableCell = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <td ref={ref} className={cn('px-4 py-3', className)} {...props} />
    )
);
TableCell.displayName = 'TableCell';