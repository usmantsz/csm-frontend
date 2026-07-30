import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DataTableSortStatus } from 'mantine-datatable';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { useShopId } from '../../Hooks/useShopId';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import axios from 'axios';
import { FaEye, FaEdit } from 'react-icons/fa';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconSearch from '../../components/Icon/IconSearch';
import IconCreditCard from '../../components/Icon/IconCreditCard';
import IconCashBanknotes from '../../components/Icon/IconCashBanknotes';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import TableCard from '../../components/Agricultural/TableCard';
import PageHeader from '../../components/Agricultural/PageHeader';

interface FinanceRecord {
    _id: string;
    finaceCusId: {
        _id: string;
        cusNameF: string;
        cusNameL: string;
        cusCNIC: string | number;
        cusNumber: string;
    };
    finaceCropId: {
        _id: string;
        cropName: string;
        cropImage: string;
    };
    loanAmount: number;
    loanPaidAmount: number;
    finaceType: number;
    finaceRemarks: string;
    finaceStatus: number;
    paymentStatus?: number | null;
    createdAt: string;
    updatedAt: string;
}

const PAYMENT_STATUS_OPTIONS = [
    { value: 0, label: 'Loan de diya' },
    { value: 1, label: 'Kuch return / Baki hai' },
    { value: 2, label: 'Full return' },
];

