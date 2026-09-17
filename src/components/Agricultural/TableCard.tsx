import React from 'react';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useSelector } from 'react-redux';
import { IRootState } from '../../store';

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
}

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
}) => {
    // Safety check: ensure data is always an array
    const safeData = Array.isArray(data) ? data : [];
    const safeColumns = Array.isArray(columns) ? columns : [];

    // Same source Header/Sidebar use to detect Urdu (RTL) mode.
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';

    // In RTL (Urdu) mode, flip physical 'left'/'right' alignment so columns
    // read correctly in the mirrored layout. 'center' stays untouched.
    const flipAlignment = (alignment?: string) => {
        if (!isRtl) return alignment;
        if (alignment === 'left') return 'right';
        if (alignment === 'right') return 'left';
        return alignment;
    };

    const rtlAwareColumns = safeColumns.map((col) => ({
        ...col,
        textAlignment: flipAlignment(col.textAlignment),
    }));

    return (
        <div className={`panel !rounded-[2rem] overflow-hidden commission-table-card ${className}`}>
            <style>{`
                /* ---- Mantine pagination controls (Stitch dark theme) ---- */
                .commission-table-card .mantine-Pagination-control[data-active="true"],
                .commission-table-card .mantine-Pagination-control[data-active] {
                    background-color: #16a34a !important;
                    border-color: #16a34a !important;
                    color: #fff !important;
                }
                .commission-table-card .mantine-Pagination-control[data-active="true"]:hover,
                .commission-table-card .mantine-Pagination-control[data-active]:hover {
                    background-color: #15803d !important;
                    border-color: #15803d !important;
                }
                .dark .commission-table-card .mantine-Pagination-control {
                    background-color: #09131e;
                    border-color: #182d42;
                    color: #64748b;
                    border-radius: 9999px;
                }
                .dark .commission-table-card .mantine-Pagination-control:hover {
                    color: #cbd5e1;
                    border-color: #223e5a;
                }
                .dark .commission-table-card .mantine-Pagination-control[data-active="true"],
                .dark .commission-table-card .mantine-Pagination-control[data-active] {
                    background-color: #059669 !important;
                    border-color: #059669 !important;
                    box-shadow: 0 10px 15px -3px rgba(5, 150, 105, 0.3);
                }

                /* ---- Table chrome (Stitch dark theme) ---- */
                .dark .commission-table-card .datatables table {
                    background-color: rgba(8, 17, 26, 0.4);
                }
                .dark .commission-table-card .datatables thead tr {
                    background-color: #0e1c2b;
                    border-bottom: 1px solid #162a3d;
                }
                .dark .commission-table-card .datatables thead th {
                    color: #94a3b8;
                }
                .dark .commission-table-card .datatables tbody tr {
                    border-bottom: 1px solid #132333;
                }
                .dark .commission-table-card .datatables tbody tr:hover {
                    background-color: #0c1825 !important;
                }
                .dark .commission-table-card .datatables {
                    border: 1px solid #162a3d;
                    border-radius: 0.75rem;
                    overflow: hidden;
                }
                .commission-table-card .datatables > div:last-child {
                    padding-left: 1.25rem;
                    padding-right: 1.25rem;
                    padding-top: 1rem;
                    padding-bottom: 0.25rem;
                }
            `}</style>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 pb-5 border-b border-gray-200 dark:border-[#162a3d]">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-700 shadow-md ring-1 ring-gray-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:shadow-none dark:ring-1 dark:ring-emerald-500/30">
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
                        <div className="pointer-events-none absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-3.5 rtl:pr-3.5">
                            <svg className="h-4 w-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchValue || ''}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="form-input w-full rounded-2xl border-gray-300 ltr:pl-10 rtl:pr-10 transition-all duration-300 dark:bg-[#08111a] dark:border-[#182d42] dark:text-slate-200 dark:placeholder-slate-500 focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20 dark:hover:border-[#223e5a]"
                        />
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4 dark:border-emerald-500 dark:border-t-transparent"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading data...</p>
                </div>
            ) : safeData.length === 0 ? (
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-[#0d1a27] mb-4">
                        <svg className="w-10 h-10 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        {emptyMessage}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        There are no records to display at this time.
                    </p>
                </div>
            ) : (
                <div className="datatables" dir={isRtl ? 'rtl' : 'ltr'}>
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={safeData}
                        columns={rtlAwareColumns}
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
                            return index % 2 === 0
                                ? { backgroundColor: 'rgba(45, 134, 89, 0.02)' }
                                : {};
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default TableCard;