import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { useShopId } from '../../Hooks/useShopId';
import { useShopIdFromUrl } from '../../Hooks/useShopIdFromUrl';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import axios from 'axios';
import { FaEye, FaEdit, FaFileInvoice } from 'react-icons/fa';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconPlus from '../../components/Icon/IconPlus';
import PageHeader from '../../components/Agricultural/PageHeader';
import IconSearch from '../../components/Icon/IconSearch';
import IconCreditCard from '../../components/Icon/IconCreditCard';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';

interface Loan {
    _id: string;
    finaceCusId?: {
        _id: string;
        cusNameF?: string;
        cusNameL?: string;
        cusCNIC?: string | number;
        cusNumber?: string;
    } | string;
    loanAmount?: number | null;
    loanPaidAmount?: number | null;
    finaceType: number;
    finaceRemarks?: string;
    finaceStatus: number;
    paymentStatus?: number | null;
    createdAt?: string;
    updatedAt?: string;
}

const PAYMENT_STATUS_OPTIONS = [
    { value: 0, label: 'Loan de diya' },
    { value: 1, label: 'Kuch return / Baki hai' },
    { value: 2, label: 'Full return' },
];

const LoanList: React.FC = () => {
    const dispatch = useDispatch();
    const { token, user } = useAuthToken();
    const { shopId: urlShopId } = useShopIdFromUrl();
    const { shopId: userShopId } = useShopId();
    const { userId: paramUserId, cropId } = useParams<{ userId: string; cropId: string }>();
    const navigate = useNavigate();

    // For shop owner: use userId from URL (from Crops flow) or logged-in user so we can resolve shopId
    const effectiveUserId = paramUserId || (user as any)?._id || '';

    const [shopId, setShopId] = useState<string | null>(urlShopId || userShopId || null);
    const [fetchingShopId, setFetchingShopId] = useState(false);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [viewModal, setViewModal] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [cropName, setCropName] = useState<string>('');
    const [searchCNIC, setSearchCNIC] = useState('');
    const [searchingByCNIC, setSearchingByCNIC] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<{ _id: string; cusNameF: string; cusNameL: string; cusCNIC: string; cusNumber?: string } | null>(null);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'createdAt',
        direction: 'desc',
    });
    const [posUserRecords, setPosUserRecords] = useState<any[]>([]);
    const [posUserRecordsLoading, setPosUserRecordsLoading] = useState(false);

    // Resolve shopId: URL query > useShopId > fetch by effectiveUserId (shop owner from Crops)
    useEffect(() => {
        if (urlShopId) {
            setShopId(urlShopId);
            return;
        }
        if (userShopId) {
            setShopId(userShopId);
            return;
        }
        if (!effectiveUserId || !token) return;

        const fetchShopFromUser = async () => {
            setFetchingShopId(true);
            try {
                const res = await axios.get(
                    `${ServerSetting.serUrl}/api/getShopId/${effectiveUserId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data?.status === 200 && res.data?.data) {
                    const sid = res.data.data._id ?? (typeof res.data.data === 'string' ? res.data.data : null);
                    if (sid) setShopId(String(sid));
                }
            } catch (e) {
                console.error('LoanList: failed to fetch shopId from userId', e);
            } finally {
                setFetchingShopId(false);
            }
        };

        fetchShopFromUser();
    }, [effectiveUserId, token, urlShopId, userShopId]);

    // Fetch crop name for header
    useEffect(() => {
        if (!cropId || !token) return;
        axios
            .get(`${ServerSetting.serUrl}/api/viewcrop/${cropId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (res.data?.status === 200 && res.data?.data?.cropName) {
                    setCropName(res.data.data.cropName);
                }
            })
            .catch(() => {});
    }, [cropId, token]);

    useEffect(() => {
        dispatch(setPageTitle('Loan List'));
    }, [dispatch]);

    useEffect(() => {
        if (!cropId || !shopId || fetchingShopId) {
            setLoading(fetchingShopId);
            if (!fetchingShopId && (!cropId || !shopId)) setLoans([]);
            return;
        }
        fetchLoans();
    }, [cropId, shopId, fetchingShopId]);

    // Fetch POS User Record when viewing a loan (for this finance)
    useEffect(() => {
        if (!viewModal || !selectedLoan?._id || !token) {
            setPosUserRecords([]);
            return;
        }
        setPosUserRecordsLoading(true);
        axios
            .get(`${ServerSetting.apiUrl}/shop-owner-pos/requests/by-finance/${selectedLoan._id}`, {
                headers: { Authorization: `Bearer ${token}` },
                validateStatus: () => true,
            })
            .then((r) => { if (r.data?.data) setPosUserRecords(r.data.data); else setPosUserRecords([]); })
            .catch(() => setPosUserRecords([]))
            .finally(() => setPosUserRecordsLoading(false));
    }, [viewModal, selectedLoan?._id, token]);

    const fetchLoans = async () => {
        if (!cropId || !shopId || !token) return;
        try {
            setLoading(true);
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/getFinanceByCropAndShop`,
                { cropId: String(cropId), shopId: String(shopId), includeDeleted: true },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.status === 200) {
                const data = response.data.data || [];
                setLoans(Array.isArray(data) ? data : []);
            } else {
                Notification({
                    text: response.data.message || 'Failed to fetch loans',
                    color: 'error',
                });
                setLoans([]);
            }
        } catch (error: any) {
            console.error('Error fetching loans:', error);
            Notification({
                text: error.response?.data?.message || 'Error loading loans',
                color: 'error',
            });
            setLoans([]);
        } finally {
            setLoading(false);
        }
    };

    const getLoanTypeLabel = (type: number) => {
        const types: { [key: number]: string } = {
            0: 'Loan Given',
            1: 'Loan Returned',
            2: 'Payment',
            3: 'Medicine (POS products)',
        };
        return types[type as keyof typeof types] ?? 'Unknown';
    };

    const getLoanTypeColor = (type: number) => {
        const colors: { [key: number]: string } = {
            0: 'primary',
            1: 'success',
            2: 'info',
            3: 'info',
        };
        return colors[type] || 'dark';
    };

    const getStatusLabel = (status: number) => {
        const statuses: { [key: number]: string } = {
            0: 'Active',
            1: 'Deleted',
            2: 'Completed',
        };
        return statuses[status] || 'Unknown';
    };

    const getStatusColor = (status: number) => {
        const colors: { [key: number]: string } = {
            0: 'success',
            1: 'danger',
            2: 'primary',
        };
        return colors[status] || 'dark';
    };

    // Payment/return display: 0=Loan de diya, 1=Kuch baki, 2=Full return (saved or derived)
    const getPaymentStatusDisplay = (loan: Loan) => {
        if (loan.finaceType === 1) return { value: 1, label: 'Return aaya', color: 'success', canEdit: false };
        if (loan.finaceType === 2) return { value: 2, label: 'Payment', color: 'info', canEdit: false };
        const remaining = calculateRemainingAmount(loan);
        const paid = Number(loan.loanPaidAmount) || 0;
        let value: number;
        if (loan.paymentStatus !== undefined && loan.paymentStatus !== null && loan.paymentStatus !== '') {
            value = Number(loan.paymentStatus);
        } else {
            if (remaining <= 0 && paid > 0) value = 2;
            else if (remaining > 0 && paid > 0) value = 1;
            else value = 0;
        }
        const labels: { [key: number]: string } = { 0: 'Loan de diya', 1: 'Kuch return / Baki hai', 2: 'Full return' };
        const colors: { [key: number]: string } = { 0: 'primary', 1: 'warning', 2: 'success' };
        return { value, label: labels[value] || labels[0], color: colors[value] || 'primary', canEdit: true };
    };

    const calculateRemainingAmount = (loan: Loan) => {
        return Math.max(0, (loan.loanAmount || 0) - (Number(loan.loanPaidAmount) || 0));
    };

    // Total Given: Loan Given (0) + Medicine/POS (3) – both are amount given to customer
    const totalGiven = loans
        .filter((r) => r.finaceType === 0 || r.finaceType === 3)
        .reduce((sum, r) => sum + (Number(r.loanAmount) || 0), 0);
    // Total Received: paid back (type 0 paid) + returned (type 1) + payment (type 2) + medicine paid (type 3 paid)
    const totalReceived =
        loans.filter((r) => r.finaceType === 0).reduce((sum, r) => sum + (Number(r.loanPaidAmount) || 0), 0) +
        loans.filter((r) => r.finaceType === 1).reduce((sum, r) => sum + (Number(r.loanAmount) || 0), 0) +
        loans.filter((r) => r.finaceType === 2).reduce((sum, r) => sum + (Number(r.loanPaidAmount) || Number(r.loanAmount) || 0), 0) +
        loans.filter((r) => r.finaceType === 3).reduce((sum, r) => sum + (Number(r.loanPaidAmount) || 0), 0);
    const totalRemaining = Math.max(0, totalGiven - totalReceived);
    // Count: Loan Given + Medicine (both are "loans given" to customer)
    const loansGivenCount = loans.filter((r) => r.finaceType === 0 || r.finaceType === 3).length;

    const formatCurrency = (amount: number | null | undefined) => {
        const value = amount != null && !Number.isNaN(Number(amount)) ? Number(amount) : 0;
        return `PKR ${value.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (dateString == null || dateString === '') return '—';
        const d = new Date(dateString);
        return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const customerName = (loan: Loan) => {
        const c = loan.finaceCusId;
        if (!c) return '—';
        if (typeof c === 'object' && c !== null && ('cusNameF' in c || 'cusNameL' in c)) {
            return [c.cusNameF, c.cusNameL].filter(Boolean).join(' ').trim() || '—';
        }
        return '—';
    };
    const customerCNIC = (loan: Loan) => (typeof loan.finaceCusId === 'object' && loan.finaceCusId && 'cusCNIC' in loan.finaceCusId) ? String(loan.finaceCusId.cusCNIC ?? '') : '—';
    const customerPhone = (loan: Loan) => (typeof loan.finaceCusId === 'object' && loan.finaceCusId && 'cusNumber' in loan.finaceCusId) ? String(loan.finaceCusId.cusNumber ?? '') : '—';

    const getFinanceFormUrl = (editId?: string) => {
        const base = `/finance-form/${effectiveUserId}/${cropId}`;
        const params = new URLSearchParams();
        if (shopId) params.set('shopId', shopId);
        if (editId) params.set('edit', editId);
        const q = params.toString();
        return q ? `${base}?${q}` : base;
    };

    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    const handleSearchByCNIC = async () => {
        if (!searchCNIC.trim() || !cropId || !shopId || !token) {
            Notification({ text: 'Please enter customer CNIC (13 digits)', color: 'warning' });
            return;
        }
        const cnic = searchCNIC.trim().replace(/\D/g, '').slice(0, 13);
        if (cnic.length < 10) {
            Notification({ text: 'Enter valid CNIC (at least 10 digits)', color: 'warning' });
            return;
        }
        setSearchingByCNIC(true);
        setLoading(true);
        try {
            const res = await axios.post(
                `${ServerSetting.serUrl}/api/getFinanceByCropShopAndCNIC`,
                { cropId: String(cropId), shopId: String(shopId), cnic: cnic },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.status === 200) {
                const data = res.data.data || [];
                setLoans(Array.isArray(data) ? data : []);
                setSelectedCustomer(res.data.customer || null);
                Notification({
                    text: res.data.customer
                        ? `Records for ${res.data.customer.cusNameF} ${res.data.customer.cusNameL}`
                        : 'Records loaded',
                    color: 'success',
                });
            } else if (res.data?.status === 404) {
                setLoans([]);
                setSelectedCustomer(null);
                Notification({ text: res.data.message || 'No customer found with this CNIC', color: 'warning' });
            } else {
                Notification({ text: res.data?.message || 'Search failed', color: 'error' });
            }
        } catch (e: any) {
            Notification({ text: e.response?.data?.message || 'Error searching by CNIC', color: 'error' });
            setLoans([]);
            setSelectedCustomer(null);
        } finally {
            setSearchingByCNIC(false);
            setLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearchCNIC('');
        setSelectedCustomer(null);
        fetchLoans();
    };

    const updatePaymentStatus = async (loanId: string, paymentStatus: number) => {
        if (!token) return;
        setUpdatingStatusId(loanId);
        try {
            const res = await axios.patch(
                `${ServerSetting.serUrl}/api/updateFinancePaymentStatus`,
                { _id: loanId, paymentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.status === 200) {
                setLoans((prev) =>
                    prev.map((l) => (l._id === loanId ? { ...l, paymentStatus } : l))
                );
                Notification({ text: 'Status updated', color: 'success' });
            } else {
                Notification({ text: res.data?.message || 'Update failed', color: 'error' });
            }
        } catch (e: any) {
            Notification({ text: e.response?.data?.message || 'Error updating status', color: 'error' });
        } finally {
            setUpdatingStatusId(null);
        }
    };

    // Sort and paginate
    const sortedLoans = [...loans].sort((a, b) => {
        const { columnAccessor, direction } = sortStatus;
        let aValue: any = a[columnAccessor as keyof Loan];
        let bValue: any = b[columnAccessor as keyof Loan];

        if (columnAccessor === 'createdAt') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        }

        if (direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
    });

    const paginatedLoans = sortedLoans.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    return (
        <div>
            {/* Breadcrumb */}
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li>
                    <Link to="/dashboard" className="text-primary hover:underline">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link to="/getassginshopcrops" className="text-primary hover:underline">
                        My Crops
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Loan List</span>
                </li>
            </ul>

            {/* Header Section */}
            <PageHeader
                title={`Loan List${cropName ? ` – ${cropName}` : ''}`}
                description={cropName ? `View and manage loans given for "${cropName}" only` : 'View and manage all loans for this crop'}
                onBack={() => navigate(-1)}
                backLabel="Back to Crop"
                rightContent={
                    <button
                        type="button"
                        className="btn bg-white text-primary hover:bg-white/90 border-0"
                        onClick={() => navigate(getFinanceFormUrl())}
                        disabled={!effectiveUserId || !cropId || !shopId}
                    >
                        <IconPlus className="w-4 h-4 mr-2" />
                        Give New Loan
                    </button>
                }
                icon="📋"
            />

            {/* Summary Cards – only when crop + shop resolved */}
            {(cropId && shopId) && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                <div className="panel bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-500 dark:to-primary-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-900 dark:text-white text-sm font-medium">Loans Given (Count)</span>
                        <FaFileInvoice className="w-5 h-5 text-gray-800 dark:text-white opacity-80" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{loansGivenCount}</div>
                </div>

                <div className="panel bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-900 dark:text-white text-sm font-medium">Total Given (Loans)</span>
                        <span className="text-gray-800 dark:text-white opacity-80">💰</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalGiven)}</div>
                </div>

                <div className="panel bg-gradient-to-br from-success-400 to-success-600 dark:from-success-500 dark:to-success-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-900 dark:text-white text-sm font-medium">Total Received (Paid)</span>
                        <span className="text-gray-800 dark:text-white opacity-80">✅</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalReceived)}</div>
                </div>

                <div className="panel bg-gradient-to-br from-warning-400 to-warning-600 dark:from-warning-500 dark:to-warning-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-900 dark:text-white text-sm font-medium">Remaining (Baki)</span>
                        <span className="text-gray-800 dark:text-white opacity-80">📊</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalRemaining)}</div>
                </div>
            </div>
            )}

            {/* CNIC Search – specific customer records */}
            {(cropId && shopId) && (
            <div className="panel mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
                            Customer CNIC se record dekhen
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IconCreditCard className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchCNIC}
                                onChange={(e) => setSearchCNIC(e.target.value.replace(/\D/g, '').slice(0, 13))}
                                placeholder="13-digit CNIC (e.g. 3310112345678)"
                                className="form-input pl-10 w-full"
                                maxLength={13}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchByCNIC()}
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
                                Clear – All Records
                            </button>
                        )}
                    </div>
                </div>
                {selectedCustomer && (
                    <p className="mt-3 text-sm text-primary-600 dark:text-primary-400 font-medium">
                        Showing records for: {selectedCustomer.cusNameF} {selectedCustomer.cusNameL} (CNIC: {selectedCustomer.cusCNIC})
                    </p>
                )}
            </div>
            )}

            {/* Loans Table */}
            <div className="panel">
                <div className="mb-5">
                    <h5 className="text-lg font-semibold">
                        {selectedCustomer
                            ? `Loans for ${selectedCustomer.cusNameF} ${selectedCustomer.cusNameL}`
                            : cropName ? `Loans for ${cropName}` : 'All Loans'}
                    </h5>
                </div>

                {loading ? (
                    <div className="text-center py-10">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="mt-4 text-gray-600">
                            {fetchingShopId ? 'Resolving shop...' : 'Loading loans...'}
                        </p>
                    </div>
                ) : !cropId || !shopId ? (
                    <div className="text-center py-10">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h3 className="text-xl font-semibold mb-2">Cannot Load Loans</h3>
                        <p className="text-gray-600 mb-4">
                            Crop or shop could not be resolved. Please open Loan List from the crop menu.
                        </p>
                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => navigate(-1)}
                        >
                            <IconArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </button>
                    </div>
                ) : loans.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold mb-2">
                            No Loans for {cropName || 'This Crop'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            There are no loans recorded for this crop yet. Give a loan from this crop to see it here.
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => navigate(getFinanceFormUrl())}
                        >
                            <IconPlus className="w-4 h-4 mr-2" />
                            Give First Loan
                        </button>
                    </div>
                ) : (
                    <div className="datatables">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={paginatedLoans}
                            columns={[
                                {
                                    accessor: 'index',
                                    title: '#',
                                    render: (_, index) => (page - 1) * pageSize + index + 1,
                                },
                                {
                                    accessor: 'finaceCusId',
                                    title: 'Customer',
                                    sortable: true,
                                    render: (loan: Loan) => (
                                        <div>
                                            <div className="font-semibold">
                                                {loan.finaceCusId?.cusNameF} {loan.finaceCusId?.cusNameL}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                CNIC: {loan.finaceCusId?.cusCNIC}
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'loanAmount',
                                    title: 'Loan Amount',
                                    sortable: true,
                                    render: (loan: Loan) => (
                                        <span className="font-semibold text-primary">
                                            {formatCurrency(loan.loanAmount)}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'loanPaidAmount',
                                    title: 'Paid Amount',
                                    sortable: true,
                                    render: (loan: Loan) => (
                                        <span className="font-semibold text-success">
                                            {formatCurrency(loan.loanPaidAmount || 0)}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'remaining',
                                    title: 'Remaining',
                                    render: (loan: Loan) => {
                                        const remaining = loan.finaceType === 0 ? calculateRemainingAmount(loan) : 0;
                                        return (
                                            <span
                                                className={`font-semibold ${
                                                    remaining > 0 ? 'text-warning' : 'text-success'
                                                }`}
                                            >
                                                {formatCurrency(remaining)}
                                            </span>
                                        );
                                    },
                                },
                                {
                                    accessor: 'finaceType',
                                    title: 'Type',
                                    sortable: true,
                                    render: (loan: Loan) => (
                                        <span
                                            className={`badge bg-${getLoanTypeColor(loan.finaceType)}-light text-${getLoanTypeColor(loan.finaceType)} rounded-full`}
                                        >
                                            {getLoanTypeLabel(loan.finaceType)}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'paymentStatus',
                                    title: 'Status',
                                    sortable: true,
                                    render: (loan: Loan) => {
                                        const display = getPaymentStatusDisplay(loan);
                                        if (display.canEdit) {
                                            return (
                                                <select
                                                    value={display.value}
                                                    onChange={(e) => updatePaymentStatus(loan._id, Number(e.target.value))}
                                                    disabled={updatingStatusId === loan._id}
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
                                    accessor: 'createdAt',
                                    title: 'Date',
                                    sortable: true,
                                    render: (loan: Loan) => formatDate(loan.createdAt),
                                },
                                {
                                    accessor: 'actions',
                                    title: 'Actions',
                                    render: (loan: Loan) => (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => {
                                                    setSelectedLoan(loan);
                                                    setViewModal(true);
                                                }}
                                                title="View Details"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-success"
                                                onClick={() => navigate(getFinanceFormUrl(loan._id))}
                                                title="Edit Loan"
                                            >
                                                <FaEdit />
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            totalRecords={loans.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={[10, 25, 50, 100]}
                            onRecordsPerPageChange={setPageSize}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) =>
                                `Showing ${from} to ${to} of ${totalRecords} loans`
                            }
                        />
                    </div>
                )}
            </div>

            {/* View Loan Modal */}
            {viewModal && selectedLoan && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Loan Details</h3>
                                <button
                                    type="button"
                                    className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-white"
                                    onClick={() => setViewModal(false)}
                                    aria-label="Close"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-6">
                                <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/30 p-4">
                                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Customer</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Customer Name</label>
                                            <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{customerName(selectedLoan)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">CNIC</label>
                                            <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{customerCNIC(selectedLoan)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
                                            <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{customerPhone(selectedLoan)}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/30 p-4">
                                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Loan</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Loan Type</label>
                                            <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{getLoanTypeLabel(selectedLoan.finaceType)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Loan Amount</label>
                                            <p className="mt-0.5 font-semibold text-primary">{formatCurrency(selectedLoan.loanAmount)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Paid Amount</label>
                                            <p className="mt-0.5 font-semibold text-success">{formatCurrency(selectedLoan.loanPaidAmount ?? null)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Remaining Amount</label>
                                            <p className="mt-0.5 font-semibold text-warning">
                                                {formatCurrency(selectedLoan.finaceType === 0 ? calculateRemainingAmount(selectedLoan) : 0)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                                            <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{getPaymentStatusDisplay(selectedLoan).label}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Remarks</label>
                                            <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{selectedLoan.finaceRemarks || '—'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Created Date</label>
                                            <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{formatDate(selectedLoan.createdAt)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                                            <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{formatDate(selectedLoan.updatedAt)}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/30 p-4">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">POS User Record</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Product requests from connected POS users linked to this loan. Customer collects from POS shop; shop owner pays POS user via POS Payments.</p>
                                    {posUserRecordsLoading ? (
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 py-3">
                                            <span className="animate-spin border-2 border-primary border-t-transparent rounded-full w-4 h-4 inline-block" /> Loading...
                                        </div>
                                    ) : posUserRecords.length === 0 ? (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm py-3">No POS user records for this loan. You can add products when editing the loan (Medicine type).</p>
                                    ) : (
                                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                                            <table className="table-auto w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-gray-600">
                                                        <th className="text-left py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300">Receipt</th>
                                                        <th className="text-left py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300">POS User</th>
                                                        <th className="text-right py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                                                        <th className="text-left py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                                        <th className="text-left py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {posUserRecords.map((r: any) => (
                                                        <tr key={r._id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                                                            <td className="py-2.5 px-3 font-mono text-gray-900 dark:text-white">{r.receiptNumber}</td>
                                                            <td className="py-2.5 px-3 text-gray-900 dark:text-white">{r.posUserName || '—'}</td>
                                                            <td className="py-2.5 px-3 text-right font-medium text-gray-900 dark:text-white">{r.totalAmount != null ? `Rs ${Number(r.totalAmount).toLocaleString()}` : '—'}</td>
                                                            <td className="py-2.5 px-3">
                                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${r.status === 'fulfilled' ? 'bg-success/20 text-success' : r.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'}`}>
                                                                    {r.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400">{r.createdAt ? formatDate(r.createdAt) : '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </section>

                                <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                                    <button
                                        type="button"
                                        className="btn btn-primary inline-flex items-center"
                                        onClick={() => {
                                            setViewModal(false);
                                            navigate(getFinanceFormUrl(selectedLoan._id));
                                        }}
                                    >
                                        <FaEdit className="w-4 h-4 mr-2" />
                                        Edit Loan
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

export default LoanList;

