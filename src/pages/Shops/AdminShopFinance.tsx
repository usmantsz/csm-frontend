import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { Notification } from './../../helperComponents/Notification';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { DataTableSortStatus } from 'mantine-datatable';
import TableCard from '../../components/Agricultural/TableCard';
import { confirmDelete, confirmStatusChange, showSuccess, showError } from '../../utils/sweetAlert';
import IconRefresh from '../../components/Icon/IconRefresh';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import { FaTrash } from 'react-icons/fa';

interface FinanceRecord {
    _id: string;
    finaceUserId: {
        _id: string;
        userNameF: string;
        userNameL: string;
    };
    finaceShopId: {
        _id: string;
        shopName: string;
    };
    finaceCusId: {
        _id: string;
        cusNameF: string;
        cusNameL: string;
        cusCNIC: string;
    };
    finaceCropId: {
        _id: string;
        cropName: string;
    };
    loanAmount: number;
    loanPaidAmount: number;
    finaceType: number;
    finaceRemarks: string;
    finaceStatus: number; // 0 = Active, 1 = Deleted
    createdAt: string;
}

// Small rounded "chip" action button so all row actions share one consistent look
const actionChipWide =
    'inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-colors';

const AdminShopFinance = () => {
    const { shopId } = useParams<{ shopId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'createdAt',
        direction: 'desc',
    });

    useEffect(() => {
        dispatch(setPageTitle('Shop Finance Records - Admin View'));
        fetchFinanceRecords();
    }, [shopId, token]);

    const fetchFinanceRecords = async () => {
        if (!shopId || !token) return;

        setLoading(true);
        try {
            const response = await axios.get(
                `${ServerSetting.serUrl}/api/allviewfinace`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { includeDeleted: true }, // Admin can see deleted records
                }
            );

            if (response.data.status === 200) {
                // Filter by shopId
                const filtered = (response.data.data || []).filter((record: any) => {
                    return (
                        record.finaceShopId?._id === shopId ||
                        record.finaceShopId === shopId
                    );
                });
                setFinanceRecords(filtered);
            } else {
                Notification({ text: response.data.message || 'Failed to fetch finance records', color: 'danger' });
            }
        } catch (error: any) {
            console.error('Error fetching finance records:', error);
            Notification({ text: error.response?.data?.message || 'Error fetching finance records', color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (record: FinanceRecord) => {
        const result = await confirmDelete('finance record', `Loan of Rs. ${record.loanAmount}`);
        if (!result) return;

        try {
            const response = await axios.delete(`${ServerSetting.serUrl}/api/delfinace`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { _id: record._id },
            });

            if (response.data.status === 200) {
                showSuccess('Finance record deleted successfully. Admin can restore this record.');
                fetchFinanceRecords();
            } else {
                showError(response.data.message || 'Failed to delete finance record');
            }
        } catch (error: any) {
            showError(error.response?.data?.message || 'Error deleting finance record');
        }
    };

    const handleRestore = async (record: FinanceRecord) => {
        const result = await confirmStatusChange('restore', 'finance record', `Loan of Rs. ${record.loanAmount}`);
        if (!result) return;

        try {
            const response = await axios.patch(`${ServerSetting.serUrl}/api/restorefinace`, {
                _id: record._id,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.status === 200) {
                showSuccess('Finance record restored successfully.');
                fetchFinanceRecords();
            } else {
                showError(response.data.message || 'Failed to restore finance record');
            }
        } catch (error: any) {
            showError(error.response?.data?.message || 'Error restoring finance record');
        }
    };

    const getLoanTypeLabel = (type: number) => {
        return type === 0 ? 'Loan Given' : 'Loan Returned';
    };

    // Filter records by search
    const filteredRecords = financeRecords.filter((record) => {
        const searchLower = search.toLowerCase();
        return (
            record.finaceCusId?.cusNameF?.toLowerCase().includes(searchLower) ||
            record.finaceCusId?.cusNameL?.toLowerCase().includes(searchLower) ||
            record.finaceCusId?.cusCNIC?.toString().includes(searchLower) ||
            record.finaceCropId?.cropName?.toLowerCase().includes(searchLower)
        );
    });

    // Sort records
    const sortedRecords = [...filteredRecords].sort((a, b) => {
        const aValue = a[sortStatus.columnAccessor as keyof FinanceRecord];
        const bValue = b[sortStatus.columnAccessor as keyof FinanceRecord];
        if (sortStatus.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
    });

    // Paginate
    const paginatedRecords = sortedRecords.slice((page - 1) * pageSize, page * pageSize);

    const columns = [
        {
            accessor: 'finaceCusId',
            title: 'Customer',
            render: ({ finaceCusId }: FinanceRecord) =>
                `${finaceCusId?.cusNameF || ''} ${finaceCusId?.cusNameL || ''}`,
        },
        {
            accessor: 'finaceCropId',
            title: 'Crop',
            render: ({ finaceCropId }: FinanceRecord) => finaceCropId?.cropName || '-',
        },
        {
            accessor: 'loanAmount',
            title: 'Loan Amount',
            render: ({ loanAmount }: FinanceRecord) => `Rs. ${loanAmount?.toLocaleString() || 0}`,
        },
        {
            accessor: 'finaceType',
            title: 'Type',
            render: ({ finaceType }: FinanceRecord) => (
                <span className={`badge ${finaceType === 0 ? 'badge-outline-primary' : 'badge-outline-success'}`}>
                    {getLoanTypeLabel(finaceType)}
                </span>
            ),
        },
        {
            accessor: 'finaceStatus',
            title: 'Status',
            render: ({ finaceStatus }: FinanceRecord) => (
                <span className={`badge ${finaceStatus === 0 ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                    {finaceStatus === 0 ? 'Active' : 'Deleted'}
                </span>
            ),
        },
        {
            accessor: 'createdAt',
            title: 'Date',
            render: ({ createdAt }: FinanceRecord) => {
                const date = new Date(createdAt);
                return date.toLocaleDateString('en-PK');
            },
        },
        {
            accessor: 'actions',
            title: 'Actions',
            textAlignment: 'right' as const,
            render: (record: FinanceRecord) => (
                <div className="flex items-center justify-end gap-1.5 flex-nowrap whitespace-nowrap">
                    {record.finaceStatus === 1 ? (
                        <button
                            onClick={() => handleRestore(record)}
                            className={`${actionChipWide} bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20`}
                            title="Restore Record"
                        >
                            <IconRefresh className="w-3.5 h-3.5" />
                            Restore
                        </button>
                    ) : (
                        <button
                            onClick={() => handleDelete(record)}
                            className={`${actionChipWide} bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20`}
                            title="Delete Record"
                        >
                            <FaTrash className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <TableCard
                title="Shop Finance Records (Admin View)"
                description="View and manage all finance records for this shop, including deleted ones."
                data={paginatedRecords}
                columns={columns}
                loading={loading}
                page={page}
                pageSize={pageSize}
                totalRecords={sortedRecords.length}
                onPageChange={setPage}
                onRecordsPerPageChange={setPageSize}
                sortStatus={sortStatus}
                onSortStatusChange={setSortStatus}
                recordsPerPageOptions={[10, 20, 30, 50, 100]}
                emptyMessage="No finance records found"
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by customer name, CNIC, or crop..."
                actions={
                    <button
                        onClick={() => navigate(shopId ? `/shop/view/${shopId}` : '/shop')}
                        className="flex items-center gap-2 rounded-2xl bg-[#dbeafe] px-4 py-2 text-sm font-semibold text-[#1d4ed8] transition-colors hover:bg-[#c7ddfb] dark:bg-[#1e3a8a]/30 dark:text-[#bfdbfe] dark:hover:bg-[#1e3a8a]/50"
                    >
                        <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        {shopId ? 'Back to Shop View' : 'Back to Shops List'}
                    </button>
                }
            />
        </div>
    );
};

export default AdminShopFinance;
