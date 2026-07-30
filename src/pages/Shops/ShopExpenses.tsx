import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { Notification } from './../../helperComponents/Notification';
import { useShopId } from "./../../Hooks/useShopId";
import { useAuthToken } from './../../Hooks/useAuthToken';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconCashBanknotes from '../../components/Icon/IconCashBanknotes';
import IconCalendar from '../../components/Icon/IconCalendar';
import IconPlus from '../../components/Icon/IconPlus';
import IconSearch from '../../components/Icon/IconSearch';
import { FaEdit, FaTrash, FaFilter, FaTimes } from 'react-icons/fa';
import { confirmDelete, showSuccess, showError, showLoading, closeAlert } from '../../utils/sweetAlert';

interface ExpenseRecord {
    _id: string;
    userId: string;
    shopId: string;
    amountExpense: number;
    expenseRemarks: string;
    expenseDate: number;
    expeneMonth: number;
    expenseYear: number;
    createdAt: string;
    updatedAt: string;
}

interface ExpenseSummary {
    totalExpenses: number;
    todayExpenses: number;
    monthlyExpenses: number;
    totalCount: number;
}

const ShopExpenses = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { token, user } = useAuthToken();
    const { shopId } = useShopId();

    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [9, 18, 27, 54];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<ExpenseRecord[]>([]);
    const [search, setSearch] = useState('');

    // Filter states
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Add/Edit form states
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
    const [formData, setFormData] = useState({
        amountExpense: '',
        expenseRemarks: '',
        expenseDate: new Date().toISOString().split('T')[0],
    });
    const [submitting, setSubmitting] = useState(false);

    // Summary states
    const [summary, setSummary] = useState<ExpenseSummary>({
        totalExpenses: 0,
        todayExpenses: 0,
        monthlyExpenses: 0,
        totalCount: 0,
    });

    useEffect(() => {
        dispatch(setPageTitle(t('shop_expenses_management')));
        if (shopId && token) {
            fetchShopExpenses();
        }
    }, [shopId, token, dispatch, t]);

    useEffect(() => {
        if (expenses.length > 0) {
            fetchSummary();
        }
    }, [expenses.length]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const lowerSearch = search.toLowerCase();
        let filtered = expenses;

        if (search) {
            filtered = expenses.filter((item) =>
                item.expenseRemarks.toLowerCase().includes(lowerSearch) ||
                item.amountExpense.toString().includes(lowerSearch) ||
                formatDate(item.expenseYear, item.expeneMonth, item.expenseDate).toLowerCase().includes(lowerSearch)
            );
        }

        setFilteredExpenses(filtered);
        setPage(1);
    }, [search, expenses]);

    const fetchShopExpenses = async () => {
        if (!shopId || !token) return;

        setIsLoading(true);
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/viewexpense`,
                { shopId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 200) {
                const allExpenses = response.data.data || [];

                const sortedExpenses = allExpenses.sort((a: ExpenseRecord, b: ExpenseRecord) => {
                    const dateA = new Date(a.createdAt).getTime();
                    const dateB = new Date(b.createdAt).getTime();
                    return dateB - dateA;
                });

                setExpenses(sortedExpenses);
                setFilteredExpenses(sortedExpenses);
            } else {
                Notification({ text: response.data.message || t('failed_fetch_expenses'), color: 'warning' });
            }
        } catch (error: any) {
            console.error('[fetchShopExpenses] Error:', error);
            Notification({
                text: error.response?.data?.message || 'Error fetching expenses',
                color: 'danger',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSummary = async () => {
        if (!shopId || !token || expenses.length === 0) return;

        try {
            const today = new Date();
            const currentDate = today.getDate();
            const currentMonth = today.getMonth() + 1;
            const currentYear = today.getFullYear();

            const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amountExpense) || 0), 0);

            const todayExpenses = expenses
                .filter((exp) => {
                    return (
                        exp.expenseDate === currentDate &&
                        exp.expeneMonth === currentMonth &&
                        exp.expenseYear === currentYear
                    );
                })
                .reduce((sum, exp) => sum + (Number(exp.amountExpense) || 0), 0);

            const monthlyExpenses = expenses
                .filter((exp) => {
                    return exp.expeneMonth === currentMonth && exp.expenseYear === currentYear;
                })
                .reduce((sum, exp) => sum + (Number(exp.amountExpense) || 0), 0);

            setSummary({
                totalExpenses: totalExpenses,
                todayExpenses: todayExpenses,
                monthlyExpenses: monthlyExpenses,
                totalCount: expenses.length,
            });
        } catch (error: any) {
            console.error('Error calculating summary:', error);
            const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amountExpense) || 0), 0);
            setSummary({
                totalExpenses: totalExpenses,
                todayExpenses: 0,
                monthlyExpenses: 0,
                totalCount: expenses.length,
            });
        }
    };

    const fetchFilteredExpenses = async () => {
        if (!shopId || !token) return;

        if (!filterYear && !filterMonth && !filterDate) {
            fetchShopExpenses();
            return;
        }

        setIsLoading(true);
        try {
            const filterData: any = { shopId };

            if (filterYear && filterYear.trim() !== '') {
                filterData.expenseYear = parseInt(filterYear);
            }
            if (filterMonth && filterMonth.trim() !== '') {
                filterData.expeneMonth = parseInt(filterMonth);
            }
            if (filterDate && filterDate.trim() !== '') {
                filterData.expenseDate = parseInt(filterDate);
            }

            const response = await axios.post(
                `${ServerSetting.serUrl}/api/filterExpense`,
                filterData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 200) {
                const sortedExpenses = (response.data.data || []).sort((a: ExpenseRecord, b: ExpenseRecord) => {
                    const dateA = new Date(a.createdAt).getTime();
                    const dateB = new Date(b.createdAt).getTime();
                    return dateB - dateA;
                });
                setExpenses(sortedExpenses);
                setFilteredExpenses(sortedExpenses);

                if (sortedExpenses.length === 0) {
                    Notification({
                        text: 'No expenses found for the selected filters',
                        color: 'info'
                    });
                }
            } else {
                Notification({ text: response.data.message || 'No expenses found', color: 'warning' });
            }
        } catch (error: any) {
            console.error('Error filtering expenses:', error);
            Notification({
                text: error.response?.data?.message || 'Error filtering expenses',
                color: 'danger',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddExpense = () => {
        setEditingExpense(null);
        setFormData({
            amountExpense: '',
            expenseRemarks: '',
            expenseDate: new Date().toISOString().split('T')[0],
        });
        setShowAddModal(true);
    };

    const handleEditExpense = (expense: ExpenseRecord) => {
        setEditingExpense(expense);
        const date = new Date(expense.expenseYear, expense.expeneMonth - 1, expense.expenseDate);
        setFormData({
            amountExpense: expense.amountExpense.toString(),
            expenseRemarks: expense.expenseRemarks,
            expenseDate: date.toISOString().split('T')[0],
        });
        setShowAddModal(true);
    };

    const handleDeleteExpense = async (expenseId: string) => {
        const confirmed = await confirmDelete('this expense');
        if (!confirmed) return;

        showLoading('Deleting expense...');
        try {
            const response = await axios.delete(
                `${ServerSetting.serUrl}/api/delexpense`,
                {
                    data: { _id: expenseId },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 200) {
                closeAlert();
                showSuccess('Expense deleted successfully!');
                fetchShopExpenses();
                fetchSummary();
            } else {
                closeAlert();
                showError(response.data.message || 'Failed to delete expense');
            }
        } catch (error: any) {
            console.error('Error deleting expense:', error);
            closeAlert();
            showError(error.response?.data?.message || 'Error deleting expense');
        }
    };

    const handleSubmitExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !user) return;

        const userShopId = (user as any)?.shopId || shopId;

        if (!userShopId) {
            Notification({
                text: 'Shop ID is missing. Please ensure you have a shop assigned.',
                color: 'warning'
            });
            return;
        }

        if (!formData.amountExpense || !formData.expenseRemarks || !formData.expenseDate) {
            Notification({ text: 'Please fill all fields', color: 'warning' });
            return;
        }

        setSubmitting(true);
        try {
            const selectedDate = new Date(formData.expenseDate);
            const expenseDate = selectedDate.getDate();
            const expeneMonth = selectedDate.getMonth() + 1;
            const expenseYear = selectedDate.getFullYear();

            const expenseData = {
                userId: user._id,
                shopId: userShopId,
                amountExpense: parseFloat(formData.amountExpense),
                expenseRemarks: formData.expenseRemarks,
                expenseDate: expenseDate,
                expeneMonth: expeneMonth,
                expenseYear: expenseYear,
            };

            let response;
            if (editingExpense) {
                response = await axios.patch(
                    `${ServerSetting.serUrl}/api/editexpense`,
                    { ...expenseData, _id: editingExpense._id },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } else {
                response = await axios.post(
                    `${ServerSetting.serUrl}/api/addexpense`,
                    expenseData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            }

            if (response.data.status === 200) {
                Notification({
                    text: editingExpense ? 'Expense updated successfully' : 'Expense added successfully',
                    color: 'success',
                });
                setShowAddModal(false);
                fetchShopExpenses();
                fetchSummary();
            } else {
                Notification({ text: response.data.message || 'Failed to save expense', color: 'danger' });
            }
        } catch (error: any) {
            console.error('Error saving expense:', error);
            Notification({
                text: error.response?.data?.message || 'Error saving expense',
                color: 'danger',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (year: number, month: number, date: number) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date} ${monthNames[month - 1]}, ${year}`;
    };

    const clearFilters = () => {
        setFilterYear('');
        setFilterMonth('');
        setFilterDate('');
        fetchShopExpenses();
    };

    // Pagination on filtered data
    const totalFiltered = filteredExpenses.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const paginatedExpenses = filteredExpenses.slice((page - 1) * pageSize, page * pageSize);

    const hasActiveFilters = !!(filterYear || filterMonth || filterDate);

    return (
        <div>
            {/* Summary Panel - heading replaced (Overview -> Shop Expenses Management), Add Expense button on right */}
            <div className="rounded-2xl bg-white dark:bg-[#0e1726] border border-gray-300 dark:border-white/10 shadow-md p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                            <IconCashBanknotes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </span>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('shop_expenses_management')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('exp_header_desc') || 'Manage your daily shop expenses'}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddExpense}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition whitespace-nowrap w-fit shadow-sm"
                    >
                        <IconPlus className="w-4 h-4" />
                        {t('exp_add_expense') || 'Add Expense'}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('exp_total_expenses') || 'Total Expenses'}</p>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20 shrink-0">
                                <IconCashBanknotes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-emerald-300">
                            Rs. {summary.totalExpenses.toLocaleString()}
                        </h3>
                    </div>

                    <div className="relative rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('exp_today_expenses') || "Today's Expenses"}</p>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20 shrink-0">
                                <IconCalendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-emerald-300">
                            Rs. {summary.todayExpenses.toLocaleString()}
                        </h3>
                    </div>

                    <div className="relative rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('exp_monthly_expenses') || 'Monthly Expenses'}</p>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20 shrink-0">
                                <IconCalendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-emerald-300">
                            Rs. {summary.monthlyExpenses.toLocaleString()}
                        </h3>
                    </div>

                    <div className="relative rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('exp_total_records') || 'Total Records'}</p>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20 shrink-0">
                                <IconCashBanknotes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-emerald-300">
                            {summary.totalCount}
                        </h3>
                    </div>
                </div>
            </div>

