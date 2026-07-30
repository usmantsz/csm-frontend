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

interface Expense {
    _id: string;
    userId: string;
    shopId: string;
    amountExpense: number;
    expenseRemarks: string;
    expenseDate: number;
    expeneMonth: number;
    expenseYear: number;
    expenseStatus: number; // 0 = Active, 1 = Deleted
    createdAt: string;
}

// Small rounded "chip" action button so all row actions share one consistent look
const actionChipWide =
    'inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-colors';

const AdminShopExpenses = () => {
    const { shopId } = useParams<{ shopId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'createdAt',
        direction: 'desc',
    });

    useEffect(() => {
        dispatch(setPageTitle('Shop Expenses - Admin View'));
        fetchExpenses();
    }, [shopId, token]);

    const fetchExpenses = async () => {
        if (!shopId || !token) return;

        setLoading(true);
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/viewexpense`,
                { shopId, includeDeleted: true }, // Admin can see deleted expenses
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200) {
                setExpenses(response.data.data || []);
            } else {
                Notification({ text: response.data.message || 'Failed to fetch expenses', color: 'danger' });
            }
        } catch (error: any) {
            console.error('Error fetching expenses:', error);
            Notification({ text: error.response?.data?.message || 'Error fetching expenses', color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (expense: Expense) => {
        const result = await confirmDelete('expense', `Rs. ${expense.amountExpense}`);
        if (!result) return;

        try {
            const response = await axios.delete(`${ServerSetting.serUrl}/api/delexpense`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { _id: expense._id },
            });

            if (response.data.status === 200) {
                showSuccess('Expense deleted successfully. Admin can restore this expense.');
                fetchExpenses();
            } else {
                showError(response.data.message || 'Failed to delete expense');
            }
        } catch (error: any) {
            showError(error.response?.data?.message || 'Error deleting expense');
        }
    };

    const handleRestore = async (expense: Expense) => {
        const result = await confirmStatusChange('restore', 'expense', `Rs. ${expense.amountExpense}`);
        if (!result) return;

        try {
            const response = await axios.patch(`${ServerSetting.serUrl}/api/restoreexpense`, {
                _id: expense._id,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.status === 200) {
                showSuccess('Expense restored successfully.');
                fetchExpenses();
            } else {
                showError(response.data.message || 'Failed to restore expense');
            }
        } catch (error: any) {
            showError(error.response?.data?.message || 'Error restoring expense');
        }
    };

    const formatDate = (year: number, month: number, date: number) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date} ${monthNames[month - 1]}, ${year}`;
    };

    // Filter expenses by search
    const filteredExpenses = expenses.filter((expense) => {
        const searchLower = search.toLowerCase();
        return (
            expense.expenseRemarks.toLowerCase().includes(searchLower) ||
            expense.amountExpense.toString().includes(searchLower)
        );
    });

    // Sort expenses
    const sortedExpenses = [...filteredExpenses].sort((a, b) => {
        const aValue = a[sortStatus.columnAccessor as keyof Expense];
        const bValue = b[sortStatus.columnAccessor as keyof Expense];
        if (sortStatus.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
    });

    // Paginate
    const paginatedExpenses = sortedExpenses.slice((page - 1) * pageSize, page * pageSize);

    const columns = [
        {
            accessor: 'expenseDate',
            title: 'Date',
            render: ({ expenseDate, expeneMonth, expenseYear }: Expense) =>
                formatDate(expenseYear, expeneMonth, expenseDate),
        },
        {
            accessor: 'amountExpense',
            title: 'Amount',
            sortable: true,
            render: ({ amountExpense }: Expense) => `Rs. ${amountExpense?.toLocaleString() || 0}`,
        },
        {
            accessor: 'expenseRemarks',
            title: 'Remarks',
            sortable: true,
        },
        {
            accessor: 'expenseStatus',
            title: 'Status',
            render: ({ expenseStatus }: Expense) => (
                <span className={`badge ${expenseStatus === 0 ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                    {expenseStatus === 0 ? 'Active' : 'Deleted'}
                </span>
            ),
        },
        {
            accessor: 'createdAt',
            title: 'Created',
            render: ({ createdAt }: Expense) => {
                const date = new Date(createdAt);
                return date.toLocaleDateString('en-PK');
            },
        },
        {
            accessor: 'actions',
            title: 'Actions',
            textAlignment: 'right' as const,
            render: (expense: Expense) => (
                <div className="flex items-center justify-end gap-1.5 flex-nowrap whitespace-nowrap">
                    {expense.expenseStatus === 1 ? (
                        <button
                            onClick={() => handleRestore(expense)}
                            className={`${actionChipWide} bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20`}
                            title="Restore Expense"
                        >
                            <IconRefresh className="w-3.5 h-3.5" />
                            Restore
                        </button>
                    ) : (
                        <button
                            onClick={() => handleDelete(expense)}
                            className={`${actionChipWide} bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20`}
                            title="Delete Expense"
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
                title="Shop Expenses (Admin View)"
                description="View and manage all expenses for this shop, including deleted ones."
                data={paginatedExpenses}
                columns={columns}
                loading={loading}
                page={page}
                pageSize={pageSize}
                totalRecords={sortedExpenses.length}
                onPageChange={setPage}
                onRecordsPerPageChange={setPageSize}
                sortStatus={sortStatus}
                onSortStatusChange={setSortStatus}
                recordsPerPageOptions={[10, 20, 30, 50, 100]}
                emptyMessage="No expenses found"
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by remarks or amount..."
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

export default AdminShopExpenses;