const CropFinanceList: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { token, user } = useAuthToken();
    const { shopId, loading: shopIdLoading, error: shopIdError } = useShopId();
    const { cropId } = useParams<{ cropId: string }>();
    const navigate = useNavigate();

    const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<FinanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchCNIC, setSearchCNIC] = useState('');
    const [searchingByCNIC, setSearchingByCNIC] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [viewModal, setViewModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'createdAt',
        direction: 'desc',
    });
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    const userId = (user as any)?._id ?? null;

    useEffect(() => {
        dispatch(setPageTitle(t('crop_finance_records')));
        console.log('CropFinanceList - cropId:', cropId, 'shopId:', shopId, 'shopIdLoading:', shopIdLoading, 'shopIdError:', shopIdError, 'token:', token ? 'exists' : 'missing');
        
        // Wait for shopId to finish loading
        if (shopIdLoading) {
            return;
        }
        
        if (cropId && shopId) {
            fetchFinanceRecords();
        } else {
            console.warn('CropFinanceList - Missing required data:', { cropId, shopId, shopIdError });
            if (!cropId) {
                Notification({ text: 'Crop ID is missing', color: 'warning' });
            }
            if (!shopId && !shopIdLoading) {
                if (shopIdError) {
                    Notification({ 
                        text: `Shop ID Error: ${shopIdError}. Please ensure you have a shop assigned to your account.`, 
                        color: 'danger' 
                    });
                } else {
                    Notification({ 
                        text: 'Shop ID is missing. Please ensure you have a shop assigned to your account.', 
                        color: 'warning' 
                    });
                }
            }
        }
    }, [cropId, shopId, shopIdLoading, shopIdError, token]);

    const fetchFinanceRecords = async () => {
        if (!cropId || !shopId) {
            console.warn('Cannot fetch finance records - missing cropId or shopId:', { cropId, shopId });
            return;
        }

        if (!token) {
            console.error('Cannot fetch finance records - missing token');
            Notification({ text: 'Authentication token is missing. Please login again.', color: 'danger' });
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            const apiUrl = `${ServerSetting.serUrl}/api/getFinanceByCropAndShop`;
            const requestBody = { cropId, shopId, includeDeleted: true };
            
            console.log('Fetching finance records:', {
                url: apiUrl,
                body: requestBody,
                hasToken: !!token
            });

            const response = await axios.post(
                apiUrl,
                requestBody,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Finance records response:', response.data);

            if (response.data.status === 200) {
                setFinanceRecords(response.data.data);
                setFilteredRecords(response.data.data);
                console.log('Finance records loaded:', response.data.data.length);
            } else {
                console.error('API returned error status:', response.data);
                Notification({
                    text: response.data.message || 'Failed to fetch finance records',
                    color: 'danger',
                });
            }
        } catch (error: any) {
            console.error('Error fetching finance records:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                url: error.config?.url
            });
            
            if (error.response?.status === 404) {
                Notification({
                    text: 'API endpoint not found. Please ensure the backend server is running and restarted.',
                    color: 'danger',
                });
            } else if (error.response?.status === 401) {
                Notification({
                    text: 'Authentication failed. Please login again.',
                    color: 'danger',
                });
                navigate('/login');
            } else {
                Notification({
                    text: error.response?.data?.message || 'Error loading finance records',
                    color: 'danger',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearchByCNIC = async () => {
        if (!searchCNIC.trim()) {
            Notification({ text: 'Please enter a CNIC number', color: 'warning' });
            return;
        }

        if (!cropId || !shopId) return;

        try {
            setSearchingByCNIC(true);
            setLoading(true);
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/getFinanceByCropShopAndCNIC`,
                { cropId, shopId, cnic: searchCNIC },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 200) {
                setFinanceRecords(response.data.data);
                setFilteredRecords(response.data.data);
                setSelectedCustomer(response.data.customer);
                Notification({
                    text: `Finance records for ${response.data.customer.cusNameF} ${response.data.customer.cusNameL}`,
                    color: 'success',
                });
            } else if (response.data.status === 404) {
                setFinanceRecords([]);
                setFilteredRecords([]);
                setSelectedCustomer(null);
                Notification({
                    text: response.data.message || 'No customer found with this CNIC',
                    color: 'warning',
                });
            } else {
                Notification({
                    text: response.data.message || 'Failed to fetch finance records',
                    color: 'danger',
                });
            }
        } catch (error: any) {
            console.error('Error searching by CNIC:', error);
            Notification({
                text: error.response?.data?.message || 'Error searching finance records',
                color: 'danger',
            });
        } finally {
            setLoading(false);
            setSearchingByCNIC(false);
        }
    };

    const handleClearSearch = () => {
        setSearchCNIC('');
        setSelectedCustomer(null);
        fetchFinanceRecords();
    };

    const getStatusBadge = (status: number) => {
        const statusMap: { [key: number]: { label: string; color: string } } = {
            0: { label: 'Active', color: 'success' },
            1: { label: 'Deleted', color: 'danger' },
            2: { label: 'Completed', color: 'primary' },
            3: { label: 'Cancelled', color: 'danger' },
        };

        const statusInfo = statusMap[status] || { label: 'Unknown', color: 'gray' };
        return (
            <span className={`badge bg-${statusInfo.color}/20 text-${statusInfo.color} rounded-full`}>
                {statusInfo.label}
            </span>
        );
    };

    const calculateRemainingForRecord = (r: FinanceRecord) =>
        (r.finaceType === 0 || r.finaceType === 3) ? calculateRemaining(r.loanAmount ?? 0, r.loanPaidAmount) : 0;

    const getPaymentStatusDisplay = (record: FinanceRecord) => {
        if (record.finaceType === 1) return { value: 1, label: 'Return aaya', color: 'success', canEdit: false };
        if (record.finaceType === 2) return { value: 2, label: 'Payment', color: 'info', canEdit: false };
        if (record.finaceType === 3) {
            const remaining = calculateRemainingForRecord(record);
            const paid = Number(record.loanPaidAmount) || 0;
            let value: number;
            if (remaining <= 0 && paid > 0) value = 2;
            else if (remaining > 0 && paid > 0) value = 1;
            else value = 0;
            const labels: { [key: number]: string } = { 0: 'Loan de diya', 1: 'Kuch return / Baki hai', 2: 'Full return' };
            return { value, label: labels[value] || labels[0], color: value === 2 ? 'success' : value === 1 ? 'warning' : 'primary', canEdit: true };
        }
        const remaining = calculateRemainingForRecord(record);
        const paid = Number(record.loanPaidAmount) || 0;
        let value: number;
        if (record.paymentStatus !== undefined && record.paymentStatus !== null && record.paymentStatus !== '') {
            value = Number(record.paymentStatus);
        } else {
            if (remaining <= 0 && paid > 0) value = 2;
            else if (remaining > 0 && paid > 0) value = 1;
            else value = 0;
        }
        const labels: { [key: number]: string } = { 0: 'Loan de diya', 1: 'Kuch return / Baki hai', 2: 'Full return' };
        const colors: { [key: number]: string } = { 0: 'primary', 1: 'warning', 2: 'success' };
        return { value, label: labels[value] || labels[0], color: colors[value] || 'primary', canEdit: true };
    };

    const updatePaymentStatus = async (recordId: string, paymentStatus: number) => {
        if (!token) return;
        setUpdatingStatusId(recordId);
        try {
            const res = await axios.patch(
                `${ServerSetting.serUrl}/api/updateFinancePaymentStatus`,
                { _id: recordId, paymentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.status === 200) {
                setFinanceRecords((prev) => prev.map((r) => (r._id === recordId ? { ...r, paymentStatus } : r)));
                setFilteredRecords((prev) => prev.map((r) => (r._id === recordId ? { ...r, paymentStatus } : r)));
                Notification({ text: 'Status updated', color: 'success' });
            } else {
                Notification({ text: res.data?.message || 'Update failed', color: 'danger' });
            }
        } catch (e: any) {
            Notification({ text: e.response?.data?.message || 'Error updating status', color: 'danger' });
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const getFinanceTypeLabel = (type: number) => {
        const types: { [key: number]: string } = {
            0: 'Loan Given',
            1: 'Loan Returned',
            2: 'Payment',
            3: 'Medicine (POS products)',
        };
        return types[type as keyof typeof types] ?? 'Unknown';
    };

    const calculateRemaining = (loanAmount: number, paidAmount: number | string) => {
        return Math.max(0, (Number(loanAmount) || 0) - (Number(paidAmount) || 0));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getFinanceFormEditUrl = (id: string) => {
        if (!userId || !cropId) return '/finance';
        return `/finance-form/${userId}/${cropId}?edit=${id}`;
    };

    const columns = [
        {
            accessor: 'finaceCusId',
            title: 'Customer',
            sortable: true,
            render: ({ finaceCusId }: FinanceRecord) => (
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-3">
                        <span className="text-primary-600 dark:text-primary-300 font-semibold">
                            {finaceCusId?.cusNameF?.[0]?.toUpperCase() || 'C'}
                        </span>
                    </div>
                    <div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">
                            {finaceCusId?.cusNameF} {finaceCusId?.cusNameL}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            CNIC: {finaceCusId?.cusCNIC || 'N/A'}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            accessor: 'finaceType',
            title: 'Type',
            sortable: true,
            render: ({ finaceType }: FinanceRecord) => (
                <span className="font-medium">{getFinanceTypeLabel(finaceType)}</span>
            ),
        },
        {
            accessor: 'loanAmount',
            title: 'Loan Amount',
            sortable: true,
            render: ({ loanAmount }: FinanceRecord) => (
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                    Rs. {loanAmount?.toLocaleString() || '0'}
                </span>
            ),
        },
        {
            accessor: 'loanPaidAmount',
            title: 'Paid Amount',
            sortable: true,
            render: ({ loanPaidAmount }: FinanceRecord) => (
                <span className="font-semibold text-success-600 dark:text-success-400">
                    Rs. {(loanPaidAmount || 0)?.toLocaleString()}
                </span>
            ),
        },
        {
            accessor: 'remaining',
            title: 'Remaining',
            sortable: false,
            render: ({ loanAmount, loanPaidAmount, finaceType }: FinanceRecord) => {
                const remaining = (finaceType === 0 || finaceType === 3) ? calculateRemaining(loanAmount ?? 0, loanPaidAmount) : 0;
                return (
                    <span className={`font-semibold ${remaining > 0 ? 'text-danger' : 'text-success'}`}>
                        Rs. {remaining.toLocaleString()}
                    </span>
                );
            },
        },
        {
            accessor: 'paymentStatus',
            title: 'Status',
            sortable: true,
            render: (record: FinanceRecord) => {
                const display = getPaymentStatusDisplay(record);
                if (display.canEdit) {
                    return (
                        <select
                            value={display.value}
                            onChange={(e) => updatePaymentStatus(record._id, Number(e.target.value))}
                            disabled={updatingStatusId === record._id}
                            className="form-select form-select-sm min-w-[160px] rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        >
                            {PAYMENT_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    );
                }
                return (
                    <span className={`badge bg-${display.color}-light text-${display.color} rounded-full`}>
                        {display.label}
                    </span>
                );
            },
        },
        {
            accessor: 'finaceRemarks',
            title: 'Remarks',
            sortable: true,
            render: ({ finaceRemarks }: FinanceRecord) => (
                <div className="max-w-xs truncate" title={finaceRemarks}>
                    {finaceRemarks || 'N/A'}
                </div>
            ),
        },
        {
            accessor: 'createdAt',
            title: 'Date',
            sortable: true,
            render: ({ createdAt }: FinanceRecord) => {
                const date = new Date(createdAt);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });
            },
        },
        {
            accessor: 'action',
            title: t('actions_col'),
            render: (record: FinanceRecord) => (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                            setSelectedRecord(record);
                            setViewModal(true);
                        }}
                        title="View Details"
                    >
                        <FaEye className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => navigate(getFinanceFormEditUrl(record._id))}
                        title="Edit"
                    >
                        <FaEdit className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    // Total Given: Loan Given (0) + Medicine/POS (3). Total Received: paid/returned/payment + Medicine paid. Remaining = Given - Received.
    const totalGiven = financeRecords
        .filter((r) => r.finaceType === 0 || r.finaceType === 3)
        .reduce((sum, r) => sum + (Number(r.loanAmount) || 0), 0);
    const totalReceived =
        financeRecords
            .filter((r) => r.finaceType === 0)
            .reduce((sum, r) => sum + (Number(r.loanPaidAmount) || 0), 0) +
        financeRecords
            .filter((r) => r.finaceType === 1)
            .reduce((sum, r) => sum + (Number(r.loanAmount) || 0), 0) +
        financeRecords
            .filter((r) => r.finaceType === 2)
            .reduce((sum, r) => sum + (Number(r.loanPaidAmount) || Number(r.loanAmount) || 0), 0) +
        financeRecords
            .filter((r) => r.finaceType === 3)
            .reduce((sum, r) => sum + (Number(r.loanPaidAmount) || 0), 0);
    const totalRemaining = Math.max(0, totalGiven - totalReceived);

    // Show loading state while shopId is being fetched
    if (shopIdLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading shop information...</p>
                </div>
            </div>
        );
    }

    // Show error state if shopId is missing
    if (!shopId && !shopIdLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="panel text-center max-w-md">
                    <div className="text-6xl mb-4">🏪</div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Shop Not Found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {shopIdError || 'You need to have a shop assigned to view finance records.'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                        Please contact the administrator to assign a shop to your account.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/finance')}
                        className="btn btn-primary"
                    >
                        <IconArrowLeft className="w-4 h-4 mr-2" />
                        Back to Finance
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header Section */}
            <PageHeader
                title="Finance Records"
                description={selectedCustomer ? `Finance records for ${selectedCustomer.cusNameF} ${selectedCustomer.cusNameL}` : 'All finance records for this crop'}
                backTo="/finance"
                backLabel="Back to Finance"
                icon="💰"
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="panel bg-gradient-to-r from-primary-400 to-primary-600 dark:from-primary-500 dark:to-primary-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-900 dark:text-white text-sm mb-1 font-medium">Total Given (Loans)</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">Rs. {totalGiven.toLocaleString()}</p>
                        </div>
                        <IconCashBanknotes className="w-12 h-12 text-gray-800 dark:text-white opacity-80" />
                    </div>
                </div>
                <div className="panel bg-gradient-to-r from-success-400 to-success-600 dark:from-success-500 dark:to-success-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-900 dark:text-white text-sm mb-1 font-medium">Total Received (Paid)</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">Rs. {totalReceived.toLocaleString()}</p>
                        </div>
                        <IconCashBanknotes className="w-12 h-12 text-gray-800 dark:text-white opacity-80" />
                    </div>
                </div>
                <div className="panel bg-gradient-to-r from-danger-400 to-danger-600 dark:from-danger-500 dark:to-danger-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-900 dark:text-white text-sm mb-1 font-medium">Remaining (Baki)</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">Rs. {totalRemaining.toLocaleString()}</p>
                        </div>
                        <IconCashBanknotes className="w-12 h-12 text-gray-800 dark:text-white opacity-80" />
                    </div>
                </div>
            </div>

            {/* CNIC Search Section */}
            <div className="panel mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
                            Search by Customer CNIC
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IconCreditCard className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchCNIC}
                                onChange={(e) => setSearchCNIC(e.target.value.replace(/\D/g, '').slice(0, 13))}
                                placeholder="Enter 13-digit CNIC"
                                className="form-input pl-10 w-full"
                                maxLength={13}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleSearchByCNIC}
                            disabled={searchingByCNIC || !searchCNIC.trim()}
                            className="btn btn-primary"
                        >
                            {searchingByCNIC ? (
                                <>
                                    <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 inline-block mr-2"></span>
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <IconSearch className="w-4 h-4 mr-2" />
                                    Search
                                </>
                            )}
                        </button>
                        {selectedCustomer && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="btn btn-outline-primary"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Finance Records Table */}
            <TableCard
                title="Finance Records"
                description={selectedCustomer ? `Showing records for ${selectedCustomer.cusNameF} ${selectedCustomer.cusNameL}` : 'All finance records for this crop'}
                data={filteredRecords}
                columns={columns}
                loading={loading}
                page={page}
                pageSize={pageSize}
                totalRecords={filteredRecords.length}
                onPageChange={setPage}
                onRecordsPerPageChange={setPageSize}
                sortStatus={sortStatus}
                onSortStatusChange={setSortStatus}
                emptyMessage="No finance records found"
            />

            {/* View Finance Record Modal */}
            {viewModal && selectedRecord && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Finance Record Details</h3>
                                <button
                                    type="button"
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    onClick={() => setViewModal(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400">Customer Name</label>
                                        <p className="font-semibold text-gray-800 dark:text-white">
                                            {selectedRecord.finaceCusId?.cusNameF} {selectedRecord.finaceCusId?.cusNameL}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400">CNIC</label>
                                        <p className="font-semibold text-gray-800 dark:text-white">{selectedRecord.finaceCusId?.cusCNIC || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400">Phone</label>
                                        <p className="font-semibold text-gray-800 dark:text-white">{selectedRecord.finaceCusId?.cusNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400">Type</label>
                                        <p className="font-semibold text-gray-800 dark:text-white">{getFinanceTypeLabel(selectedRecord.finaceType)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400">Loan Amount</label>
                                        <p className="font-semibold text-primary-600 dark:text-primary-400">Rs. {(selectedRecord.loanAmount || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400">Paid Amount</label>
                                        <p className="font-semibold text-success-600 dark:text-success-400">Rs. {(selectedRecord.loanPaidAmount || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400">Remaining</label>
                                        <p className="font-semibold text-warning-600 dark:text-warning-400">
                                            Rs. {((selectedRecord.finaceType === 0 || selectedRecord.finaceType === 3) ? calculateRemaining(selectedRecord.loanAmount ?? 0, selectedRecord.loanPaidAmount ?? 0) : 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
                                        <div className="mt-1">
                                            {(() => {
                                                const disp = getPaymentStatusDisplay(selectedRecord);
                                                return (
                                                    <span className={`badge bg-${disp.color}-light text-${disp.color} rounded-full`}>
                                                        {disp.label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-sm text-gray-600 dark:text-gray-400">Remarks</label>
                                        <p className="font-semibold text-gray-800 dark:text-white">{selectedRecord.finaceRemarks || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400">Created</label>
                                        <p className="font-semibold text-gray-800 dark:text-white">{formatDate(selectedRecord.createdAt)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400">Updated</label>
                                        <p className="font-semibold text-gray-800 dark:text-white">{formatDate(selectedRecord.updatedAt)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        className="btn btn-primary flex items-center gap-2"
                                        onClick={() => {
                                            setViewModal(false);
                                            navigate(getFinanceFormEditUrl(selectedRecord._id));
                                        }}
                                    >
                                        <FaEdit className="w-4 h-4" />
                                        Edit Record
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={() => setViewModal(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CropFinanceList;

