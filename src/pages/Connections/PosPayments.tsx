import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { DataTable, DataTableColumn, DataTableSortStatus } from 'mantine-datatable';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import axios from 'axios';
import Swal from 'sweetalert2';
import IconSearch from '../../components/Icon/IconSearch';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import { useTranslation } from 'react-i18next';

const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

type OutstandingRow = {
    posUserId: string;
    posUserName: string;
    posShopName: string;
    totalOwed: number;
    paid: number;
    outstanding: number;
};

type PaymentRow = {
    _id: string;
    shopOwnerId: any;
    posUserId: any;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    remarks: string;
    referenceNumber?: string;
    shopOwnerName?: string;
    posUserName?: string;
};

const PosPayments = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const [outstanding, setOutstanding] = useState<OutstandingRow[]>([]);
    const [payments, setPayments] = useState<PaymentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [remarks, setRemarks] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentIdempotencyKey, setPaymentIdempotencyKey] = useState('');

    const [payModalOpen, setPayModalOpen] = useState(false);
    const [payModalRow, setPayModalRow] = useState<OutstandingRow | null>(null);
    const [modalHistoryPage, setModalHistoryPage] = useState(1);
    const [modalHistoryPageSize, setModalHistoryPageSize] = useState(5);

    const [outstandingPage, setOutstandingPage] = useState(1);
    const [outstandingPageSize, setOutstandingPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPageSize, setHistoryPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [historySearch, setHistorySearch] = useState('');
    const [historyFilterPosUserId, setHistoryFilterPosUserId] = useState('');
    const [historySort, setHistorySort] = useState<DataTableSortStatus>({
        columnAccessor: 'paymentDate',
        direction: 'desc',
    });

    useEffect(() => {
        dispatch(setPageTitle(t('pos_payments_title')));
    }, [dispatch, t]);

    const fetchData = () => {
        if (!token) return;
        setLoading(true);
        Promise.all([
            axios.get(`${ServerSetting.apiUrl}/shop-owner-pos/outstanding`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
            axios.get(`${ServerSetting.apiUrl}/shop-owner-pos/payments`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
        ])
            .then(([outRes, payRes]) => {
                if (outRes.data?.data) setOutstanding(outRes.data.data);
                if (payRes.data?.data) setPayments(payRes.data.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    useEffect(() => {
        if (payModalOpen && payModalRow) {
            setPaymentIdempotencyKey(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}-${Math.random()}`);
            setPaymentReference('');
        }
    }, [payModalOpen, payModalRow?.posUserId]);

    const downloadOutstandingCsv = () => {
        const headers = ['POS User', 'POS Shop', 'Total Owed', 'Paid', 'Outstanding'];
        const lines = [headers.join(',')];
        outstanding.forEach((r) => {
            const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
            lines.push(
                [esc(r.posUserName), esc(r.posShopName), r.totalOwed, r.paid, r.outstanding].join(',')
            );
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pos-outstanding-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleRecordPayment = () => {
        const posId = payModalRow?.posUserId;
        const amt = Number(amount);
        if (!posId || !(amt > 0)) {
            Swal.fire({ title: t('error'), text: t('invalid_enter_amount'), icon: 'warning' });
            return;
        }
        if (!token) return;
        setPaying(true);
        axios
            .post(
                `${ServerSetting.apiUrl}/shop-owner-pos/payment`,
                {
                    posUserId: posId,
                    amount: amt,
                    paymentMethod,
                    remarks,
                    referenceNumber: paymentReference.trim(),
                    idempotencyKey: paymentIdempotencyKey || undefined,
                },
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            )
            .then((r) => {
                if (r.data.status === 201 || r.data.status === 200) {
                    Swal.fire({ title: t('saved'), text: r.data.message || t('payment_recorded'), icon: 'success' });
                    setAmount('');
                    setRemarks('');
                    setPaymentReference('');
                    fetchData();
                    setPayModalOpen(false);
                    setPayModalRow(null);
                } else {
                    Swal.fire({ title: t('error'), text: r.data.message || t('request_failed'), icon: 'error' });
                }
            })
            .catch(() => Swal.fire({ title: t('error'), text: t('request_failed'), icon: 'error' }))
            .finally(() => setPaying(false));
    };

    const openPayModal = (row: OutstandingRow) => {
        setPayModalRow(row);
        setAmount('');
        setRemarks('');
        setPaymentReference('');
        setModalHistoryPage(1);
        setPayModalOpen(true);
    };

    const getPosUserName = (p: PaymentRow) => {
        if (p.posUserId && typeof p.posUserId === 'object' && (p.posUserId.userNameF || p.posUserId.userNameL)) {
            return `${p.posUserId.userNameF || ''} ${p.posUserId.userNameL || ''}`.trim();
        }
        return (p as any).posUserName || '—';
    };

    const getPosUserIdFromPayment = (p: PaymentRow) => {
        if (!p.posUserId) return '';
        return typeof p.posUserId === 'object' ? (p.posUserId as any)._id : String(p.posUserId);
    };

    const totalPaidToPosUser = useMemo(() => {
        if (!historyFilterPosUserId) return null;
        const total = payments
            .filter((p) => getPosUserIdFromPayment(p) === historyFilterPosUserId)
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const name = outstanding.find((o) => o.posUserId === historyFilterPosUserId)?.posUserName || getPosUserName(payments.find((p) => getPosUserIdFromPayment(p) === historyFilterPosUserId)!) || 'POS User';
        return { total, name };
    }, [payments, outstanding, historyFilterPosUserId]);

    const modalUserPayments = useMemo(() => {
        if (!payModalRow?.posUserId) return [];
        return payments.filter((p) => getPosUserIdFromPayment(p) === payModalRow.posUserId);
    }, [payments, payModalRow?.posUserId]);
    const modalUserPaymentsPaged = useMemo(() => {
        const from = (modalHistoryPage - 1) * modalHistoryPageSize;
        return modalUserPayments.slice(from, from + modalHistoryPageSize);
    }, [modalUserPayments, modalHistoryPage, modalHistoryPageSize]);

    const filteredPayments = useMemo(() => {
        let list = payments;
        if (historyFilterPosUserId) {
            list = list.filter((p) => getPosUserIdFromPayment(p) === historyFilterPosUserId);
        }
        const q = historySearch.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (p) =>
                    getPosUserName(p).toLowerCase().includes(q) ||
                    (p.paymentMethod || '').toLowerCase().includes(q) ||
                    (p.remarks || '').toLowerCase().includes(q) ||
                    (p.referenceNumber || '').toLowerCase().includes(q) ||
                    (String(p.amount) || '').includes(q) ||
                    (p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [payments, historyFilterPosUserId, historySearch]);

    const sortedPayments = useMemo(() => {
        const sorted = [...filteredPayments];
        const col = historySort.columnAccessor as keyof PaymentRow;
        const dir = historySort.direction === 'asc' ? 1 : -1;
        sorted.sort((a, b) => {
            let va: string | number | undefined = a[col];
            let vb: string | number | undefined = b[col];
            if (col === 'paymentDate') {
                va = new Date(a.paymentDate).getTime();
                vb = new Date(b.paymentDate).getTime();
            }
            if (col === 'amount') {
                va = Number(a.amount) || 0;
                vb = Number(b.amount) || 0;
            }
            if (va === vb) return 0;
            if (va == null) return dir;
            if (vb == null) return -dir;
            return (va < vb ? -1 : 1) * dir;
        });
        return sorted;
    }, [filteredPayments, historySort]);

    const historyTotal = sortedPayments.length;
    const historyFrom = (historyPage - 1) * historyPageSize;
    const historyRecords = sortedPayments.slice(historyFrom, historyFrom + historyPageSize);

    const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

    const outstandingColumns: DataTableColumn<OutstandingRow>[] = [
        { accessor: 'posUserName', title: t('pos_user'), render: (r) => <span className="font-medium text-gray-900 dark:text-white">{r.posUserName}</span> },
        { accessor: 'posShopName', title: t('shop_name'), render: (r) => <span className="text-gray-600 dark:text-gray-400">{r.posShopName}</span> },
        { accessor: 'totalOwed', title: t('total_owed'), render: (r) => <span className="text-right block">Rs {(r.totalOwed ?? 0).toLocaleString()}</span> },
        { accessor: 'paid', title: t('paid'), render: (r) => <span className="text-emerald-600 dark:text-emerald-400 text-right block">Rs {(r.paid ?? 0).toLocaleString()}</span> },
        { accessor: 'outstanding', title: t('to_pay'), render: (r) => <span className="font-semibold text-amber-600 dark:text-amber-400 text-right block">Rs {(r.outstanding ?? 0).toLocaleString()}</span> },
        {
            accessor: 'actions',
            title: t('actions'),
            width: 160,
            render: (r) => (
                <button
                    type="button"
                    onClick={() => openPayModal(r)}
                    className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3 rounded-lg transition-colors"
                >
                    {t('pay_to_pos_user')}
                </button>
            ),
        },
    ];

    const historyColumns: DataTableColumn<PaymentRow>[] = [
        { accessor: 'posUserId', title: t('pos_user'), sortable: false, render: (p) => getPosUserName(p) },
        { accessor: 'amount', title: t('amount'), sortable: true, render: (p) => <span className="font-medium text-emerald-600 dark:text-emerald-400 text-right block">Rs {(Number(p.amount) || 0).toLocaleString()}</span> },
        { accessor: 'paymentMethod', title: t('method'), sortable: true, render: (p) => (p.paymentMethod || '—') },
        { accessor: 'paymentDate', title: t('date'), sortable: true, render: (p) => formatDate(p.paymentDate) },
        { accessor: 'referenceNumber', title: t('payment_reference_label'), render: (p) => <span className="text-gray-500 dark:text-gray-400">{p.referenceNumber || '—'}</span> },
        { accessor: 'remarks', title: t('remarks'), render: (p) => <span className="text-gray-500 dark:text-gray-400">{p.remarks || '—'}</span> },
    ];

    const uniquePosUsersForFilter = useMemo(() => {
        const ids = new Set<string>();
        payments.forEach((p) => {
            const id = getPosUserIdFromPayment(p);
            if (id) ids.add(id);
        });
        return Array.from(ids).map((id) => {
            const name = outstanding.find((o) => o.posUserId === id)?.posUserName || getPosUserName(payments.find((p) => getPosUserIdFromPayment(p) === id)!);
            return { id, name };
        });
    }, [payments, outstanding]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <ul className="flex flex-wrap items-center gap-2 text-sm">
                    <li><Link to="/dashboard" className="text-primary hover:underline">{t('dashboard')}</Link></li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link to="/pos-shop-management" className="text-primary hover:underline">{t('pos_shop_management')}</Link></li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-500 dark:text-gray-400">{t('pos_payments_title')}</li>
                </ul>

                <Link
                    to="/pos-shop-management"
                            className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                >
                    <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    {t('back_to_pos_shop_management')}
                </Link>
            </div>

            {loading ? (
                <div className="panel rounded-2xl bg-white dark:bg-[#0e1726] border border-gray-300 dark:border-white/10 shadow-md p-12 flex justify-center">
                    <span className="animate-spin inline-block w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full" />
                </div>
            ) : (
                <>
                    {/* Connected POS users – total to pay & action */}
                    <div className="panel bg-white dark:bg-[#0e1726] p-5 sm:p-6 rounded-2xl border border-gray-300 dark:border-white/10 shadow-md">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 shadow-lg shadow-gray-600/40 w-9 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 shrink-0">
                                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 3v-2a4 4 0 00-3-3.87M7 10a4 4 0 108 0 4 4 0 00-8 0z" />
                                    </svg>
                                </span>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('connected_pos_users')}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('connected_total_to_pay', { count: outstanding.length })}</p>
                                </div>
                            </div>
                            {outstanding.length > 0 && (
                                <button type="button" onClick={downloadOutstandingCsv} className="btn btn-outline-primary text-xs py-1.5 px-3 rounded-lg shrink-0">
                                    {t('export_outstanding_csv')}
                                </button>
                            )}
                        </div>
                        {outstanding.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-10">
                                <span className="text-3xl">💳</span>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_connected_pos_balance')}</p>
                            </div>
                        ) : (
                            <div className="rounded-xl overflow-hidden border border-gray-300 dark:border-white/5 shadow-sm">
                                <DataTable
                                    striped
                                    highlightOnHover
                                    records={outstanding}
                                    columns={outstandingColumns}
                                    totalRecords={outstanding.length}
                                    recordsPerPage={outstandingPageSize}
                                    page={outstandingPage}
                                    onPageChange={setOutstandingPage}
                                    recordsPerPageOptions={PAGE_SIZES}
                                    onRecordsPerPageChange={(size) => { setOutstandingPageSize(size); setOutstandingPage(1); }}
                                    minHeight={180}
                                    paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords}`}
                                    noRecordsText={t('no_connected_pos_users')}
                                />
                            </div>
                        )}
                    </div>

                    {/* Payment history (all) */}
                    <div className="panel bg-white dark:bg-[#0e1726] p-5 sm:p-6 rounded-2xl border border-gray-300 dark:border-white/10 shadow-md">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                            <div className="flex items-center gap-3">
                                <span className="flex shadow-lg shadow-gray-600/40 h-9 w-9 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 shrink-0">
                                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </span>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('payment_history')}</h2>
                            </div>
                            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                                <div className="relative flex-1 min-w-[200px]">
                                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={historySearch}
                                        onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                                        placeholder={t('search_placeholder')}
                                        className="form-input w-full pl-10 rounded-lg"
                                    />
                                </div>
                                <select
                                    value={historyFilterPosUserId}
                                    onChange={(e) => { setHistoryFilterPosUserId(e.target.value); setHistoryPage(1); }}
                                    className="form-select rounded-lg w-full sm:w-auto sm:min-w-[180px]"
                                >
                                    <option value="">{t('all_pos_users')}</option>
                                    {uniquePosUsersForFilter.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {totalPaidToPosUser && (
                            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                    {t('total_paid_to')} <strong>{totalPaidToPosUser.name}</strong>: <strong>Rs {totalPaidToPosUser.total.toLocaleString()}</strong>
                                </p>
                            </div>
                        )}
                        {payments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-10">
                                <span className="text-3xl">🧾</span>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_payments_yet')}</p>
                            </div>
                        ) : (
                            <div className="rounded-xl overflow-hidden border border-gray-300 dark:border-white/5 shadow-sm">
                                <DataTable
                                    striped
                                    highlightOnHover
                                    records={historyRecords}
                                    columns={historyColumns}
                                    totalRecords={historyTotal}
                                    recordsPerPage={historyPageSize}
                                    page={historyPage}
                                    onPageChange={setHistoryPage}
                                    recordsPerPageOptions={PAGE_SIZES}
                                    onRecordsPerPageChange={(size) => { setHistoryPageSize(size); setHistoryPage(1); }}
                                    sortStatus={historySort}
                                    onSortStatusChange={setHistorySort}
                                    minHeight={200}
                                    paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords}`}
                                    noRecordsText={historySearch || historyFilterPosUserId ? t('no_matching_payments') : t('no_payments_yet_alt')}
                                />
                            </div>
                        )}
                    </div>

                    {/* Pay to POS user modal – form + history */}
                    {payModalOpen && payModalRow && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]" onClick={() => !paying && setPayModalOpen(false)}>
                            <div className="bg-white dark:bg-[#0e1726] rounded-2xl shadow-2xl border border-gray-300 dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                                <div className="p-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('pay_to_pos_user_modal', { name: payModalRow.posUserName })}</h3>
                                    <button type="button" onClick={() => !paying && setPayModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors">×</button>
                                </div>
                                <div className="p-5 overflow-y-auto flex-1 space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm shadow-sm">
                                        <p className="text-gray-600 dark:text-gray-400">{t('outstanding_to_pay')} <span className="font-semibold text-amber-600 dark:text-amber-400">Rs {(payModalRow.outstanding ?? 0).toLocaleString()}</span></p>
                                        <p className="text-gray-600 dark:text-gray-400">{t('total_paid_so_far')} <span className="font-semibold text-emerald-600 dark:text-emerald-400">Rs {modalUserPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0).toLocaleString()}</span></p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3">{t('record_payment')}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('amount_rs')}</label>
                                                <input type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} className="form-input w-full rounded-lg" placeholder="0.00" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payment_method')}</label>
                                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="form-select w-full rounded-lg">
                                                    <option value="cash">{t('cash')}</option>
                                                    <option value="bank">{t('bank')}</option>
                                                    <option value="other">{t('other')}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payment_reference_label')}</label>
                                                <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="form-input w-full rounded-lg" placeholder="—" maxLength={120} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('remarks_optional')}</label>
                                                <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="form-input w-full rounded-lg" placeholder={t('remarks_placeholder_cheque')} />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRecordPayment}
                                            disabled={paying || !(Number(amount) > 0)}
                                            className="btn bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg mt-4 px-5 py-2.5 disabled:opacity-50 transition-colors"
                                        >
                                            {paying ? t('saving') : t('record_payment_btn')}
                                        </button>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3">{t('payment_history_this_user')}</h4>
                                        {modalUserPayments.length === 0 ? (
                                            <p className="text-gray-500 dark:text-gray-400 text-sm py-3">{t('no_payments_to_this_user')}</p>
                                        ) : (
                                            <>
                                                <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-white/10 shadow-sm">
                                                    <table className="table-auto w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-300 dark:border-white/10">
                                                                <th className="text-left py-2 px-3 font-semibold">{t('amount')}</th>
                                                                <th className="text-left py-2 px-3 font-semibold">{t('method')}</th>
                                                                <th className="text-left py-2 px-3 font-semibold">{t('date')}</th>
                                                                <th className="text-left py-2 px-3 font-semibold">{t('payment_reference_label')}</th>
                                                                <th className="text-left py-2 px-3 font-semibold">{t('remarks')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {modalUserPaymentsPaged.map((p) => (
                                                                <tr key={p._id} className="border-b border-gray-200 dark:border-white/5">
                                                                    <td className="py-2 px-3 font-medium text-emerald-600 dark:text-emerald-400">Rs {(Number(p.amount) || 0).toLocaleString()}</td>
                                                                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{p.paymentMethod || '—'}</td>
                                                                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{formatDate(p.paymentDate)}</td>
                                                                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{p.referenceNumber || '—'}</td>
                                                                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{p.remarks || '—'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {t('showing_x_to_y_of_z', { from: (modalHistoryPage - 1) * modalHistoryPageSize + 1, to: Math.min(modalHistoryPage * modalHistoryPageSize, modalUserPayments.length), total: modalUserPayments.length })}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setModalHistoryPage((p) => Math.max(1, p - 1))}
                                                            disabled={modalHistoryPage <= 1}
                                                            className="btn btn-outline-secondary text-xs py-1 px-2 rounded disabled:opacity-50"
                                                        >
                                                            {t('previous')}
                                                        </button>
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">{t('page_num', { num: modalHistoryPage })}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setModalHistoryPage((p) => p + 1)}
                                                            disabled={modalHistoryPage * modalHistoryPageSize >= modalUserPayments.length}
                                                            className="btn btn-outline-secondary text-xs py-1 px-2 rounded disabled:opacity-50"
                                                        >
                                                            {t('next')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 border-t border-gray-200 dark:border-white/10 shrink-0">
                                    <button type="button" onClick={() => !paying && setPayModalOpen(false)} className="btn btn-outline-secondary rounded-lg px-4 py-2">
                                        {t('close')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PosPayments;
