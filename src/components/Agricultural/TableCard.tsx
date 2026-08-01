import React from 'react';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';

interface TableCardProps {
    title: string;
    description?: string;
    data: any[];
    columns: any[];
    loading?: boolean;
    page?: number;
    pageSize?: number;
    totalRecords?: number;
    onPageChange?: (page: number) => void;
    onRecordsPerPageChange?: (pageSize: number) => void;
    sortStatus?: DataTableSortStatus;
    onSortStatusChange?: (sortStatus: DataTableSortStatus) => void;
    recordsPerPageOptions?: number[];
    emptyMessage?: string;
    actions?: React.ReactNode;
    className?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    idAccessor?: string | ((record: any) => React.Key);
    accent?: 'blue' | 'green';
}

const ACCENTS = {
    blue: {
        badge: 'bg-white text-primary-700 shadow-md ring-1 ring-gray-100 dark:bg-primary-900/30 dark:text-primary-300 dark:shadow-none dark:ring-0',
        ring: 'focus:border-primary-500 focus:ring-primary-500/20',
        spinner: 'border-primary border-t-transparent',
        emptyIcon: 'text-gray-400 dark:text-gray-500',
        stripe: 'rgba(45,134,89,0.02)',
    },
    green: {
        badge: 'bg-white text-success shadow-md ring-1 ring-gray-100 dark:bg-success/20 dark:text-success-light dark:shadow-none dark:ring-0',
        ring: 'focus:border-success focus:ring-success/20',
        spinner: 'border-success border-t-transparent',
        emptyIcon: 'text-gray-400 dark:text-gray-500',
        stripe: 'rgba(45,134,89,0.035)',
    },
};

const TableCard: React.FC<TableCardProps> = ({
    title,
    description,
    data,
    columns,
    loading = false,
    page = 1,
    pageSize = 10,
    totalRecords,
    onPageChange,
    onRecordsPerPageChange,
    sortStatus,
    onSortStatusChange,
    recordsPerPageOptions = [10, 25, 50, 100],
    emptyMessage = 'No records found',
    actions,
    className = '',
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...',
    idAccessor,
    accent = 'blue',
}) => {
    const safeData = Array.isArray(data) ? data : [];
    const safeColumns = Array.isArray(columns) ? columns : [];
    const theme = ACCENTS[accent];
    const isSearching = Boolean(onSearchChange && searchValue && searchValue.trim().length > 0);

    return (
        <div
            className={`relative overflow-hidden rounded-[2rem] border border-[#ebedf2] bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:border-[#191e3a] dark:bg-gray-900 ${className}`}
        >
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${theme.badge}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </span>
                    <div>
                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h5>
                        {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
                    </div>
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>

            {/* Search Bar */}
            {onSearchChange && (
                <div className="mb-6">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchValue || ''}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className={`form-input w-full rounded-2xl border-gray-300 pl-10 pr-10 transition-all duration-300 dark:border-gray-600 focus:ring-2 ${theme.ring}`}
                        />
                        {isSearching && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                aria-label="Clear search"
                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="py-16 text-center">
                    <div className={`mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 ${theme.spinner}`}></div>
                    <p className="font-medium text-gray-600 dark:text-gray-400">Loading data...</p>
                </div>
            ) : safeData.length === 0 ? (
                <div className="py-16 text-center">
                    <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <svg className={`h-10 w-10 ${theme.emptyIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isSearching ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            )}
                        </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {isSearching ? `No results for "${searchValue}"` : emptyMessage}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isSearching ? 'Try a different search term.' : 'There are no records to display at this time.'}
                    </p>
                    {isSearching && (
                        <button
                            type="button"
                            onClick={() => onSearchChange && onSearchChange('')}
                            className={`mt-4 inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${theme.badge} hover:opacity-80`}
                        >
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <div className="datatables overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={safeData}
                        columns={safeColumns}
                        idAccessor={typeof idAccessor === 'string' ? idAccessor : undefined}
                        totalRecords={totalRecords || safeData.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={onPageChange}
                        recordsPerPageOptions={recordsPerPageOptions}
                        onRecordsPerPageChange={onRecordsPerPageChange}
                        sortStatus={sortStatus}
                        onSortStatusChange={onSortStatusChange}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) =>
                            `Showing ${from} to ${to} of ${totalRecords} entries`
                        }
                        noRecordsText={emptyMessage}
                        rowStyle={(record, index) => {
                            return index % 2 === 0 ? { backgroundColor: theme.stripe } : {};
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default TableCard;