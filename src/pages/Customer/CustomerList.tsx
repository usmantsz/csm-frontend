import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom";
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { Notification } from './../../helperComponents/Notification';
import { useShopId } from "./../../Hooks/useShopId";
import { useAuthToken } from './../../Hooks/useAuthToken';
import { setPageTitle } from './../../store/themeConfigSlice';
import IconPlus from './../../components/Icon/IconPlus';
import IconSearch from './../../components/Icon/IconSearch';
import { FaEdit, FaTrash, FaUndo, FaFileExport, FaTimes, FaMapMarkerAlt, FaPhoneAlt, FaIdCard } from 'react-icons/fa';
import IconCashBanknotes from '../../components/Icon/IconCashBanknotes';
import IconFile from '../../components/Icon/IconFile';
import { confirmDelete, showSuccess, showError, showLoading, closeAlert } from '../../utils/sweetAlert';
import Swal from 'sweetalert2';
import { Modal } from '@mantine/core';
import { DataTable, DataTableColumn } from 'mantine-datatable';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';

// react-icons ke IconType ka return type (ReactNode) is repo ke React/@types version
// ke sath JSX.Element expect karne wale jagah pe mismatch deta hai. In icons ko
// React.FC type mein cast kar ke ye TS error (2786) yahin resolve kar dete hain.
const EditIcon = FaEdit as unknown as React.FC<{ className?: string }>;
const TrashIcon = FaTrash as unknown as React.FC<{ className?: string }>;
const UndoIcon = FaUndo as unknown as React.FC<{ className?: string }>;
const ExportIcon = FaFileExport as unknown as React.FC<{ className?: string }>;

interface Customer {
    _id: string;
    shopId: string;
    cusNameF: string;
    cusNameL: string;
    cusNumber: number;
    cusCNIC: number;
    cusAddress: string;
    cusPassword: string;
    cusStatus?: number; // 0 = Active, 1 = Deleted, undefined = Active (default)
    createdAt: Date;
    updatedAt: Date;
    __v: number;
}

const PAGE_SIZES = [9, 18, 27, 54];