{/* Filters Card */}
<div className="rounded-xl bg-white dark:bg-[#0e1726] border border-gray-400 dark:border-white/10 shadow-md p-5 mb-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-80">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                placeholder={t('exp_search_placeholder') || 'Search by remarks or amount...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-[#171f2f] border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
        </div>

        <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition whitespace-nowrap w-fit shadow-sm"
        >
            <FaFilter className="w-3.5 h-3.5" />
            {showFilters ? (t('exp_hide_filters') || 'Hide Filters') : (t('exp_filter_by_date') || 'Filter by Date')}
            {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
        </button>
    </div>

    {showFilters && (
        <div className="pt-4 border-t border-gray-200 dark:border-white/10">
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                {t('exp_filter_hint') || 'Filter by Year only, Month only, Date only, or any combination. All fields are optional.'}
            </p>
            <div className="flex flex-wrap items-end gap-3">
                <div>
                    <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{t('exp_year') || 'Year'}</label>
                    <input
                        type="number"
                        className="w-28 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#171f2f] border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        placeholder={t('exp_year_ph') || 'e.g. 2024'}
                        min="2000"
                        max="2100"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{t('exp_month') || 'Month'}</label>
                    <input
                        type="number"
                        className="w-24 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#171f2f] border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        placeholder={t('exp_month_ph') || '1-12'}
                        min="1"
                        max="12"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{t('exp_date') || 'Date'}</label>
                    <input
                        type="number"
                        className="w-24 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#171f2f] border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        placeholder={t('exp_date_ph') || '1-31'}
                        min="1"
                        max="31"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                <button
                    type="button"
                    onClick={fetchFilteredExpenses}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition shadow-sm"
                >
                    {t('exp_apply_filter') || 'Apply Filter'}
                </button>
                <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                >
                    {t('exp_clear_all') || 'Clear All'}
                </button>
            </div>

            {hasActiveFilters && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">{t('exp_active') || 'Active:'}</span>
                    {filterYear && (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">{t('exp_year') || 'Year'}: {filterYear}</span>
                    )}
                    {filterMonth && (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">{t('exp_month') || 'Month'}: {filterMonth}</span>
                    )}
                    {filterDate && (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">{t('exp_date') || 'Date'}: {filterDate}</span>
                    )}
                </div>
            )}
        </div>
    )}
</div>

{/* Expenses Table */}
<div className="rounded-xl bg-white dark:bg-[#0e1726] border border-gray-400 dark:border-white/10 shadow-md p-5 sm:p-6">
    <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                <IconCalendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </span>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('exp_history') || 'Expense History'}</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-500 ml-12">{t('exp_history_desc') || 'View and manage all your shop expenses'}</p>
    </div>

    {isLoading ? (
        <div className="flex justify-center items-center py-20">
            <span className="animate-[spin_1s_linear_infinite] border-4 border-gray-200 dark:border-white/10 border-t-emerald-500 rounded-full w-10 h-10 inline-block"></span>
        </div>
    ) : paginatedExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🧾</div>
            <p>{t('exp_no_data') || 'No expenses found. Click "Add Expense" to add your first expense.'}</p>
        </div>
    ) : (
        <>
            <div className="overflow-x-auto -mx-5 sm:mx-0">
    <table className="w-full text-sm">
        <thead>
            <tr className="border-b border-gray-300 dark:border-white/10">
                <th className="text-start font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{t('exp_col_remarks') || 'Remarks'}</th>
                <th className="text-start font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{t('exp_col_date') || 'Date'}</th>
                <th className="text-end font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{t('exp_col_amount') || 'Amount'}</th>
                <th className="text-start font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{t('exp_col_added_on') || 'Added On'}</th>
                <th className="text-center font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{t('exp_col_actions') || 'Actions'}</th>
            </tr>
        </thead>
        <tbody>
            {paginatedExpenses.map((record) => (
                <tr
                    key={record._id}
                    className="border-b border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                >
                    <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                                <IconCashBanknotes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span
                                className="text-gray-700 dark:text-gray-300 truncate"
                                title={record.expenseRemarks}
                            >
                                {record.expenseRemarks}
                            </span>
                        </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <IconCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{formatDate(record.expenseYear, record.expeneMonth, record.expenseDate)}</span>
                        </div>
                    </td>
                    <td className="px-4 py-3 text-end whitespace-nowrap">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                            Rs. {Number(record.amountExpense).toLocaleString()}
                        </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-500 text-xs">
                        {new Date(record.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleEditExpense(record)}
                                title="Edit"
                                className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                            >
                                <FaEdit className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteExpense(record._id)}
                                title="Delete"
                                className="p-2 rounded-lg bg-red-500/10 border border-red-300 dark:border-transparent text-red-500 dark:text-red-400 hover:bg-red-500/20 transition"
                            >
                                <FaTrash className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
</div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-5 border-t border-gray-300 dark:border-white/10">
                <div className="text-sm text-gray-500 dark:text-gray-500">
                    Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalFiltered)} of {totalFiltered}
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="rounded-lg bg-gray-50 dark:bg-[#171f2f] border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                    >
                        {PAGE_SIZES.map(size => (
                            <option key={size} value={size}>{size} / page</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                    >
                        ←
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                    >
                        →
                    </button>
                </div>
            </div>
        </>
    )}
</div>

{/* Add/Edit Expense Modal */}
{showAddModal && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#0e1726] border border-gray-300 dark:border-white/10 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {editingExpense ? (t('exp_edit') || 'Edit Expense') : (t('exp_add_new') || 'Add New Expense')}
                </h3>
                <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
                >
                    <FaTimes className="w-4 h-4" />
                </button>
            </div>
            <form onSubmit={handleSubmitExpense} className="space-y-4">
                <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('exp_amount_rs') || 'Amount (Rs.)'} <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="number"
                        placeholder={t('exp_enter_amount') || 'Enter amount'}
                        value={formData.amountExpense}
                        onChange={(e) => setFormData({ ...formData, amountExpense: e.target.value })}
                        required
                        min={0}
                        step={0.01}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#171f2f] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                </div>

                <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('exp_col_remarks') || 'Remarks'} <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        placeholder={t('exp_remarks_ph') || 'Enter expense description (e.g., Electricity bill, Rent, Supplies, etc.)'}
                        value={formData.expenseRemarks}
                        onChange={(e) => setFormData({ ...formData, expenseRemarks: e.target.value })}
                        required
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#171f2f] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">{t('exp_remarks_hint') || 'Describe the expense in detail. You can write multiple lines.'}</p>
                </div>

                <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('exp_date_required') || 'Date'} <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.expenseDate}
                        onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#171f2f] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition disabled:opacity-50 shadow-sm"
                        disabled={submitting}
                    >
                        {submitting ? (t('exp_saving') || 'Saving...') : (editingExpense ? (t('exp_update') || 'Update') : (t('exp_add_expense') || 'Add Expense'))}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                        disabled={submitting}
                    >
                        {t('exp_cancel') || 'Cancel'}
                    </button>
                </div>
            </form>
        </div>
    </div>
)}
        </div>
    );
};

export default ShopExpenses;