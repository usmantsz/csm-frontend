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
import { useTranslation } from 'react-i18next';
import { confirmDelete, confirmStatusChange, showSuccess, showError } from '../../utils/sweetAlert';
import IconRefresh from '../../components/Icon/IconRefresh';
import IconCashBanknotes from '../../components/Icon/IconCashBanknotes';
import IconFile from '../../components/Icon/IconFile';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import { FaEdit, FaTrash, FaFileExport } from 'react-icons/fa';

interface Customer {
    _id: string;
    cusNameF: string;
    cusNameL: string;
    cusNumber: string;
    cusCNIC: string;
    cusAddress: string;
    cusStatus: number; // 0 = Active, 1 = Deleted
    createdAt: string;
}

// Small rounded "chip" action button so all row actions share one consistent look
const actionChip =
    'inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors';
const actionChipWide =
    'inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-colors';

const AdminShopCustomers = () => {
    const { t } = useTranslation();
    const { shopId } = useParams<{ shopId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'createdAt',
        direction: 'desc',
    });
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');

    useEffect(() => {
        dispatch(setPageTitle('Shop Customers - Admin View'));
        if (shopId && token) {
            fetchCustomers();
        } else {
            console.warn('AdminShopCustomers: Missing shopId or token', { shopId, hasToken: !!token });
            if (!shopId) {
                Notification({ text: 'Shop ID is missing. Please navigate from the shop view page.', color: 'warning' });
            }
            setLoading(false);
        }
    }, [shopId, token]);

    const fetchCustomers = async () => {
        if (!shopId || !token) {
            console.warn('AdminShopCustomers: Cannot fetch - missing shopId or token', { shopId, hasToken: !!token });
            return;
        }

        setLoading(true);
        console.log('AdminShopCustomers: Fetching customers for shopId:', shopId);
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/getAllCusShop`,
                { shopId, includeDeleted: true }, // Admin can see deleted customers
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('AdminShopCustomers: API Response:', response.data);

            if (response.data.status === 200) {
                const customersData = response.data.data || [];
                console.log('AdminShopCustomers: Customers fetched:', customersData.length);
                setCustomers(customersData);

                if (customersData.length === 0) {
                    Notification({ text: 'No customers found for this shop.', color: 'info' });
                }
            } else {
                console.error('AdminShopCustomers: API returned error:', response.data);
                Notification({ text: response.data.message || 'Failed to fetch customers', color: 'danger' });
            }
        } catch (error: any) {
            console.error('AdminShopCustomers: Error fetching customers:', error);
            console.error('AdminShopCustomers: Error response:', error.response?.data);
            Notification({ text: error.response?.data?.message || 'Error fetching customers', color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (customer: Customer) => {
        const result = await confirmDelete('customer', customer.cusNameF + ' ' + customer.cusNameL);
        if (!result) return;

        try {
            const response = await axios.delete(`${ServerSetting.serUrl}/api/delcus`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { _id: customer._id },
            });

            if (response.data.status === 200) {
                showSuccess('Customer deleted successfully. Admin can restore this customer.');
                fetchCustomers();
            } else {
                showError(response.data.message || 'Failed to delete customer');
            }
        } catch (error: any) {
            showError(error.response?.data?.message || 'Error deleting customer');
        }
    };

    const handleRestore = async (customer: Customer) => {
        const result = await confirmStatusChange('restore', 'customer', customer.cusNameF + ' ' + customer.cusNameL);
        if (!result) return;

        try {
            console.log('[AdminShopCustomers] Attempting to restore:', { customerId: customer._id, customerName: `${customer.cusNameF} ${customer.cusNameL}` });

            const response = await axios.patch(`${ServerSetting.serUrl}/api/restorecus`, {
                _id: customer._id,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('[AdminShopCustomers] API Response:', response.data);

            if (response.data.status === 200) {
                showSuccess('Customer restored successfully.');
                // Reset status filter to 'all' so restored customer is visible
                if (statusFilter === 'deleted') {
                    setStatusFilter('all');
                }
                // Refresh customer list after a short delay to ensure backend has updated
                setTimeout(() => {
                    fetchCustomers();
                }, 500);
            } else {
                showError(response.data.message || 'Failed to restore customer');
            }
        } catch (error: any) {
            console.error('[AdminShopCustomers] Error restoring customer:', error);
            console.error('[AdminShopCustomers] Error Response:', error.response?.data);
            const errorMessage = error.response?.data?.message || error.message || 'Error restoring customer';
            showError(errorMessage);
        }
    };

    // Filter customers by search and status
    const filteredCustomers = customers.filter((customer) => {
        // Status filter
        if (statusFilter === 'active' && customer.cusStatus !== 0) return false;
        if (statusFilter === 'deleted' && customer.cusStatus !== 1) return false;

        // Search filter
        const searchLower = search.toLowerCase();
        return (
            customer.cusNameF.toLowerCase().includes(searchLower) ||
            customer.cusNameL.toLowerCase().includes(searchLower) ||
            customer.cusCNIC.toString().includes(searchLower) ||
            customer.cusNumber.includes(searchLower) ||
            (customer.cusAddress && customer.cusAddress.toLowerCase().includes(searchLower))
        );
    });

    // Sort customers
    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
        const aValue = a[sortStatus.columnAccessor as keyof Customer];
        const bValue = b[sortStatus.columnAccessor as keyof Customer];
        if (sortStatus.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
    });

    const columns = [
        {
            accessor: 'cusNameF',
            title: 'Name',
            sortable: true,
            render: ({ cusNameF, cusNameL }: Customer) => `${cusNameF} ${cusNameL}`,
        },
        {
            accessor: 'cusCNIC',
            title: 'CNIC',
            sortable: true,
        },
        {
            accessor: 'cusNumber',
            title: 'Phone',
            sortable: true,
        },
        {
            accessor: 'cusAddress',
            title: 'Address',
            sortable: true,
            render: ({ cusAddress }: Customer) => cusAddress || 'N/A',
        },
        {
            accessor: 'cusStatus',
            title: 'Status',
            sortable: true,
            render: ({ cusStatus }: Customer) => (
                <span className={`badge ${cusStatus === 0 ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                    {cusStatus === 0 ? 'Active' : 'Deleted by Shop Owner'}
                </span>
            ),
        },
        {
            accessor: 'createdAt',
            title: 'Created Date',
            sortable: true,
            render: ({ createdAt }: Customer) => {
                if (!createdAt) return 'N/A';
                const date = new Date(createdAt);
                return date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            },
        },
        {
            accessor: 'actions',
            title: 'Actions',
            textAlignment: 'right' as const,
            render: (customer: Customer) => (
                <div className="flex items-center justify-end gap-1.5 flex-nowrap whitespace-nowrap">
                    {/* Edit Customer - Only for active customers */}
                    {customer.cusStatus === 0 && (
                        <button
                            onClick={() => navigate(`/editcustomer/${customer._id}`)}
                            className={`${actionChip} bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20`}
                            title={t('edit_customer')}
                        >
                            <FaEdit className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* View Customer Balance */}
                    <button
                        onClick={() => navigate(`/customerbalance?customerId=${customer._id}&shopId=${shopId}`)}
                        className={`${actionChip} bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20`}
                        title={t('view_customer_balance')}
                    >
                        <IconCashBanknotes className="w-3.5 h-3.5" />
                    </button>

                    {/* View Customer Orders */}
                    <button
                        onClick={() => {
                            Notification({ text: 'Customer orders feature coming soon', color: 'info' });
                        }}
                        className={`${actionChip} bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-white/10 dark:text-stone-300 dark:hover:bg-white/20`}
                        title={t('view_customer_orders')}
                    >
                        <IconFile className="w-3.5 h-3.5" />
                    </button>

                    {/* Restore/Delete based on status */}
                    {customer.cusStatus === 1 ? (
                        <button
                            onClick={() => handleRestore(customer)}
                            className={`${actionChipWide} bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20`}
                            title={t('recover_customer_account')}
                        >
                            <IconRefresh className="w-3.5 h-3.5" />
                            Recover
                        </button>
                    ) : (
                        <button
                            onClick={() => handleDelete(customer)}
                            className={`${actionChip} bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20`}
                            title={t('delete_customer_soft')}
                        >
                            <FaTrash className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            {!shopId ? (
                <div className="rounded-[2rem] border border-[#bfd7f6] bg-white/95 p-6 shadow-sm dark:border-[#1f3d7f] dark:bg-[#0b1526]/85">
                    <div className="text-center py-12">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-3xl dark:bg-amber-500/10">⚠️</div>
                        <h4 className="text-lg font-semibold mb-2 text-stone-900 dark:text-white">Shop ID Missing</h4>
                        <p className="text-stone-500 dark:text-stone-400 mb-4">
                            Please navigate from the shop view page to access customers.
                        </p>
                        <button
                            onClick={() => navigate('/shop')}
                            className="rounded-2xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1a43c0]"
                        >
                            Go to Shops List
                        </button>
                    </div>
                </div>
            ) : (
                <TableCard
                    title={t('shop_customers_admin')}
                    description={`${t('shop_customers_admin_desc')} (${t('total_count')}: ${customers.length}, ${t('active_count')}: ${customers.filter(c => c.cusStatus === 0).length}, ${t('deleted_count')}: ${customers.filter(c => c.cusStatus === 1).length})`}
                    data={sortedCustomers}
                    columns={columns}
                    loading={loading}
                    page={page}
                    pageSize={pageSize}
                    totalRecords={sortedCustomers.length}
                    onPageChange={setPage}
                    onRecordsPerPageChange={setPageSize}
                    sortStatus={sortStatus}
                    onSortStatusChange={setSortStatus}
                    recordsPerPageOptions={[10, 20, 30, 50, 100]}
                    emptyMessage="No customers found for this shop"
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search by name, CNIC, phone, or address..."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => navigate(`/shop/view/${shopId}`)}
                                className="flex items-center gap-2 rounded-2xl bg-[#dbeafe] px-4 py-2 text-sm font-semibold text-[#1d4ed8] transition-colors hover:bg-[#c7ddfb] dark:bg-[#1e3a8a]/30 dark:text-[#bfdbfe] dark:hover:bg-[#1e3a8a]/50"
                            >
                                <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                                {t('back_to_shop_view')}
                            </button>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'deleted')}
                                className="rounded-2xl border border-[#bfd7f6] bg-white/80 px-3 py-2 text-sm text-stone-700 outline-none transition-all focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20 dark:border-[#1f3d7f] dark:bg-[#0b1526]/60 dark:text-stone-200 dark:focus:border-[#bfdbfe] dark:focus:ring-[#bfdbfe]/10"
                            >
                                <option value="all">All Customers</option>
                                <option value="active">Active Only</option>
                                <option value="deleted">Deleted Only</option>
                            </select>
                            <button
                                onClick={() => {
                                    const csvContent = [
                                        ['Name', 'CNIC', 'Phone', 'Address', 'Status', 'Created Date'],
                                        ...sortedCustomers.map(c => [
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
                                    showSuccess('Customers exported successfully!');
                                }}
                                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                                title={t('export_to_csv')}
                            >
                                <FaFileExport className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>
                    }
                />
            )}
        </div>
    );
};

export default AdminShopCustomers;
