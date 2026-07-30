import { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { useShopIdFromUrl } from '../../Hooks/useShopIdFromUrl';
import PageHeader from '../../components/Agricultural/PageHeader';
import { useTranslation } from 'react-i18next';
import TableCard from '../../components/Agricultural/TableCard';
import { Modal } from '@mantine/core';
import Swal from 'sweetalert2';

const BuyerList = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { userId, cropId } = useParams<{ userId: string; cropId: string }>();
    const [searchParams] = useSearchParams();
    const { token } = useAuthToken();
    const { shopId: urlShopId } = useShopIdFromUrl();
    const [shopId, setShopId] = useState<string | null>(urlShopId || null);
    const [orders, setOrders] = useState<any[]>([]);
    const [paymentTotals, setPaymentTotals] = useState<Record<string, number>>({});
    const [cropDetails, setCropDetails] = useState<any>(null);
    const [isSabziMandi, setIsSabziMandi] = useState(false);
    const [loading, setLoading] = useState(true);
    const [paymentModal, setPaymentModal] = useState<{ order: any; orderType: string } | null>(null);
    const [historyModal, setHistoryModal] = useState<{ orderId: string; order: any } | null>(null);
    const [detailsModal, setDetailsModal] = useState<any | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentRemarks, setPaymentRemarks] = useState('');
    const [saving, setSaving] = useState(false);
    const [historyList, setHistoryList] = useState<any[]>([]);
    const [orderIdSearch, setOrderIdSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const PAGE_SIZES = [10, 20, 30, 50];

    useEffect(() => {
        dispatch(setPageTitle('Buyer List'));
    }, [dispatch]);

    useEffect(() => {
        if (urlShopId) setShopId(urlShopId);
        else if (userId && token) {
            axios.get(`${ServerSetting.apiUrl}/getShopId/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => { if (r.data?.status === 200 && r.data?.data) setShopId(r.data.data._id || r.data.data); })
                .catch(() => {});
        }
    }, [urlShopId, userId, token]);

    useEffect(() => {
        if (!cropId || !token) return;
        axios.get(`${ServerSetting.apiUrl}/viewcrop/${cropId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (res.data.status === 200 && res.data.data) {
                    setCropDetails(res.data.data);
                    const t = String(res.data.data.cropType || '').toLowerCase();
                    setIsSabziMandi(t === 'sabzi mandi' || t === 'sabzimandi' || t === '1' || t.includes('sabzi'));
                }
            })
            .catch(() => {});
    }, [cropId, token]);

    useEffect(() => {
        if (!shopId || !cropId || cropDetails === null) return;
        setLoading(true);
        const isSabzi = isSabziMandi;
        Promise.all([
            isSabzi
                ? axios.post(`${ServerSetting.apiUrl}/getallvegetableorders`, { shopId, cropId }, { headers: { Authorization: `Bearer ${token}` } })
                : axios.get(`${ServerSetting.apiUrl}/viewallorderdanamandispecificshop/${shopId}/${cropId}`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.post(`${ServerSetting.apiUrl}/crop/getBuyerPaymentTotals`, { shopId, cropId }, { headers: { Authorization: `Bearer ${token}` } }),
        ])
            .then(([orderRes, totalRes]) => {
                const list = orderRes.data?.status === 200 ? orderRes.data.data || [] : [];
                setOrders(list);
                setPaymentTotals(totalRes.data?.success ? totalRes.data.data || {} : {});
            })
            .catch((err) => {
                Notification({ text: err.response?.data?.message || 'Failed to load', color: 'danger' });
            })
            .finally(() => setLoading(false));
    }, [shopId, cropId, token, cropDetails, isSabziMandi]);

    const getOrderId = (o: any) => o._id || '';
    const getBapariName = (o: any) => {
        if (isSabziMandi) {
            const c = o.vegetableOrderCusId;
            return c ? `${c.cusNameF || ''} ${c.cusNameL || ''}`.trim() : '—';
        }
        const b = o.danaMandiOrderBapariId;
        if (b && typeof b === 'object') return `${b.userNameF || ''} ${b.userNameL || ''}`.trim() || '—';
        if (typeof b === 'string' && b.trim()) return b.trim();
        return '—';
    };
    // For Sabzi Mandi: amount we take from buyer = Price × Pieces (gross). For Dana Mandi: totalPrice.
    const getBuyerAmount = (o: any) => {
        if (isSabziMandi) {
            const p = Number(o.pricePisce) || 0;
            const q = Number(o.totalPisces) || 0;
            return (isNaN(p) || isNaN(q)) ? 0 : p * q;
        }
        return Number(o.totalPrice) || 0;
    };
    const getTotalPrice = (o: any) => {
        const n = getBuyerAmount(o);
        return isNaN(n) ? 0 : n;
    };
    const getPrice = (o: any) => {
        const n = isSabziMandi ? Number(o.pricePisce) : Number(o.priceCrop);
        return isNaN(n) ? 0 : n;
    };
    const getReceiptId = (o: any) => o.receiptId || o._id?.slice(-8) || '—';

    const getStatus = (order: any) => {
        const id = getOrderId(order);
        const total = getTotalPrice(order);
        const received = paymentTotals[id] || 0;
        if (received >= total) return { text: 'Paid', color: 'success' };
        if (received > 0) return { text: 'Partial', color: 'warning' };
        return { text: 'Unpaid', color: 'danger' };
    };

    const handleOpenHistory = (order: any) => {
        const orderId = getOrderId(order);
        setHistoryModal({ orderId, order });
        axios.post(`${ServerSetting.apiUrl}/crop/getBuyerPaymentsByOrder`, { orderId }, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => setHistoryList(r.data?.success ? r.data.data || [] : []))
            .catch(() => setHistoryList([]));
    };

    const getRemainingDue = (order: any) => {
        const orderId = getOrderId(order);
        const orderTotal = getTotalPrice(order);
        const received = paymentTotals[orderId] || 0;
        return Math.max(0, orderTotal - received);
    };

    const handleSavePayment = async () => {
        if (!paymentModal || !shopId || !cropId) return;
        const amt = Number(paymentAmount);
        if (!amt || amt <= 0) {
            Notification({ text: 'Enter valid amount', color: 'warning' });
            return;
        }
        const order = paymentModal.order;
        const remainingDue = getRemainingDue(order);
        if (amt > remainingDue) {
            Swal.fire({
                title: 'Amount exceeds due',
                html: `Maximum allowed is <strong>Rs. ${remainingDue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> (remaining due for this order).`,
                icon: 'warning',
                confirmButtonColor: '#3085d6',
            });
            return;
        }
        const confirmed = await Swal.fire({
            title: 'Confirm Payment Received',
            html: `Record payment of <strong>Rs. ${amt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> from buyer?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, record payment',
            cancelButtonText: 'Cancel',
        });
        if (!confirmed.isConfirmed) return;

        const cusId = isSabziMandi ? (order.vegetableOrderCusId?._id || order.vegetableOrderCusId) : (order.danaMandiOrderCusId?._id || order.danaMandiOrderCusId);
        if (!cusId) {
            Notification({ text: 'Customer not found', color: 'danger' });
            return;
        }
        setSaving(true);
        axios.post(
            `${ServerSetting.apiUrl}/crop/recordBuyerPayment`,
            {
                orderId: getOrderId(order),
                orderType: isSabziMandi ? 'vegetable' : 'danaMandi',
                shopId,
                cropId,
                cusId,
                amount: amt,
                remarks: paymentRemarks.trim(),
            },
            { headers: { Authorization: `Bearer ${token}` } }
        )
            .then((r) => {
                if (r.data?.success) {
                    Swal.fire({ title: 'Saved', text: 'Payment recorded successfully.', icon: 'success', timer: 2000, showConfirmButton: false });
                    setPaymentModal(null);
                    setPaymentAmount('');
                    setPaymentRemarks('');
                    axios.post(`${ServerSetting.apiUrl}/crop/getBuyerPaymentTotals`, { shopId, cropId }, { headers: { Authorization: `Bearer ${token}` } })
                        .then((tr) => setPaymentTotals(tr.data?.success ? tr.data.data || {} : {}));
                }
            })
            .catch((e) => Swal.fire({ title: 'Error', text: e.response?.data?.message || 'Failed to record payment.', icon: 'error' }))
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
            { accessor: 'receiptId', title: 'Order ID', render: (order: any) => <span className="font-medium">{getReceiptId(order)}</span> },
            { accessor: 'bapariName', title: 'Bapari Name', render: (order: any) => getBapariName(order) },
            { accessor: 'price', title: 'Price', render: (order: any) => `Rs. ${getPrice(order).toLocaleString()}` },
            { accessor: 'totalPrice', title: isSabziMandi ? 'Amount (from buyer)' : 'Amount', render: (order: any) => `Rs. ${getTotalPrice(order).toLocaleString()}` },
            {
                accessor: 'status',
                title: 'Status',
                render: (order: any) => {
                    const s = getStatus(order);
                    return <span className={`badge bg-${s.color}`}>{s.text}</span>;
                },
            },
            {
                accessor: 'actions',
                title: 'Actions',
                render: (order: any) => (
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => { setPaymentModal({ order, orderType: isSabziMandi ? 'vegetable' : 'danaMandi' }); setPaymentAmount(''); setPaymentRemarks(''); }}>Payment Received</button>
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => handleOpenHistory(order)}>History</button>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDetailsModal(order)}>Order Details</button>
                    </div>
                ),
            },
        ],
        [isSabziMandi, paymentTotals]
    );

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><Link to="/dashboard" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link to={getRoute('/getassginshopcrops')} className="text-primary hover:underline">My Crops</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link to={getRoute(`/cropmenu/${userId}/${cropId}`)} className="text-primary hover:underline">Crop Management</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Buyer List</span></li>
            </ul>
            <PageHeader title={t('buyer_list')} description={t('buyer_list_desc')} onBack={() => window.history.back()} backLabel={t('back')} icon="👥" />

            <TableCard
                title="Orders"
                description={`${filteredOrders.length} order(s)`}
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
                searchPlaceholder="Search by Order ID..."
                emptyMessage="No orders found."
                idAccessor="_id"
            />

            <Modal opened={!!paymentModal} onClose={() => setPaymentModal(null)} title={t('payment_received')} size="sm">
                {paymentModal && (() => {
                    const remainingDue = getRemainingDue(paymentModal.order);
                    const amtNum = Number(paymentAmount);
                    const exceedsMax = paymentAmount !== '' && !isNaN(amtNum) && amtNum > remainingDue;
                    return (
                        <div className="space-y-4">
                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#191e3a] border border-[#ebedf2] dark:border-[#191e3a]">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Remaining due (max you can add)</p>
                                <p className="text-lg font-semibold text-primary">Rs. {remainingDue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount received (Rs.)</label>
                                <input
                                    type="number"
                                    className={`form-input ${exceedsMax ? 'border-red-500' : ''}`}
                                    placeholder="0.00"
                                    min="0"
                                    max={remainingDue}
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === '') {
                                            setPaymentAmount('');
                                            return;
                                        }
                                        const num = Number(v);
                                        if (!isNaN(num) && num > remainingDue) {
                                            setPaymentAmount(String(remainingDue));
                                        } else {
                                            setPaymentAmount(v);
                                        }
                                    }}
                                />
                                {exceedsMax && (
                                    <p className="text-sm text-red-500 mt-1">Amount cannot exceed remaining due (Rs. {remainingDue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).</p>
                                )}
                            </div>
                            <textarea className="form-textarea w-full" placeholder="Remarks (optional)" value={paymentRemarks} onChange={(e) => setPaymentRemarks(e.target.value)} rows={2} />
                            <div className="flex justify-end gap-2">
                                <button type="button" className="btn btn-outline-secondary" onClick={() => setPaymentModal(null)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleSavePayment} disabled={saving || exceedsMax}>{saving ? 'Saving...' : 'Save'}</button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            <Modal opened={!!historyModal} onClose={() => setHistoryModal(null)} title={t('payment_history_modal')} size="lg">
                {historyModal && (() => {
                    const orderTotal = getTotalPrice(historyModal.order);
                    const totalReceived = historyList.reduce((sum: number, h: any) => sum + Number(h.amount || 0), 0);
                    const status = totalReceived >= orderTotal ? { text: 'Paid', color: 'success' } : totalReceived > 0 ? { text: 'Partial', color: 'warning' } : { text: 'Unpaid', color: 'danger' };
                    return (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#191e3a] border border-[#ebedf2] dark:border-[#191e3a]">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</p>
                                        <p className="mt-0.5"><span className={`badge bg-${status.color} text-sm`}>{status.text}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Received</p>
                                        <p className="mt-0.5 text-lg font-semibold text-primary">Rs. {totalReceived.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Order Amount</p>
                                        <p className="mt-0.5 text-gray-700 dark:text-gray-300">Rs. {orderTotal.toLocaleString()}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Received <strong>Rs. {totalReceived.toLocaleString()}</strong> out of <strong>Rs. {orderTotal.toLocaleString()}</strong></p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment entries</p>
                                {historyList.length === 0 ? <p className="text-gray-500 py-2">No payments recorded yet.</p> : (
                                    <div className="border border-[#ebedf2] dark:border-[#191e3a] rounded-lg overflow-hidden">
                                        <div className="table-responsive max-h-80 overflow-y-auto">
                                            <table className="table-auto w-full text-left">
                                                <thead className="bg-gray-100 dark:bg-[#0e1726] sticky top-0">
                                                    <tr>
                                                        <th className="py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Amount</th>
                                                        <th className="py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Date</th>
                                                        <th className="py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Remarks</th>
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
                    const cus = isSabziMandi ? o.vegetableOrderCusId : o.danaMandiOrderCusId;
                    const bapariVal = o.danaMandiOrderBapariId;
                    const bapari = !isSabziMandi && bapariVal
                        ? (typeof bapariVal === 'object'
                            ? `${bapariVal.userNameF || ''} ${bapariVal.userNameL || ''}`.trim() || '—'
                            : String(bapariVal).trim() || '—')
                        : isSabziMandi && cus ? `${cus.cusNameF || ''} ${cus.cusNameL || ''}`.trim() || '—' : '—';
                    const receiptId = o.receiptId || o._id?.slice(-8) || o._id || '—';
                    const totalAmt = Number(o.totalPrice) || 0;
                    const rows: { label: string; value: string | number }[] = [
                        { label: 'Order Type', value: isSabziMandi ? 'Vegetable (Sabzi Mandi)' : 'Dana Mandi' },
                        { label: 'Bapari Name', value: bapari },
                        { label: 'Price (per unit)', value: `Rs. ${(isSabziMandi ? Number(o.pricePisce) : Number(o.priceCrop) || 0).toLocaleString()}` },
                        { label: 'Created At', value: o.createdAt ? new Date(o.createdAt).toLocaleString() : '—' },
                    ];
                    const extraKeys = Object.keys(o).filter((k) => !['_id', '__v', 'vegetableOrderCusId', 'danaMandiOrderCusId', 'receiptId', 'totalPrice', 'pricePisce', 'priceCrop', 'createdAt'].includes(k));
                    extraKeys.forEach((k) => {
                        const v = o[k];
                        if (v == null || typeof v === 'object') return;
                        rows.push({ label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()), value: String(v) });
                    });
                    return (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Receipt / Order ID</p>
                                    <p className="text-xl font-bold text-primary dark:text-primary">{receiptId}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Total Amount</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">Rs. {totalAmt.toLocaleString()}</p>
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
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Customer details</p>
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

export default BuyerList;