const CustomerList = () => {
    const { t, i18n } = useTranslation();
    const storedUserRaw = localStorage.getItem('userInformation');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { shopId, error } = useShopId();
    const { user } = useAuthToken();

    const isAdmin = user?.userRole === 'Admin' || user?.userRole === 'admin' || user?.userRole === '0';
    const isRTL = i18n.dir() === 'rtl';
    const alignClass = isRTL ? 'text-right' : 'text-left';

    // App ka dark-mode state (themeConfigSlice se) — Mantine ke internal
    // components (pagination, select, modal) ko is ke mutabiq dark karne ke liye.
    // themeConfig.theme teen values le sakta hai: 'light' | 'dark' | 'system'.
    const themeConfig = useSelector((state: any) => state.themeConfig);

    // Jab user "System" select kare, to OS/browser ki actual preference check karo.
    const [systemPrefersDark, setSystemPrefersDark] = useState(
        () => typeof window !== 'undefined' && window.matchMedia
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : false
    );

    useEffect(() => {
        if (!window.matchMedia) return;
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    const isDark =
        themeConfig?.theme === 'dark' ||
        (themeConfig?.theme === 'system' && systemPrefersDark);

    useEffect(() => {
        dispatch(setPageTitle(t('customer_list')));
    }, [dispatch, t]);

    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Customer[]>([]);
    const [recordsData, setRecordsData] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');

    // Balance modal state
    const [balanceModalOpen, setBalanceModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [balanceData, setBalanceData] = useState<any>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const storedUser = JSON.parse(storedUserRaw || '{}');
        const token = storedUser?.token || localStorage.getItem('token');

        if (!storedUser || !storedUser.data?._id || !token) {
            Notification({ text: t('invalid_user_or_token'), color: 'danger' });
            navigate('/login');
            return;
        }

        if (shopId) {
            setIsLoading(true);
            getAllUserOwner(token);
        } else if (error) {
            Notification({ text: error, color: 'danger' });
        }
    }, [shopId, error]);

    // Filtering + searching
    const filteredRecords = () => {
        return initialRecords.filter((item) => {
            const customerStatus = item.cusStatus ?? 0;

            if (isAdmin) {
                if (statusFilter === 'active' && customerStatus !== 0) return false;
                if (statusFilter === 'deleted' && customerStatus !== 1) return false;
            } else {
                if (customerStatus !== 0) return false;
            }

            return (
                item.cusNameF?.toLowerCase().includes(search.toLowerCase()) ||
                item.cusNameL?.toLowerCase().includes(search.toLowerCase()) ||
                item.cusNumber?.toString().toLowerCase().includes(search.toLowerCase()) ||
                item.cusCNIC?.toString().toLowerCase().includes(search.toLowerCase()) ||
                item.cusAddress?.toLowerCase().includes(search.toLowerCase())
            );
        });
    };

    useEffect(() => {
        const all = filteredRecords();
        const sorted = sortBy(all, 'cusNameF');
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sorted.slice(from, to));
    }, [search, initialRecords, statusFilter, isAdmin, page, pageSize]);

    const totalFiltered = filteredRecords().length;

    const getAllUserOwner = (token: any) => {
        if (!shopId) {
            setIsLoading(false);
            return;
        }

        axios.post(`${ServerSetting.serUrl}/api/allviewcusshop`,
            {
                shopId: shopId,
                includeDeleted: isAdmin
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        )
            .then(response => {
                const { data } = response;
                if (data.status === 200) {
                    const customers = data.data || [];
                    const customersWithStatus = customers.map((customer: Customer) => ({
                        ...customer,
                        cusStatus: customer.cusStatus ?? 0
                    }));
                    setInitialRecords(customersWithStatus);
                    setIsLoading(false);
                } else {
                    setIsLoading(false);
                    Notification({ text: data.message || t('failed_fetch_customers'), color: 'warning' });
                }
            })
            .catch(error => {
                setIsLoading(false);
                Notification({
                    text: error.response?.data?.message || t('error_fetch_customers'),
                    color: 'danger'
                });
            });
    };

    const handleAction = async (action: string, id: string, customer: Customer) => {
        if (action === 'edit') {
            navigate(`/editcustomer/${id}`);
        } else if (action === 'delete') {
            const customerName = `${customer.cusNameF} ${customer.cusNameL}`;
            const confirmed = await confirmDelete(customerName, { title: t('delete_confirm_title'), text: t('delete_confirm_text', { name: customerName }), confirmButtonText: t('yes_delete_it'), cancelButtonText: t('cancel') });
            if (!confirmed) return;

            showLoading(t('deleting_customer'));
            try {
                const storedUser = JSON.parse(storedUserRaw || '{}');
                const token = storedUser?.token || localStorage.getItem('token');

                const response = await axios.delete(
                    `${ServerSetting.serUrl}/api/delcus`,
                    {
                        data: { _id: id },
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data.status === 200) {
                    closeAlert();
                    if (isAdmin) {
                        showSuccess(t('customer_deleted_success'));
                    } else {
                        showSuccess(t('customer_deleted_contact_admin'));
                    }
                    getAllUserOwner(token);
                } else {
                    closeAlert();
                    showError(response.data.message || t('failed_delete_customer'));
                }
            } catch (error: any) {
                closeAlert();
                showError(error.response?.data?.message || t('error_deleting_customer'));
            }
        } else if (action === 'restore') {
            const confirmed = await Swal.fire({
                title: t('restore_customer_confirm_title'),
                text: t('restore_customer_confirm_text', { name: `${customer.cusNameF} ${customer.cusNameL}` }),
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: t('yes_restore'),
                cancelButtonText: t('cancel'),
                confirmButtonColor: '#10b981',
            });
            if (!confirmed.isConfirmed) return;

            showLoading(t('restoring_customer'));
            try {
                const storedUser = JSON.parse(storedUserRaw || '{}');
                const token = storedUser?.token || localStorage.getItem('token');

                const response = await axios.patch(
                    `${ServerSetting.serUrl}/api/restorecus`,
                    { _id: id },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (response.data.status === 200) {
                    closeAlert();
                    showSuccess(t('customer_restored_success'));
                    if (statusFilter === 'deleted') {
                        setStatusFilter('all');
                    }
                    setTimeout(() => {
                        getAllUserOwner(token);
                    }, 500);
                } else {
                    closeAlert();
                    showError(response.data.message || t('failed_restore_customer'));
                }
            } catch (error: any) {
                closeAlert();
                const errorMessage = error.response?.data?.message || error.message || t('error_restoring_customer');
                showError(errorMessage);
            }
        } else if (action === 'balance') {
            setSelectedCustomer(customer);
            setBalanceModalOpen(true);
            fetchCustomerBalance(customer._id);
        }
    };

    const fetchCustomerBalance = async (customerId: string) => {
        setLoadingBalance(true);
        try {
            const storedUser = JSON.parse(storedUserRaw || '{}');
            const token = storedUser?.token || localStorage.getItem('token');

            const response = await axios.post(
                `${ServerSetting.serUrl}/api/getblance`,
                {
                    shopId: shopId,
                    cusId: customerId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                setBalanceData(response.data.data);
            } else {
                Notification({ text: response.data.message || 'Failed to fetch balance', color: 'danger' });
            }
        } catch (error: any) {
            Notification({ text: error.response?.data?.message || 'Error fetching balance', color: 'danger' });
        } finally {
            setLoadingBalance(false);
        }
    };

    const exportCsv = () => {
        const csvContent = [
            ['Name', 'CNIC', 'Phone', 'Address', 'Status', 'Created Date'],
            ...initialRecords.filter(c => {
                if (statusFilter === 'active' && c.cusStatus !== 0) return false;
                if (statusFilter === 'deleted' && c.cusStatus !== 1) return false;
                return true;
            }).map(c => [
                `${c.cusNameF} ${c.cusNameL}`,
                c.cusCNIC,
                c.cusNumber,
                c.cusAddress || 'N/A',
                c.cusStatus === 0 ? 'Active' : 'Deleted',
                c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_${shopId}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showSuccess(t('customers_exported_success'));
    };

   const columns: DataTableColumn<Customer>[] = [
    {
        accessor: 'cusNameF',
        title: <div style={{ width: '100%', textAlign: isRTL ? 'right' : 'left' }}>{t('customer') || 'Customer'}</div>,
        render: (customer) => (
            <div className={`flex items-center gap-3 w-full ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                        {customer.cusNameF?.[0]?.toUpperCase() || 'C'}
                    </span>
                </div>
                <div className={alignClass}>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                        {customer.cusNameF} {customer.cusNameL}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">ID: {customer._id.slice(-6)}</div>
                </div>
            </div>
        ),
    },
    {
        accessor: 'cusCNIC',
        title: <div style={{ width: '100%', textAlign: isRTL ? 'right' : 'left' }}>{t('cnic') || 'CNIC'}</div>,
        render: (customer) => (
            <span className={`font-mono text-gray-700 dark:text-gray-300 block w-full ${alignClass}`}>
                {customer.cusCNIC || 'N/A'}
            </span>
        ),
    },
    {
        accessor: 'cusNumber',
        title: <div style={{ width: '100%', textAlign: isRTL ? 'right' : 'left' }}>{t('phone') || 'Phone'}</div>,
        render: (customer) => (
            <span className={`font-mono text-gray-700 dark:text-gray-300 block w-full ${alignClass}`}>
                {customer.cusNumber || 'N/A'}
            </span>
        ),
    },
    {
        accessor: 'cusAddress',
        title: <div style={{ width: '100%', textAlign: isRTL ? 'right' : 'left' }}>{t('address') || 'Address'}</div>,
        render: (customer) => (
            <span
                className={`text-gray-600 dark:text-gray-400 truncate block w-full max-w-[220px] ${alignClass}`}
                title={customer.cusAddress}
            >
                {customer.cusAddress || 'N/A'}
            </span>
        ),
    },
    {
        accessor: 'cusStatus',
        title: <div style={{ width: '100%', textAlign: isRTL ? 'right' : 'left' }}>{t('status') || 'Status'}</div>,
        render: (customer) => (
            <div className={`w-full ${isRTL ? 'flex justify-end' : 'flex justify-start'}`}>
                <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                        customer.cusStatus === 1
                            ? 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                    }`}
                >
                    {customer.cusStatus === 1 ? t('deleted_only') : t('active_only')}
                </span>
            </div>
        ),
    },
    {
        accessor: 'actions',
        title: <div style={{ width: '100%', textAlign: 'right' }}>{t('actions') || 'Actions'}</div>,
        render: (customer) => (
            <div className="flex items-center gap-2 flex-wrap w-full justify-end">
                <button
                    type="button"
                    onClick={() => handleAction('edit', customer._id, customer)}
                    title={t('edit_customer')}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                >
                    <EditIcon className="w-3.5 h-3.5" />
                </button>

                {customer.cusStatus === 0 && (
                    <button
                        type="button"
                        onClick={() => handleAction('balance', customer._id, customer)}
                        title={t('view_customer_balance')}
                        className="p-2 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition"
                    >
                        <IconCashBanknotes className="w-3.5 h-3.5" />
                    </button>
                )}

                {isAdmin && customer.cusStatus === 0 && (
                    <button
                        type="button"
                        onClick={() => Notification({ text: t('customer_orders_coming_soon'), color: 'info' })}
                        title={t('view_customer_orders')}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                    >
                        <IconFile className="w-3.5 h-3.5" />
                    </button>
                )}

                {customer.cusStatus !== 1 && (
                    <button
                        type="button"
                        onClick={() => handleAction('delete', customer._id, customer)}
                        title={t('delete_customer')}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition"
                    >
                        <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                )}

                {isAdmin && customer.cusStatus === 1 && (
                    <button
                        type="button"
                        onClick={() => handleAction('restore', customer._id, customer)}
                        title={t('restore_customer_admin')}
                        className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition"
                    >
                        <UndoIcon className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        ),
    },
];

        return (
        <div className="min-h-screen">
            <div className='flex justify-end'>
                <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                        >
                            <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                            {t('back_to_dashboard')}
            </button>
            </div>
            
            {/* Customer Table */}
            <div className="panel mt-4 bg-white dark:bg-[#0e1726] rounded-xl border border-gray-300 dark:border-white/10 shadow-sm p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {t('customer_list')}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {isAdmin ? t('manage_customers_desc', { total: initialRecords.length, active: initialRecords.filter(c => c.cusStatus === 0).length, deleted: initialRecords.filter(c => c.cusStatus === 1).length }) : t('manage_shop_customers')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">

                        <div className="relative w-full sm:w-64">
                            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder={t('search_by_name_cnic_phone')}
                                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-[#1b2e4b] border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                            />
                        </div>

                        {isAdmin && (
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'active' | 'deleted'); setPage(1); }}
                                className="rounded-lg bg-white dark:bg-[#1b2e4b] border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                            >
                                <option value="all">{t('all_customers_filter')}</option>
                                <option value="active">{t('active_only')}</option>
                                <option value="deleted">{t('deleted_only')}</option>
                            </select>
                        )}

                        {isAdmin && (
                            <button
                                onClick={exportCsv}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition whitespace-nowrap"
                            >
                                <ExportIcon className="w-4 h-4" />
                                {t('export_csv')}
                            </button>
                        )}

                        <Link
    to="/addnewcustomer"
    className="inline-flex items-center gap-2 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] px-4 py-2 text-sm font-semibold text-white border-0 shadow-sm shadow-[#16a34a]/20 transition-colors"
>
    <IconPlus className="w-4 h-4" />
    {t('add_new_customer_btn')}
</Link>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <span className="animate-[spin_1s_linear_infinite] border-4 border-gray-200 dark:border-white/10 border-t-emerald-500 rounded-full w-10 h-10 inline-block"></span>
                    </div>
                ) : (
                    // data-mantine-color-scheme: taake DataTable ke andar Mantine ke
                    // apne components (pagination controls, page-size select) bhi
                    // app ke dark-mode state ke mutabiq dark rahein — warna wo
                    // Tailwind ke dark: classes ko ignore kar ke default light rehte hain.
                    <div
                        className="rounded-xl overflow-hidden border border-gray-300 dark:border-white/5"
                        data-mantine-color-scheme={isDark ? 'dark' : 'light'}
                        dir={isRTL ? 'rtl' : 'ltr'}
                    >
                        <DataTable
                            highlightOnHover
                            records={recordsData}
                            columns={columns}
                            totalRecords={totalFiltered}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={(size) => { setPageSize(size); setPage(1); }}
                            minHeight={180}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords}`}
                            noRecordsText={t('no_data_found') || 'No customers found.'}
                            // Manual striping — Mantine ka built-in `striped` prop dark-mode
                            // aware nahi tha, is liye rows ka background khud control kar rahe hain.
                            rowClassName={(_record, index) =>
                                index % 2 === 1
                                    ? 'bg-gray-50 dark:bg-white/[0.03]'
                                    : 'bg-white dark:bg-[#0e1726]'
                            }
                            // Footer/pagination bar ko isDark ke hisaab se explicitly color do —
                            // System theme mein bhi ab ye sahi (dark/light) dikhega.
                            backgroundColor={isDark ? '#0e1726' : '#ffffff'}
                            c={isDark ? '#d1d5db' : '#000000'}
                            borderColor={isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'}
                            paginationActiveBackgroundColor="teal"
                            paginationActiveTextColor="#ffffff"
                            styles={{
                                header: {
                                    backgroundColor: isDark ? '#0e1726' : '#ffffff',
                                    color: isDark ? '#d1d5db' : '#000000',
                                },
                                pagination: {
                                    backgroundColor: isDark ? '#0e1726' : '#ffffff',
                                },
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Balance Modal */}
            <Modal
                opened={balanceModalOpen}
                onClose={() => {
                    setBalanceModalOpen(false);
                    setSelectedCustomer(null);
                    setBalanceData(null);
                }}
                title={
                    <div className="flex items-center gap-2">
                        <IconCashBanknotes className="w-5 h-5 text-primary" />
                        <span className="text-lg font-semibold">
                            {t('customer_balance_modal')}
                            {selectedCustomer && (
                                <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                                    - {selectedCustomer.cusNameF} {selectedCustomer.cusNameL}
                                </span>
                            )}
                        </span>
                    </div>
                }
                size="lg"
                centered
                // Same wajah: Modal bhi Mantine component hai, is liye is ko bhi
                // app ke dark-mode state ke mutabiq color-scheme attribute dete hain.
                data-mantine-color-scheme={isDark ? 'dark' : 'light'}
            >
                <div className="p-4">
                    {loadingBalance ? (
                        <div className="flex justify-center items-center py-8">
                            <span className="animate-[spin_2s_linear_infinite] border-8 border-[#f1f2f3] border-l-primary border-r-primary rounded-full w-14 h-14 inline-block align-middle m-auto"></span>
                        </div>
                    ) : balanceData && balanceData.length > 0 ? (
                        <div className="space-y-4">
                            {balanceData.map((balance: any, index: number) => (
                                <div
                                    key={balance._id || index}
                                    className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-6 border border-primary-200 dark:border-primary-700"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-black rounded-lg p-4 border border-primary-200 dark:border-primary-700">
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('customer_balance_label')}</div>
                                            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                                Rs. {balance.cusBlane?.toLocaleString() || '0'}
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-black rounded-lg p-4 border border-primary-200 dark:border-primary-700">
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('shop_balance_label')}</div>
                                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                Rs. {balance.blance?.toLocaleString() || '0'}
                                            </div>
                                        </div>
                                    </div>
                                    {balance.cusId && (
                                        <div className="mt-4 pt-4 border-t border-primary-200 dark:border-primary-700">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                <div><strong>CNIC:</strong> {balance.cusId.cusCNIC || 'N/A'}</div>
                                                <div className="mt-1"><strong>Phone:</strong> {balance.cusId.cusNumber || 'N/A'}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-gray-500 dark:text-gray-400">
                                <IconCashBanknotes className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>{t('no_balance_info')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default CustomerList;
