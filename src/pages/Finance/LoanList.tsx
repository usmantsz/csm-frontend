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
import IconSearch from '../../components/Icon/IconSearch';
import IconCreditCard from '../../components/Icon/IconCreditCard';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useTranslation } from 'react-i18next';

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

const LoanList: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { token, user } = useAuthToken();
    const { shopId: urlShopId } = useShopIdFromUrl();
    const { shopId: userShopId } = useShopId();
    const { userId: paramUserId, cropId } = useParams<{ userId: string; cropId: string }>();
    const navigate = useNavigate();

    const PAYMENT_STATUS_OPTIONS = [
        { value: 0, label: t('finance_status_given') },
        { value: 1, label: t('finance_status_partial') },
        { value: 2, label: t('finance_status_full') },
    ];

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
        dispatch(setPageTitle(t('loanlist_page_title')));
    }, [dispatch, t]);

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
                    text: response.data.message || t('loanlist_notif_fetch_failed'),
                    color: 'error',
                });
                setLoans([]);
            }
        } catch (error: any) {
            console.error('Error fetching loans:', error);
            Notification({
                text: error.response?.data?.message || t('loanlist_notif_error_loading'),
                color: 'error',
            });
            setLoans([]);
        } finally {
            setLoading(false);
        }
    };

    const getLoanTypeLabel = (type: number) => {
        const types: { [key: number]: string } = {
            0: t('finance_type_loan_given'),
            1: t('finance_type_loan_returned'),
            2: t('finance_type_payment'),
            3: t('finance_type_medicine'),
        };
        return types[type as keyof typeof types] ?? t('loanlist_type_unknown');
    };

    // Returns a full Tailwind class string for the loan-type badge (dark theme)
    const getLoanTypeBadgeClasses = (type: number) => {
        const classes: { [key: number]: string } = {
            0: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
            1: 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
            2: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
            3: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
        };
        return classes[type] || 'bg-slate-500/10 text-slate-300 border border-slate-500/30';
    };

    const getStatusLabel = (status: number) => {
        const statuses: { [key: number]: string } = {
            0: t('loanlist_status_active'),
            1: t('loanlist_status_deleted'),
            2: t('loanlist_status_completed'),
        };
        return statuses[status] || t('loanlist_status_unknown');
    };

    // Returns a full Tailwind class string for the payment-status badge (dark theme)
    const getPaymentStatusBadgeClasses = (color: string) => {
        const classes: { [key: string]: string } = {
            primary: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
            warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
            success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
            info: 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
        };
        return classes[color] || 'bg-slate-500/10 text-slate-300 border border-slate-500/30';
    };

    // Payment/return display: 0=Loan de diya, 1=Kuch baki, 2=Full return (saved or derived)
    const getPaymentStatusDisplay = (loan: Loan) => {
        if (loan.finaceType === 1) return { value: 1, label: t('loanlist_payment_return_aaya'), color: 'success', canEdit: false };
        if (loan.finaceType === 2) return { value: 2, label: t('loanlist_payment_payment'), color: 'info', canEdit: false };
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
        const labels: { [key: number]: string } = { 0: t('finance_status_given'), 1: t('finance_status_partial'), 2: t('finance_status_full') };
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
            Notification({ text: t('loanlist_notif_enter_cnic'), color: 'warning' });
            return;
        }
        const cnic = searchCNIC.trim().replace(/\D/g, '').slice(0, 13);
        if (cnic.length < 10) {
            Notification({ text: t('loanlist_notif_invalid_cnic'), color: 'warning' });
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
                        ? `${t('loanlist_notif_records_for')} ${res.data.customer.cusNameF} ${res.data.customer.cusNameL}`
                        : t('loanlist_notif_records_loaded'),
                    color: 'success',
                });
            } else if (res.data?.status === 404) {
                setLoans([]);
                setSelectedCustomer(null);
                Notification({ text: res.data.message || t('loanlist_notif_no_customer_found'), color: 'warning' });
            } else {
                Notification({ text: res.data?.message || t('loanlist_notif_search_failed'), color: 'error' });
            }
        } catch (e: any) {
            Notification({ text: e.response?.data?.message || t('loanlist_notif_error_searching_cnic'), color: 'error' });
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
                Notification({ text: t('loanlist_notif_status_updated'), color: 'success' });
            } else {
                Notification({ text: res.data?.message || t('loanlist_notif_update_failed'), color: 'error' });
            }
        } catch (e: any) {
            Notification({ text: e.response?.data?.message || t('loanlist_notif_error_updating_status'), color: 'error' });
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
        <div className="bg-[#050b14] min-h-full -m-5 p-5">
            {/* Breadcrumb */}
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6 text-sm">
                <li>
                    <Link to="/dashboard"
                    className="text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                        {t('loanlist_breadcrumb_dashboard')}
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 before:text-slate-600 text-slate-400">
                    <Link to="/getassginshopcrops" className="text-emerald-400 hover:text-emerald-300 hover:underline">
                        {t('loanlist_breadcrumb_my_crops')}
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 before:text-slate-600 text-slate-400">
                    <span>{t('loanlist_breadcrumb_loan_list')}</span>
                </li>
            </ul>

            {/* Back + Give New Loan buttons - top right, outside card */}
            <div className="flex justify-end items-center gap-3 mb-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-900/30 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-400 hover:text-emerald-300 transition-all"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {t('loanlist_back_to_crop')}
                </button>
                <button
                    type="button"
                    className="inline-flex items-center px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#050b14] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => navigate(getFinanceFormUrl())}
                    disabled={!effectiveUserId || !cropId || !shopId}
                >
                    <IconPlus className="w-4 h-4 mr-2" />
                    {t('loanlist_give_new_loan')}
                </button>
            </div>

            {/* Summary + CNIC Search – single merged card, only when crop + shop resolved */}
            {(cropId && shopId) && (
            <div className="rounded-xl border border-[#162b42] bg-[#0d1d2d] p-5 shadow-xl mb-6">
                {/* Summary Cards */}
                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-lg border border-[#162b42] bg-[#0a1624] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-400 text-sm font-medium">{t('loanlist_summary_loans_given_count')}</span>
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                <FaFileInvoice className="w-4 h-4 text-emerald-400" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">{loansGivenCount}</div>
                    </div>

                    <div className="rounded-lg border border-[#162b42] bg-[#0a1624] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-400 text-sm font-medium">{t('loanlist_summary_total_given')}</span>
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                <span className="text-emerald-400">💰</span>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">{formatCurrency(totalGiven)}</div>
                    </div>

                    <div className="rounded-lg border border-[#162b42] bg-[#0a1624] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-400 text-sm font-medium">{t('loanlist_summary_total_received')}</span>
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30">
                                <span className="text-sky-400">✅</span>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-sky-400">{formatCurrency(totalReceived)}</div>
                    </div>

                    <div className="rounded-lg border border-[#162b42] bg-[#0a1624] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-400 text-sm font-medium">{t('loanlist_summary_remaining')}</span>
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                <span className="text-amber-400">📊</span>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-amber-400">{formatCurrency(totalRemaining)}</div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#162b42] my-5"></div>

                {/* CNIC Search – specific customer records */}
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block mb-2 font-semibold text-slate-300 text-xs uppercase tracking-wide">
                            {t('loanlist_cnic_search_label')}
                        </label>
                        <div className="relative rounded-lg">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <IconCreditCard className="w-4 h-4 text-slate-500" />
                            </div>
                            <input
                                type="text"
                                value={searchCNIC}
                                onChange={(e) => setSearchCNIC(e.target.value.replace(/\D/g, '').slice(0, 13))}
                                placeholder={t('loanlist_cnic_search_placeholder')}
                                className="w-full pl-10 pr-4 py-2.5 bg-[#0a1624] border border-[#162b42] text-sm text-slate-100 placeholder-slate-500 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
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
                            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {searchingByCNIC ? (
                                <>
                                    <span className="animate-spin border-2 border-slate-950 border-t-transparent rounded-full w-4 h-4 inline-block mr-2"></span>
                                    {t('loanlist_searching')}
                                </>
                            ) : (
                                <>
                                    <IconSearch className="w-4 h-4 mr-2" />
                                    {t('loanlist_search')}
                                </>
                            )}
                        </button>
                        {selectedCustomer && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="inline-flex items-center px-4 py-2.5 rounded-lg border border-[#162b42] text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 text-xs font-medium transition-colors"
                            >
                                {t('loanlist_clear_all_records')}
                            </button>
                        )}
                    </div>
                </div>
                {selectedCustomer && (
                    <p className="mt-3 text-sm text-emerald-400 font-medium">
                        {t('loanlist_showing_records_for')} {selectedCustomer.cusNameF} {selectedCustomer.cusNameL} ({t('loanlist_cnic_label_short')} {selectedCustomer.cusCNIC})
                    </p>
                )}
            </div>
            )}

            {/* Loans Table */}
            <div className="rounded-xl border border-[#162b42] bg-[#0d1d2d] p-6 shadow-xl">
                <div className="mb-5">
                    <h5 className="text-base font-semibold text-slate-100 tracking-tight">
                        {selectedCustomer
                            ? `${t('loanlist_loans_for')} ${selectedCustomer.cusNameF} ${selectedCustomer.cusNameL}`
                            : cropName ? `${t('loanlist_loans_for')} ${cropName}` : t('loanlist_all_loans')}
                    </h5>
                </div>

                {loading ? (
                    <div className="text-center py-10">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        <p className="mt-4 text-slate-400">
                            {fetchingShopId ? t('loanlist_resolving_shop') : t('loanlist_loading_loans')}
                        </p>
                    </div>
                ) : !cropId || !shopId ? (
                    <div className="text-center py-10">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h3 className="text-xl font-semibold mb-2 text-slate-100">{t('loanlist_cannot_load_title')}</h3>
                        <p className="text-slate-400 mb-4">
                            {t('loanlist_cannot_load_desc')}
                        </p>
                        <button
                            type="button"
                            className="inline-flex items-center px-4 py-2.5 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/30 text-xs font-medium transition-colors"
                            onClick={() => navigate(-1)}
                        >
                            <IconArrowLeft className="w-4 h-4 mr-2" />
                            {t('loanlist_go_back')}
                        </button>
                    </div>
                ) : loans.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold mb-2 text-slate-100">
                            {t('loanlist_no_loans_for')} {cropName || t('loanlist_this_crop')}
                        </h3>
                        <p className="text-slate-400 mb-4">
                            {t('loanlist_no_loans_desc')}
                        </p>
                        <button
                            type="button"
                            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20"
                            onClick={() => navigate(getFinanceFormUrl())}
                        >
                            <IconPlus className="w-4 h-4 mr-2" />
                            {t('loanlist_give_first_loan')}
                        </button>
                    </div>
                ) : (
                    <div className="datatables px-1 pb-3 [&_.mantine-datatable-footer]:px-2 [&_.mantine-datatable-footer]:mt-2">
                        <DataTable
                            className="whitespace-nowrap table-hover !bg-transparent !text-slate-200
                                [&_table]:!bg-transparent
                                [&_thead]:!bg-[#0a1624]
                                [&_thead_th]:!text-slate-400 [&_thead_th]:!text-[11px] [&_thead_th]:!font-semibold [&_thead_th]:!uppercase [&_thead_th]:!tracking-wider [&_thead_th]:!border-[#162b42]
                                [&_tbody_tr]:!border-[#162b42] [&_tbody_tr]:!bg-transparent
                                [&_tbody_tr:hover]:!bg-slate-800/40
                                [&_.mantine-Pagination-root]:!text-slate-400
                                [&_select]:!bg-[#0a1624] [&_select]:!border-[#162b42] [&_select]:!text-slate-300"
                            records={paginatedLoans}
                            columns={[
                                {
                                    accessor: 'index',
                                    title: t('loanlist_col_index'),
                                    render: (_, index) => <span className="text-slate-300">{(page - 1) * pageSize + index + 1}</span>,
                                },
                                {
                                    accessor: 'finaceCusId',
                                    title: t('loanlist_col_customer'),
                                    sortable: true,
                                    render: (loan: Loan) => (
                                        <div>
                                            <div className="font-semibold text-slate-200">
                                                {loan.finaceCusId?.cusNameF} {loan.finaceCusId?.cusNameL}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {t('loanlist_cnic_label_short')} {loan.finaceCusId?.cusCNIC}
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'loanAmount',
                                    title: t('loanlist_col_loan_amount'),
                                    sortable: true,
                                    render: (loan: Loan) => (
                                        <span className="font-semibold text-emerald-400">
                                            {formatCurrency(loan.loanAmount)}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'loanPaidAmount',
                                    title: t('loanlist_col_paid_amount'),
                                    sortable: true,
                                    render: (loan: Loan) => (
                                        <span className="font-semibold text-sky-400">
                                            {formatCurrency(loan.loanPaidAmount || 0)}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'remaining',
                                    title: t('loanlist_col_remaining'),
                                    render: (loan: Loan) => {
                                        const remaining = loan.finaceType === 0 ? calculateRemainingAmount(loan) : 0;
                                        return (
                                            <span
                                                className={`font-semibold ${
                                                    remaining > 0 ? 'text-amber-400' : 'text-emerald-400'
                                                }`}
                                            >
                                                {formatCurrency(remaining)}
                                            </span>
                                        );
                                    },
                                },
                                {
                                    accessor: 'finaceType',
                                    title: t('loanlist_col_type'),
                                    sortable: true,
                                    render: (loan: Loan) => (
                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 text-[11px] font-medium rounded-full ${getLoanTypeBadgeClasses(loan.finaceType)}`}
                                        >
                                            {getLoanTypeLabel(loan.finaceType)}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'paymentStatus',
                                    title: t('loanlist_col_status'),
                                    sortable: true,
                                    render: (loan: Loan) => {
                                        const display = getPaymentStatusDisplay(loan);
                                        if (display.canEdit) {
                                            return (
                                                <select
                                                    value={display.value}
                                                    onChange={(e) => updatePaymentStatus(loan._id, Number(e.target.value))}
                                                    disabled={updatingStatusId === loan._id}
                                                    className="text-xs min-w-[160px] rounded-full border border-[#162b42] bg-[#0a1624] text-slate-200 px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                                                >
                                                    {PAYMENT_STATUS_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value} className="bg-[#0a1624] text-slate-200">
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            );
                                        }
                                        return (
                                            <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-medium rounded-full ${getPaymentStatusBadgeClasses(display.color)}`}>
                                                {display.label}
                                            </span>
                                        );
                                    },
                                },
                                {
                                    accessor: 'createdAt',
                                    title: t('loanlist_col_date'),
                                    sortable: true,
                                    render: (loan: Loan) => <span className="text-slate-300">{formatDate(loan.createdAt)}</span>,
                                },
                                {
                                    accessor: 'actions',
                                    title: t('loanlist_col_actions'),
                                    render: (loan: Loan) => (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-emerald-500/40 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all"
                                                onClick={() => {
                                                    setSelectedLoan(loan);
                                                    setViewModal(true);
                                                }}
                                                title={t('loanlist_view_details')}
                                            >
                                                <FaEye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-sky-500/40 bg-sky-950/30 text-sky-400 hover:bg-sky-500 hover:text-slate-950 transition-all"
                                                onClick={() => navigate(getFinanceFormUrl(loan._id))}
                                                title={t('loanlist_edit_loan')}
                                            >
                                                <FaEdit className="w-3.5 h-3.5" />
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
                                `${t('loanlist_pagination_showing')} ${from} ${t('loanlist_pagination_to')} ${to} ${t('loanlist_pagination_of')} ${totalRecords} ${t('loanlist_pagination_loans')}`
                            }
                        />
                    </div>
                )}
            </div>

            {/* View Loan Modal */}
            {viewModal && selectedLoan && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0d1d2d] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#162b42]">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-100">{t('loanlist_modal_title')}</h3>
                                <button
                                    type="button"
                                    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                    onClick={() => setViewModal(false)}
                                    aria-label={t('loanlist_close_aria')}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-6">
                                <section className="rounded-lg border border-[#162b42] bg-[#0a1624] p-4">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{t('loanlist_section_customer')}</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500">{t('loanlist_field_customer_name')}</label>
                                            <p className="mt-0.5 font-semibold text-slate-100">{customerName(selectedLoan)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500">{t('loanlist_field_cnic')}</label>
                                            <p className="mt-0.5 font-semibold text-slate-100">{customerCNIC(selectedLoan)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500">{t('loanlist_field_phone')}</label>
                                            <p className="mt-0.5 font-semibold text-slate-100">{customerPhone(selectedLoan)}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-lg border border-[#162b42] bg-[#0a1624] p-4">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{t('loanlist_section_loan')}</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500">{t('loanlist_field_loan_type')}</label>
                                            <p className="mt-0.5 font-semibold text-slate-100">{getLoanTypeLabel(selectedLoan.finaceType)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500">{t('loanlist_field_loan_amount')}</label>
                                            <p className="mt-0.5 font-semibold text-emerald-400">{formatCurrency(selectedLoan.loanAmount)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500">{t('loanlist_field_paid_amount')}</label>
                                            <p className="mt-0.5 font-semibold text-sky-400">{formatCurrency(selectedLoan.loanPaidAmount ?? null)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500">{t('loanlist_field_remaining_amount')}</label>
                                            <p className="mt-0.5 font-semibold text-amber-400">
                                                {formatCurrency(selectedLoan.finaceType === 0 ? calculateRemainingAmount(selectedLoan) : 0)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500">{t('loanlist_field_status')}</label>
                                            <p className="mt-0.5 font-semibold text-slate-100">{getPaymentStatusDisplay(selectedLoan).label}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-slate-500">{t('loanlist_field_remarks')}</label>
                                            <p className="mt-0.5 font-semibold text-slate-100">{selectedLoan.finaceRemarks || '—'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500">{t('loanlist_field_created_date')}</label>
                                            <p className="mt-0.5 font-semibold text-slate-100">{formatDate(selectedLoan.createdAt)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500">{t('loanlist_field_last_updated')}</label>
                                            <p className="mt-0.5 font-semibold text-slate-100">{formatDate(selectedLoan.updatedAt)}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-lg border border-[#162b42] bg-[#0a1624] p-4">
                                    <h4 className="text-sm font-semibold text-slate-300 mb-1">{t('loanlist_pos_record_title')}</h4>
                                    <p className="text-xs text-slate-500 mb-3">{t('loanlist_pos_record_desc')}</p>
                                    {posUserRecordsLoading ? (
                                        <div className="flex items-center gap-2 text-slate-400 py-3">
                                            <span className="animate-spin border-2 border-emerald-500 border-t-transparent rounded-full w-4 h-4 inline-block" /> {t('loanlist_loading')}
                                        </div>
                                    ) : posUserRecords.length === 0 ? (
                                        <p className="text-slate-500 text-sm py-3">{t('loanlist_no_pos_records')}</p>
                                    ) : (
                                        <div className="overflow-x-auto rounded-lg border border-[#162b42]">
                                            <table className="table-auto w-full text-sm">
                                                <thead>
                                                    <tr className="bg-[#050b14] border-b border-[#162b42]">
                                                        <th className="text-left py-2.5 px-3 font-semibold text-slate-300">{t('loanlist_pos_col_receipt')}</th>
                                                        <th className="text-left py-2.5 px-3 font-semibold text-slate-300">{t('loanlist_pos_col_pos_user')}</th>
                                                        <th className="text-right py-2.5 px-3 font-semibold text-slate-300">{t('loanlist_pos_col_amount')}</th>
                                                        <th className="text-left py-2.5 px-3 font-semibold text-slate-300">{t('loanlist_pos_col_status')}</th>
                                                        <th className="text-left py-2.5 px-3 font-semibold text-slate-300">{t('loanlist_pos_col_date')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {posUserRecords.map((r: any) => (
                                                        <tr key={r._id} className="border-b border-[#162b42]/60 last:border-0">
                                                            <td className="py-2.5 px-3 font-mono text-slate-200">{r.receiptNumber}</td>
                                                            <td className="py-2.5 px-3 text-slate-200">{r.posUserName || '—'}</td>
                                                            <td className="py-2.5 px-3 text-right font-medium text-slate-200">{r.totalAmount != null ? `Rs ${Number(r.totalAmount).toLocaleString()}` : '—'}</td>
                                                            <td className="py-2.5 px-3">
                                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${r.status === 'fulfilled' ? 'bg-emerald-500/10 text-emerald-400' : r.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700/40 text-slate-300'}`}>
                                                                    {r.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 px-3 text-slate-500">{r.createdAt ? formatDate(r.createdAt) : '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </section>

                                <div className="flex flex-wrap gap-3 pt-2 border-t border-[#162b42]">
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20"
                                        onClick={() => {
                                            setViewModal(false);
                                            navigate(getFinanceFormUrl(selectedLoan._id));
                                        }}
                                    >
                                        <FaEdit className="w-4 h-4 mr-2" />
                                        {t('loanlist_edit_loan')}
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-5 py-2.5 rounded-lg border border-[#162b42] text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 text-xs font-medium transition-colors"
                                        onClick={() => setViewModal(false)}
                                    >
                                        {t('loanlist_close_btn')}
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
