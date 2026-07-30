import { useEffect, useState } from 'react';
import { Modal } from '@mantine/core';
import { DataTable, DataTableColumn } from 'mantine-datatable';
import axios from 'axios';
import { useNavigate, useSearchParams } from "react-router-dom";
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { Notification } from './../../helperComponents/Notification';
import { useShopId } from "./../../Hooks/useShopId";
import { useAuthToken } from './../../Hooks/useAuthToken';
import { useTranslation } from 'react-i18next';
import IconCashBanknotes from '../../components/Icon/IconCashBanknotes';
import IconClock from '../../components/Icon/IconClock';
import IconDollarSign from '../../components/Icon/IconDollarSign';
import IconArrowBackward from '../../components/Icon/IconArrowBackward';
import { FaSearch } from 'react-icons/fa';

interface BalanceRecord {
    _id: string;
    shopId: string;
    blance: number;
    cusBlane: number;
    cusId: {
        _id: string;
        shopId: string;
        cusNameF: string;
        cusNameL: string;
        cusNumber: string;
        cusCNIC: string;
        cusAddress: string;
    };
}

interface PaymentHistoryItem {
    _id: string;
    shopId: string;
    cusId: { _id: string; cusNameF: string; cusNameL: string; cusNumber?: string; cusCNIC?: string } | string;
    amount: number;
    remarks: string;
    createdAt: string;
}

interface ReturnHistoryItem {
    _id: string;
    amount: number;
    remarks: string;
    createdAt: string;
}

const PAGE_SIZES = [9, 18, 27, 54];

