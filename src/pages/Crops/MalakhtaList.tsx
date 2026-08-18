import { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { useShopIdFromUrl } from '../../Hooks/useShopIdFromUrl';
import PageHeader from '../../components/Agricultural/PageHeader';
import TableCard from '../../components/Agricultural/TableCard';
import { Modal } from '@mantine/core';

const MalakhtaList = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { userId, cropId } = useParams<{ userId: string; cropId: string }>();
    const [searchParams] = useSearchParams();
    const { token } = useAuthToken();
    const { shopId: urlShopId } = useShopIdFromUrl();
    const [shopId, setShopId] = useState<string | null>(urlShopId || null);
    const [orders, setOrders] = useState<any[]>([]);
    const [paymentTotals, setPaymentTotals] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [payModal, setPayModal] = useState<{ order: any } | null>(null);
    const [historyModal, setHistoryModal] = useState<{ orderId: string; order: any } | null>(null);
    const [detailsModal, setDetailsModal] = useState<any | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payRemarks, setPayRemarks] = useState('');
    const [saving, setSaving] = useState(false);
    const [historyList, setHistoryList] = useState<any[]>([]);
    const [orderIdSearch, setOrderIdSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const PAGE_SIZES = [10, 20, 30, 50];

    useEffect(() => {
        dispatch(setPageTitle(t('malakhta')));
    }, [dispatch, t]);

    useEffect(() => {
        if (urlShopId) setShopId(urlShopId);
        else if (userId && token) {
            axios.get(`${ServerSetting.apiUrl}/getShopId/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => { if (r.data?.status === 200 && r.data?.data) setShopId(r.data.data._id || r.data.data); })
                .catch(() => {});
        }
    }, [urlShopId, userId, token]);

    useEffect(() => {
        if (!shopId || !cropId) return;
        setLoading(true);
        axios.get(`${ServerSetting.apiUrl}/viewallorderdanamandispecificshop/${shopId}/${cropId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
                const list = res.data?.status === 200 ? res.data.data || [] : [];
                const withMalakhta = list.filter((o: any) => o.malaKhataName && String(o.malaKhataName).trim());
                setOrders(withMalakhta);
            })
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));

        axios.post(`${ServerSetting.apiUrl}/crop/getMalakhtaPaymentTotals`, { shopId, cropId }, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => setPaymentTotals(r.data?.success ? r.data.data || {} : {}))
            .catch(() => {});
    }, [shopId, cropId, token]);

    const getOrderId = (o: any) => o._id || '';
    const getReceiptId = (o: any) => o.receiptId || o._id?.slice(-8) || '—';
    const getMalakhtaName = (o: any) => o.malaKhataName || '—';
    const getMalakhtaAmount = (o: any) => {
        const n = Number(o.malaKhataPayment) || Number(o.totalPrice);
        return isNaN(n) ? 0 : n;
    };
    const getTotalPrice = (o: any) => Number(o.totalPrice) || 0;

    const getPaidStatus = (order: any) => {
        const id = getOrderId(order);
        const expected = getMalakhtaAmount(order);
        const paid = paymentTotals[id] || 0;
        if (paid >= expected) return { text: t('paid'), color: 'success' };
        if (paid > 0) return { text: t('partial'), color: 'warning' };
        return { text: t('pending'), color: 'danger' };
    };

    const handleOpenHistory = (order: any) => {
        const orderId = getOrderId(order);
        setHistoryModal({ orderId, order });
        axios.post(`${ServerSetting.apiUrl}/crop/getMalakhtaPaymentsByOrder`, { orderId }, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => setHistoryList(r.data?.success ? r.data.data || [] : []))
            .catch(() => setHistoryList([]));
    };

    const handlePayMalakhta = () => {
        if (!payModal || !shopId || !cropId) return;
        const amt = Number(payAmount);
        if (!amt || amt <= 0) {
            Notification({ text: t('enter_valid_amount'), color: 'warning' });
            return;
        }
        const order = payModal.order;
        setSaving(true);
        axios.post(
            `${ServerSetting.apiUrl}/crop/recordMalakhtaPayment`,
            {
                orderId: getOrderId(order),
                orderType: 'danaMandi',
                shopId,
                cropId,
                malaKhataName: String(order.malaKhataName || '').trim(),
                amount: amt,
                remarks: payRemarks.trim(),
            },
            { headers: { Authorization: `Bearer ${token}` } }
        )
            .then((r) => {
                if (r.data?.success) {
                    Notification({ text: t('payment_recorded'), color: 'success' });
                    setPayModal(null);
                    setPayAmount('');
                    setPayRemarks('');
                    axios.post(`${ServerSetting.apiUrl}/crop/getMalakhtaPaymentTotals`, { shopId, cropId }, { headers: { Authorization: `Bearer ${token}` } })
                        .then((tr) => setPaymentTotals(tr.data?.success ? tr.data.data || {} : {}));
                }
            })
            .catch((e) => Notification({ text: e.response?.data?.message || t('failed'), color: 'danger' }))
            .finally(() => setSaving(false));
    };

    const getRoute = (path: string) => (searchParams.get('shopId') ? `${path}?shopId=${searchParams.get('shopId')}` : path);

    const filteredOrders = useMemo(() => {
        const q = orderIdSearch.trim().toLowerCase();
        if (!q) return orders;
        return orders.filter((o) => {
            const rid = getReceiptId(o);
            const id = getOrderId(o);
            return (rid && String(rid).toLowerCase().includes(q)) || (id && String(id).toLowerCase().includes(q));
        });
    }, [orders, orderIdSearch]);

    const paginatedOrders = useMemo(() => {
        const from = (page - 1) * pageSize;
        return filteredOrders.slice(from, from + pageSize);
    }, [filteredOrders, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [orderIdSearch, pageSize]);

    const columns = useMemo(
        () => [
            { accessor: 'receiptId', title: t('order_id'), render: (order: any) => <span className="font-medium">{getReceiptId(order)}</span> },
            { accessor: 'malaKhataName', title: t('malakhta_name'), render: (order: any) => getMalakhtaName(order) },
            { accessor: 'totalPrice', title: t('order_amount'), render: (order: any) => `Rs. ${getTotalPrice(order).toLocaleString()}` },
            { accessor: 'malaKhataAmount', title: t('malakhta_amount'), render: (order: any) => `Rs. ${getMalakhtaAmount(order).toLocaleString()}` },
            {
                accessor: 'status',
                title: t('status'),
                render: (order: any) => {
                    const s = getPaidStatus(order);
                    return <span className={`badge bg-${s.color}`}>{s.text}</span>;
                },
            },
            {
                accessor: 'actions',
                title: t('actions'),
                render: (order: any) => (
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => { setPayModal({ order }); setPayAmount(''); setPayRemarks(''); }}>{t('pay_to_malakhta_owner')}</button>
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => handleOpenHistory(order)}>{t('history')}</button>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDetailsModal(order)}>{t('order_details')}</button>
                    </div>
                ),
            },
        ],
        [paymentTotals, t]
    );

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><Link to="/dashboard" className="text-primary hover:underline">{t('dashboard')}</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link to={getRoute('/getassginshopcrops')} className="text-primary hover:underline">{t('my_crops')}</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link to={getRoute(`/cropmenu/${userId}/${cropId}`)} className="text-primary hover:underline">{t('crop_management')}</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>{t('malakhta')}</span></li>
            </ul>

             <div className="flex justify-end mb-4">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                >
                    <span>←</span> {t('back')}
                </button>
            </div>

            <TableCard
                title={t('malakhta_orders')}
                description={t('order_count', { count: filteredOrders.length })}
                data={paginatedOrders}
                columns={columns}
                loading={loading}
                page={page}
                pageSize={pageSize}
                totalRecords={filteredOrders.length}
                onPageChange={setPage}
                onRecordsPerPageChange={(n) => { setPageSize(n); setPage(1); }}
                recordsPerPageOptions={PAGE_SIZES}
                searchValue={orderIdSearch}
                onSearchChange={setOrderIdSearch}
                searchPlaceholder={t('search_by_order_id_placeholder')}
                emptyMessage={t('no_malakhta_orders_found')}
                idAccessor="_id"
            />

            <Modal opened={!!payModal} onClose={() => setPayModal(null)} title={t('pay_to_malakhta_owner')} size="sm">
                {payModal && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">{t('amount_to_pay')}</p>
                        <input type="number" className="form-input" placeholder={t('amount')} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} min="1" />
                        <textarea className="form-textarea" placeholder={t('remarks')} value={payRemarks} onChange={(e) => setPayRemarks(e.target.value)} rows={2} />
                        <div className="flex justify-end gap-2">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setPayModal(null)}>{t('cancel')}</button>
                            <button type="button" className="btn btn-primary" onClick={handlePayMalakhta} disabled={saving}>{saving ? t('saving') : t('save')}</button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal opened={!!historyModal} onClose={() => setHistoryModal(null)} title={t('malakhta_payment_history')} size="lg">
                {historyModal && (() => {
                    const expectedAmount = getMalakhtaAmount(historyModal.order);
                    const totalPaid = historyList.reduce((sum: number, h: any) => sum + Number(h.amount || 0), 0);
                    const status = totalPaid >= expectedAmount ? { text: t('paid'), color: 'success' } : totalPaid > 0 ? { text: t('partial'), color: 'warning' } : { text: t('pending'), color: 'danger' };
                    return (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#191e3a] border border-[#ebedf2] dark:border-[#191e3a]">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('status')}</p>
                                        <p className="mt-0.5"><span className={`badge bg-${status.color} text-sm`}>{status.text}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('total_paid_to_malakhta')}</p>
                                        <p className="mt-0.5 text-lg font-semibold text-primary">Rs. {totalPaid.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('malakhta_amount')}</p>
                                        <p className="mt-0.5 text-gray-700 dark:text-gray-300">Rs. {expectedAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">{t('paid_out_of', { paid: `Rs. ${totalPaid.toLocaleString()}`, total: `Rs. ${expectedAmount.toLocaleString()}` })}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('payment_entries')}</p>
                                {historyList.length === 0 ? <p className="text-gray-500 py-2">{t('no_payments_recorded_yet')}</p> : (
                                    <div className="border border-[#ebedf2] dark:border-[#191e3a] rounded-lg overflow-hidden">
                                        <div className="table-responsive max-h-80 overflow-y-auto">
                                            <table className="table-auto w-full text-left">
                                                <thead className="bg-gray-100 dark:bg-[#0e1726] sticky top-0">
                                                    <tr>
                                                        <th className="py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('amount')}</th>
                                                        <th className="py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('date')}</th>
                                                        <th className="py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('remarks')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {historyList.map((h: any) => (
                                                        <tr key={h._id} className="border-t border-[#ebedf2] dark:border-[#191e3a] hover:bg-gray-50 dark:hover:bg-dark/30">
                                                            <td className="py-2.5 px-3 font-medium">Rs. {Number(h.amount).toLocaleString()}</td>
                                                            <td className="py-2.5 px-3 text-sm text-gray-600 dark:text-gray-400">{new Date(h.createdAt).toLocaleString()}</td>
                                                            <td className="py-2.5 px-3 text-sm text-gray-700 dark:text-gray-300">{h.remarks && String(h.remarks).trim() ? h.remarks : '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            <Modal opened={!!detailsModal} onClose={() => setDetailsModal(null)} title={t('order_details')} size="xl" classNames={{ content: 'max-w-3xl' }}>
                {detailsModal && (() => {
                    const o = detailsModal;
                    const cus = o.danaMandiOrderCusId;
                    const receiptId = o.receiptId || o._id?.slice(-8) || o._id || '—';
                    const orderTotal = Number(o.totalPrice) || 0;
                    const malakhtaAmt = Number(o.malaKhataPayment) || Number(o.totalPrice) || 0;
                    const rows: { label: string; value: string | number }[] = [
                        { label: t('malakhta_name'), value: o.malaKhataName || '—' },
                        { label: t('order_total_amount'), value: `Rs. ${orderTotal.toLocaleString()}` },
                        { label: t('malakhta_amount'), value: `Rs. ${malakhtaAmt.toLocaleString()}` },
                        { label: t('bapari_name'), value: cus ? `${cus.cusNameF || ''} ${cus.cusNameL || ''}`.trim() || '—' : '—' },
                        { label: t('price_per_unit'), value: `Rs. ${(Number(o.priceCrop) || 0).toLocaleString()}` },
                        { label: t('created_at'), value: o.createdAt ? new Date(o.createdAt).toLocaleString() : '—' },
                    ];
                    const extraKeys = Object.keys(o).filter((k) => !['_id', '__v', 'danaMandiOrderCusId', 'receiptId', 'totalPrice', 'priceCrop', 'malaKhataName', 'malaKhataPayment', 'createdAt'].includes(k));
                    extraKeys.forEach((k) => {
                        const v = o[k];
                        if (v == null || typeof v === 'object') return;
                        rows.push({ label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()), value: String(v) });
                    });
                    return (
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">{t('receipt_order_id')}</p>
                                    <p className="text-xl font-bold text-primary dark:text-primary">{receiptId}</p>
                                </div>
                                <div className="flex gap-6">
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">{t('order_total')}</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">Rs. {orderTotal.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">{t('malakhta_amount')}</p>
                                        <p className="text-lg font-bold text-primary">Rs. {malakhtaAmt.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {rows.map((r, i) => (
                                    <div key={i} className="flex flex-col p-3 rounded-lg bg-gray-50 dark:bg-[#191e3a]/50 border border-[#ebedf2] dark:border-white/5">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{r.label}</span>
                                        <span className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{r.value}</span>
                                    </div>
                                ))}
                            </div>
                            {cus && typeof cus === 'object' && (
                                <div className="rounded-xl border border-[#ebedf2] dark:border-white/10 overflow-hidden">
                                    <div className="px-4 py-2.5 bg-gray-100 dark:bg-[#0e1726] border-b border-[#ebedf2] dark:border-white/5">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('customer_details')}</p>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                        {Object.entries(cus)
                                            .filter(([k, v]) => !k.startsWith('_') && v != null && typeof v !== 'object')
                                            .map(([k, v]) => (
                                                <div key={k} className="flex justify-between sm:block gap-2 py-1.5">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{String(v)}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
};

export default MalakhtaList;
