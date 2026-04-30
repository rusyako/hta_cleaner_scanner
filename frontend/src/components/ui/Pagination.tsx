// src/components/ui/Pagination.tsx
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    siblingCount?: number;
    showFirstLast?: boolean;
    className?: string;
}

export function Pagination({
                               currentPage,
                               totalPages,
                               onPageChange,
                               siblingCount = 1,
                               showFirstLast = true,
                               className,
                           }: PaginationProps) {
    const range = (start: number, end: number) => {
        const length = end - start + 1;
        return Array.from({ length }, (_, i) => start + i);
    };

    const getPageNumbers = () => {
        const totalNumbers = siblingCount * 2 + 3;
        const totalBlocks = totalNumbers + 2;

        if (totalPages <= totalBlocks) {
            return range(1, totalPages);
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

        if (!shouldShowLeftDots && shouldShowRightDots) {
            const leftItemCount = 3 + 2 * siblingCount;
            const leftRange = range(1, leftItemCount);
            return [...leftRange, '...', totalPages];
        }

        if (shouldShowLeftDots && !shouldShowRightDots) {
            const rightItemCount = 3 + 2 * siblingCount;
            const rightRange = range(totalPages - rightItemCount + 1, totalPages);
            return [1, '...', ...rightRange];
        }

        if (shouldShowLeftDots && shouldShowRightDots) {
            const middleRange = range(leftSiblingIndex, rightSiblingIndex);
            return [1, '...', ...middleRange, '...', totalPages];
        }

        return range(1, totalPages);
    };

    const pages = getPageNumbers();

    return (
        <nav className={cn('flex items-center justify-between', className)}>
            <div className="flex flex-1 justify-between sm:hidden">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Назад
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Вперед
                </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        Страница <span className="font-medium">{currentPage}</span> из{' '}
                        <span className="font-medium">{totalPages}</span>
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                        {showFirstLast && (
                            <Button
                                variant="outline"
                                size="xs"
                                onClick={() => onPageChange(1)}
                                disabled={currentPage === 1}
                                className="rounded-r-none"
                            >
                                Первая
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="xs"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={cn(
                                'rounded-none',
                                !showFirstLast && 'rounded-l-md'
                            )}
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </Button>

                        {pages.map((page, index) => {
                            if (page === '...') {
                                return (
                                    <span
                                        key={`dots-${index}`}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
                                    >
                    ...
                  </span>
                                );
                            }

                            return (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? 'primary' : 'outline'}
                                    size="xs"
                                    onClick={() => onPageChange(page as number)}
                                    className="rounded-none"
                                >
                                    {page}
                                </Button>
                            );
                        })}

                        <Button
                            variant="outline"
                            size="xs"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="rounded-none"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                        {showFirstLast && (
                            <Button
                                variant="outline"
                                size="xs"
                                onClick={() => onPageChange(totalPages)}
                                disabled={currentPage === totalPages}
                                className="rounded-l-none"
                            >
                                Последняя
                            </Button>
                        )}
                    </nav>
                </div>
            </div>
        </nav>
    );
}