const CustomerBalance = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlCustomerId = searchParams.get('customerId') || '';
    const urlShopId = searchParams.get('shopId') || '';
    const { token } = useAuthToken();
    const { shopId: hookShopId } = useShopId();
    const shopId = urlShopId || hookShopId || null;
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<BalanceRecord[]>([]);
    const [recordsData, setRecordsData] = useState<BalanceRecord[]>([]);
    const [search, setSearch] = useState('');

    const [payModalOpen, setPayModalOpen] = useState(false);
    const [selectedPayRecord, setSelectedPayRecord] = useState<BalanceRecord | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payRemarks, setPayRemarks] = useState('');
    const [paySubmitting, setPaySubmitting] = useState(false);

    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<BalanceRecord | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPageSize, setHistoryPageSize] = useState(10);
    const [historyTotal, setHistoryTotal] = useState(0);

    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [selectedReturnRecord, setSelectedReturnRecord] = useState<BalanceRecord | null>(null);
    const [returnAmount, setReturnAmount] = useState('');
    const [returnRemarks, setReturnRemarks] = useState('');
    const [confirmCustomerPaidOwner, setConfirmCustomerPaidOwner] = useState(false);
    const [returnSubmitting, setReturnSubmitting] = useState(false);

    const [returnHistoryModalOpen, setReturnHistoryModalOpen] = useState(false);
    const [selectedReturnHistoryRecord, setSelectedReturnHistoryRecord] = useState<BalanceRecord | null>(null);
    const [returnHistory, setReturnHistory] = useState<ReturnHistoryItem[]>([]);
    const [returnHistoryLoading, setReturnHistoryLoading] = useState(false);
    const [returnHistoryPage, setReturnHistoryPage] = useState(1);
    const [returnHistoryPageSize, setReturnHistoryPageSize] = useState(10);
    const [returnHistoryTotal, setReturnHistoryTotal] = useState(0);

    const [returnAmountTotal, setReturnAmountTotal] = useState<number | null>(null);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        if (shopId && token) {
            fetchCustomerBalance();
            fetchReturnAmountTotal();
        } else {
            setInitialRecords([]);
            setReturnAmountTotal(null);
        }
    }, [shopId, token, urlCustomerId]);

    const fetchCustomerBalance = async () => {
        if (!shopId || !token) return;
        setIsLoading(true);
        try {
            const body: { shopId: string; cusId?: string } = { shopId: String(shopId) };
            if (urlCustomerId) body.cusId = urlCustomerId;
            const response = await axios.post(`${ServerSetting.serUrl}/api/getblance`, body, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { data } = response;
            if (data.success) setInitialRecords(Array.isArray(data.data) ? data.data : []);
            else Notification({ text: data.message || t('failed_fetch_data_balance'), color: 'danger' });
        } catch (error) {
            console.error('API error:', error);
            Notification({ text: t('error_fetching_balance'), color: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchReturnAmountTotal = async () => {
        if (!shopId || !token) return;
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/returnamounttotal`,
                { shopId: String(shopId) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { data } = response;
            if (data.success && typeof data.total === 'number') setReturnAmountTotal(data.total);
            else setReturnAmountTotal(null);
        } catch {
            setReturnAmountTotal(null);
        }
    };

    // Filtered records
    const filteredAll = initialRecords.filter((item) => {
        const { cusNameF, cusNameL, cusCNIC, cusNumber } = item.cusId || {};
        const lowerSearch = search.toLowerCase();
        return (
            cusNameF?.toLowerCase().includes(lowerSearch) ||
            cusNameL?.toLowerCase().includes(lowerSearch) ||
            cusCNIC?.toLowerCase().includes(lowerSearch) ||
            cusNumber?.toLowerCase().includes(lowerSearch)
        );
    });

    useEffect(() => {
        const sorted = [...filteredAll].sort((a, b) =>
            (a.cusId?.cusNameF?.toLowerCase() || '').localeCompare(b.cusId?.cusNameF?.toLowerCase() || '')
        );
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sorted.slice(from, to));
    }, [search, initialRecords, page, pageSize]);

    const totalFiltered = filteredAll.length;

    const openPayModal = (record: BalanceRecord) => {
        setSelectedPayRecord(record);
        setPayAmount('');
        setPayRemarks('');
        setPayModalOpen(true);
    };

    const closePayModal = () => {
        setPayModalOpen(false);
        setSelectedPayRecord(null);
        setPayAmount('');
        setPayRemarks('');
    };

    const getCusId = (r: BalanceRecord) => {
        const c = r.cusId;
        const id = (typeof c === 'object' && c && '_id' in c) ? (c as { _id: string })._id : (c as unknown as string);
        return id != null ? String(id) : '';
    };

    const handleRecordPayment = async () => {
        if (!selectedPayRecord || !shopId) return;
        const cusId = getCusId(selectedPayRecord);
        if (!cusId) {
            Notification({ text: t('customer_id_not_found'), color: 'danger' });
            return;
        }
        const amt = Math.max(0, Number(payAmount) || 0);
        if (amt <= 0) {
            Notification({ text: t('enter_valid_amount'), color: 'danger' });
            return;
        }
        const cusBlane = Number(selectedPayRecord.cusBlane) || 0;
        if (amt > cusBlane) {
            Notification({ text: `Amount cannot exceed customer balance (Rs. ${cusBlane.toLocaleString()}).`, color: 'danger' });
            return;
        }
        setPaySubmitting(true);
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/recordbalancepayment`,
                { shopId: String(shopId), cusId, amount: amt, remarks: payRemarks.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { data } = response;
            if (data.success) {
                Notification({ text: data.message || t('payment_recorded_balance_updated'), color: 'success' });
                fetchCustomerBalance();
                closePayModal();
            } else {
                Notification({ text: data.message || t('failed_record_payment'), color: 'danger' });
            }
        } catch (error: any) {
            console.error('Record payment error:', error);
            Notification({
                text: error.response?.data?.message || t('error_recording_payment'),
                color: 'danger',
            });
        } finally {
            setPaySubmitting(false);
        }
    };

    const fetchPaymentHistory = async (record: BalanceRecord, page: number, limit: number) => {
        const cusId = getCusId(record);
        if (!shopId || !cusId) return;
        setHistoryLoading(true);
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/balancepaymenthistory`,
                { shopId: String(shopId), cusId, page, limit },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { data } = response;
            if (data.success) {
                const list = Array.isArray(data.data) ? data.data : [];
                setPaymentHistory(list);
                const p = data.pagination || {};
                const tot = Number(p.total);
                setHistoryTotal(!isNaN(tot) && tot >= 0 ? tot : list.length);
            } else {
                Notification({ text: data.message || 'Failed to fetch history.', color: 'danger' });
            }
        } catch (error) {
            console.error('History fetch error:', error);
            Notification({ text: 'Error fetching payment history.', color: 'danger' });
        } finally {
            setHistoryLoading(false);
        }
    };

    const openHistoryModal = async (record: BalanceRecord) => {
        setSelectedHistoryRecord(record);
        setHistoryModalOpen(true);
        setHistoryPage(1);
        setHistoryPageSize(10);
        setHistoryTotal(0);
        setPaymentHistory([]);
        await fetchPaymentHistory(record, 1, 10);
    };

    const closeHistoryModal = () => {
        setHistoryModalOpen(false);
        setSelectedHistoryRecord(null);
        setPaymentHistory([]);
        setHistoryPage(1);
        setHistoryPageSize(10);
        setHistoryTotal(0);
    };

    const openReturnModal = (record: BalanceRecord) => {
        setSelectedReturnRecord(record);
        setReturnAmount('');
        setReturnRemarks('');
        setConfirmCustomerPaidOwner(false);
        setReturnModalOpen(true);
    };

    const closeReturnModal = () => {
        setReturnModalOpen(false);
        setSelectedReturnRecord(null);
        setReturnAmount('');
        setReturnRemarks('');
        setConfirmCustomerPaidOwner(false);
    };

    const handleRecordReturn = async () => {
        if (!selectedReturnRecord || !shopId) return;
        const cusId = getCusId(selectedReturnRecord);
        if (!cusId) {
            Notification({ text: t('customer_id_not_found'), color: 'danger' });
            return;
        }
        const amt = Math.max(0, Number(returnAmount) || 0);
        if (amt <= 0) {
            Notification({ text: t('enter_valid_amount'), color: 'danger' });
            return;
        }
        const blance = Number(selectedReturnRecord.blance) || 0;
        if (amt > blance) {
            Notification({ text: `Amount cannot exceed customer owes (Rs. ${blance.toLocaleString()}).`, color: 'danger' });
            return;
        }
        setReturnSubmitting(true);
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/recordreturnamount`,
                { shopId: String(shopId), cusId, amount: amt, remarks: returnRemarks.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { data } = response;
            if (data.success) {
                Notification({ text: data.message || 'Return amount recorded. Balance updated.', color: 'success' });
                fetchCustomerBalance();
                fetchReturnAmountTotal();
                closeReturnModal();
            } else {
                Notification({ text: data.message || 'Failed to record return amount.', color: 'danger' });
            }
        } catch (error: any) {
            console.error('Record return error:', error);
            Notification({
                text: error.response?.data?.message || 'Error recording return amount.',
                color: 'danger',
            });
        } finally {
            setReturnSubmitting(false);
        }
    };

    const fetchReturnHistory = async (record: BalanceRecord, page: number, limit: number) => {
        const cusId = getCusId(record);
        if (!shopId || !cusId) return;
        setReturnHistoryLoading(true);
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/returnamounthistory`,
                { shopId: String(shopId), cusId, page, limit },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { data } = response;
            if (data.success) {
                const list = Array.isArray(data.data) ? data.data : [];
                setReturnHistory(list);
                const p = data.pagination || {};
                const tot = Number(p.total);
                setReturnHistoryTotal(!isNaN(tot) && tot >= 0 ? tot : list.length);
            } else {
                Notification({ text: data.message || 'Failed to fetch return history.', color: 'danger' });
            }
        } catch (error) {
            console.error('Return history fetch error:', error);
            Notification({ text: 'Error fetching return history.', color: 'danger' });
        } finally {
            setReturnHistoryLoading(false);
        }
    };

    const openReturnHistoryModal = async (record: BalanceRecord) => {
        setSelectedReturnHistoryRecord(record);
        setReturnHistoryModalOpen(true);
        setReturnHistoryPage(1);
        setReturnHistoryPageSize(10);
        setReturnHistoryTotal(0);
        setReturnHistory([]);
        await fetchReturnHistory(record, 1, 10);
    };

    const closeReturnHistoryModal = () => {
        setReturnHistoryModalOpen(false);
        setSelectedReturnHistoryRecord(null);
        setReturnHistory([]);
        setReturnHistoryPage(1);
        setReturnHistoryPageSize(10);
        setReturnHistoryTotal(0);
    };

    const addCustomer = () => navigate('/addnewcustomer');

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
        } catch {
            return dateStr;
        }
    };

    // Totals from balance records (sum of all customers)
    const totalShopOwesToCustomer = initialRecords.reduce((sum, r) => sum + (Number(r.cusBlane) || 0), 0);
    const totalCustomerOwesToShop = initialRecords.reduce((sum, r) => sum + (Number(r.blance) || 0), 0);
    const returnAmountTotalDisplay = returnAmountTotal ?? 0;

    const columns: DataTableColumn<BalanceRecord>[] = [
        {
            accessor: 'cusId.cusNameF',
            title: t('customer') || 'Customer',
            render: (record) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                            {record.cusId?.cusNameF?.[0]?.toUpperCase() || 'C'}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {record.cusId?.cusNameF} {record.cusId?.cusNameL}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                            {record.cusId?.cusCNIC || 'N/A'} · {record.cusId?.cusNumber || 'N/A'}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            accessor: 'cusId.cusAddress',
            title: t('address') || 'Address',
            render: (record) => (
                <span className="text-gray-600 dark:text-gray-400 truncate block max-w-[200px]" title={record.cusId?.cusAddress}>
                    {record.cusId?.cusAddress || 'N/A'}
                </span>
            ),
        },
        {
            accessor: 'cusBlane',
            title: t('shop_owes_to_customer'),
            render: (record) => (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Rs. {(record.cusBlane ?? 0).toLocaleString()}
                </span>
            ),
        },
        {
            accessor: 'blance',
            title: t('customer_owes_to_shop'),
            render: (record) => (
                <span className="font-semibold text-sky-600 dark:text-sky-400">
                    Rs. {(record.blance ?? 0).toLocaleString()}
                </span>
            ),
        },
        {
            accessor: 'actions',
            title: t('actions') || 'Actions',
            width: 260,
            render: (record) => (
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => openPayModal(record)}
                        disabled={(record.cusBlane ?? 0) <= 0}
                        title={t('pay_customer_deduct')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <IconDollarSign className="w-3.5 h-3.5" /> Pay
                    </button>
                    <button
                        type="button"
                        onClick={() => openHistoryModal(record)}
                        title={t('payment_history_title')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs hover:bg-gray-200 dark:hover:bg-white/10 transition"
                    >
                        <IconClock className="w-3.5 h-3.5" /> History
                    </button>
                    <button
                        type="button"
                        onClick={() => (record.blance ?? 0) > 0 && openReturnModal(record)}
                        disabled={(record.blance ?? 0) <= 0}
                        title={(record.blance ?? 0) <= 0
                            ? 'Return disabled – Customer owes nothing.'
                            : 'Record when customer has paid shop owner'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs hover:bg-amber-100 dark:hover:bg-amber-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <IconArrowBackward className="w-3.5 h-3.5" /> Return
                    </button>
                    <button
                        type="button"
                        onClick={() => openReturnHistoryModal(record)}
                        title={t('return_amount_history_title')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs hover:bg-gray-200 dark:hover:bg-white/10 transition"
                    >
                        <IconClock className="w-3.5 h-3.5" /> Ret. Hist.
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <div className='mb-3'>
                <button
                    onClick={() => navigate('/customerlist')}
                    className="flex justify-right items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition whitespace-nowrap"
                >
                    ← {t('back_to_customer_list')}
                </button>
            </div>

{/* Summary Cards */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 shadow-sm p-5">
        <p className="text-sm font-medium text-black dark:text-white mb-1">{t('shop_owes_to_customer')}</p>
        <p className="text-2xl font-bold text-black dark:text-white">
            Rs. {totalShopOwesToCustomer.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-black/70 dark:text-white/80 mt-1">{t('total_shop_pay_customers')}</p>
    </div>
    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 shadow-sm p-5">
        <p className="text-sm font-medium text-black dark:text-white mb-1">{t('customer_owes_to_shop')}</p>
        <p className="text-2xl font-bold text-black dark:text-white">
            Rs. {totalCustomerOwesToShop.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-black/70 dark:text-white/80 mt-1">{t('total_customers_owe_shop')}</p>
    </div>
    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 shadow-sm p-5">
        <p className="text-sm font-medium text-black dark:text-white mb-1">{t('return_amount_total_label')}</p>
        <p className="text-2xl font-bold text-black dark:text-white">
            Rs. {returnAmountTotalDisplay.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-black/70 dark:text-white/80 mt-1">{t('return_amount_total_desc')}</p>
    </div>
</div>

            {/* Main Card */}
            <div className="rounded-xl bg-white dark:bg-[#0e1726] border border-gray-300 dark:border-white/10 shadow-sm p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3 mb-4">
                    <h3 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {t('customer_balance_title') || 'Customer Balance'}
                    </h3>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <FaSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder={t('search_by_name_cnic_phone_balance')}
                                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-[#171f2f] border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            />
                        </div>

                        <button
                            onClick={addCustomer}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition whitespace-nowrap"
                        >
                            {t('add_new_customer')}
                        </button>
                    </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-500 mb-5">{t('return_hint_para')}</p>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <span className="animate-[spin_1s_linear_infinite] border-4 border-gray-200 dark:border-white/10 border-t-emerald-500 rounded-full w-10 h-10 inline-block"></span>
                    </div>
                ) : (
                    <div className="rounded-xl overflow-hidden border border-gray-300 dark:border-white/5">
                        <DataTable
                            striped
                            highlightOnHover
                            records={recordsData}
                            columns={columns}
                            totalRecords={totalFiltered}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={(size) => { setPageSize(size); setPage(1); }}
                            minHeight={240}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords}`}
                            noRecordsText={t('no_data_found') || 'No balance records found.'}
                            classNames={{
                                root: 'dark:bg-[#0e1726]',
                                header: 'dark:bg-[#0e1726]',
                                footer: 'bg-white text-black dark:bg-[#0e1726] dark:text-gray-300 border-t border-gray-300 dark:border-white/10',
                                pagination: 'bg-white text-black dark:bg-[#0e1726] dark:text-gray-300',
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Pay Modal */}
            <Modal
                opened={payModalOpen}
                onClose={closePayModal}
                title={
                    <div className="flex items-center gap-2">
                        <IconCashBanknotes className="w-5 h-5 text-emerald-500" />
                        <span className="text-lg font-semibold">Record Payment to Customer</span>
                        {selectedPayRecord?.cusId && (
                            <span className="text-sm font-normal text-gray-500">
                                – {selectedPayRecord.cusId.cusNameF} {selectedPayRecord.cusId.cusNameL}
                            </span>
                        )}
                    </div>
                }
                size="md"
                centered
            >
                <div className="space-y-4 pt-2">
                    {selectedPayRecord && (
                        <>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Current balance (Shop owes): <strong className="text-emerald-600 dark:text-emerald-400">Rs. {(selectedPayRecord.cusBlane ?? 0).toLocaleString()}</strong>
                            </p>
                            <div>
                                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Amount (Rs.) *</label>
                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#171f2f] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                    placeholder="Enter amount"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Remarks</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#171f2f] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                                    placeholder="Optional notes (e.g. cash paid, cheque #, purpose)"
                                    value={payRemarks}
                                    onChange={(e) => setPayRemarks(e.target.value)}
                                    rows={4}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={closePayModal} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition">
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRecordPayment}
                                    disabled={paySubmitting || !payAmount || Number(payAmount) <= 0}
                                    className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition disabled:opacity-50"
                                >
                                    {paySubmitting ? t('saving') : t('record_payment_btn_balance')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* History Modal */}
            <Modal
                opened={historyModalOpen}
                onClose={closeHistoryModal}
                title={
                    <div className="flex items-center gap-2">
                        <IconClock className="w-5 h-5 text-emerald-500" />
                        <span className="text-lg font-semibold">Payment History</span>
                        {selectedHistoryRecord?.cusId && typeof selectedHistoryRecord.cusId === 'object' && (
                            <span className="text-sm font-normal text-gray-500">
                                – {selectedHistoryRecord.cusId.cusNameF} {selectedHistoryRecord.cusId.cusNameL}
                            </span>
                        )}
                    </div>
                }
                size="lg"
                centered
            >
                <div className="pt-2">
                    {historyLoading ? (
                        <div className="flex justify-center py-8">
                            <span className="animate-[spin_1s_linear_infinite] border-4 border-gray-200 dark:border-white/10 border-t-emerald-500 rounded-full w-8 h-8 inline-block" />
                        </div>
                    ) : paymentHistory.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No payments recorded yet.</p>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {paymentHistory.map((item) => (
                                <div key={item._id} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-[#171f2f] border border-gray-200 dark:border-white/10 p-3">
                                    <div>
                                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">Rs. {(item.amount ?? 0).toLocaleString()}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-500">{item.remarks || '–'}</div>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 text-right">{formatDate(item.createdAt)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end mt-4">
                        <button type="button" onClick={closeHistoryModal} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition">
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Return Amount Modal */}
            <Modal
                opened={returnModalOpen}
                onClose={closeReturnModal}
                title={
                    <div className="flex items-center gap-2">
                        <IconArrowBackward className="w-5 h-5 text-amber-500" />
                        <span className="text-lg font-semibold">Return Loan Amount</span>
                        {selectedReturnRecord?.cusId && typeof selectedReturnRecord.cusId === 'object' && (
                            <span className="text-sm font-normal text-gray-500">
                                – {selectedReturnRecord.cusId.cusNameF} {selectedReturnRecord.cusId.cusNameL}
                            </span>
                        )}
                    </div>
                }
                size="md"
                centered
            >
                <div className="space-y-4 pt-2">
                    {selectedReturnRecord && (
                        <>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Customer owes (blance): <strong className="text-amber-600 dark:text-amber-400">Rs. {(selectedReturnRecord.blance ?? 0).toLocaleString()}</strong>
                            </p>
                            <div>
                                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Amount (Rs.) *</label>
                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#171f2f] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                    placeholder="Enter amount customer returned"
                                    value={returnAmount}
                                    onChange={(e) => setReturnAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Remarks</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#171f2f] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
                                    placeholder="Optional notes (e.g. cash received, cheque #)"
                                    value={returnRemarks}
                                    onChange={(e) => setReturnRemarks(e.target.value)}
                                    rows={4}
                                />
                            </div>
                            <div className="flex items-start gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="confirmCustomerPaidOwner"
                                    checked={confirmCustomerPaidOwner}
                                    onChange={(e) => setConfirmCustomerPaidOwner(e.target.checked)}
                                    className="mt-1"
                                />
                                <label htmlFor="confirmCustomerPaidOwner" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                    Confirm: Customer ne shop owner ko yeh amount diya hai (I confirm customer has paid this amount to shop owner).
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={closeReturnModal} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition">
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRecordReturn}
                                    disabled={returnSubmitting || !returnAmount || Number(returnAmount) <= 0 || !confirmCustomerPaidOwner}
                                    className="px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition disabled:opacity-50"
                                >
                                    {returnSubmitting ? t('saving') : t('record_return_btn')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Return History Modal */}
            <Modal
                opened={returnHistoryModalOpen}
                onClose={closeReturnHistoryModal}
                title={
                    <div className="flex items-center gap-2">
                        <IconArrowBackward className="w-5 h-5 text-amber-500" />
                        <span className="text-lg font-semibold">Return Amount History</span>
                        {selectedReturnHistoryRecord?.cusId && typeof selectedReturnHistoryRecord.cusId === 'object' && (
                            <span className="text-sm font-normal text-gray-500">
                                – {selectedReturnHistoryRecord.cusId.cusNameF} {selectedReturnHistoryRecord.cusId.cusNameL}
                            </span>
                        )}
                    </div>
                }
                size="lg"
                centered
            >
                <div className="pt-2">
                    {returnHistoryLoading ? (
                        <div className="flex justify-center py-8">
                            <span className="animate-[spin_1s_linear_infinite] border-4 border-gray-200 dark:border-white/10 border-t-amber-500 rounded-full w-8 h-8 inline-block" />
                        </div>
                    ) : returnHistory.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No return amounts recorded yet.</p>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {returnHistory.map((item) => (
                                <div key={item._id} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-[#171f2f] border border-gray-200 dark:border-white/10 p-3">
                                    <div>
                                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">Rs. {(item.amount ?? 0).toLocaleString()}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-500">{item.remarks || '–'}</div>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 text-right">{formatDate(item.createdAt)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end mt-4">
                        <button type="button" onClick={closeReturnHistoryModal} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition">
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CustomerBalance;
