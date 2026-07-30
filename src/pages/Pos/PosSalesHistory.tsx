import { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import PageHeader from '../../components/Agricultural/PageHeader';
import IconEye from '../../components/Icon/IconEye';
import IconPrinter from '../../components/Icon/IconPrinter';
import IconRestore from '../../components/Icon/IconRestore';
import IconPencil from '../../components/Icon/IconPencil';
import IconX from '../../components/Icon/IconX';
import { DataTable } from 'mantine-datatable';
import axios from 'axios';

type Sale = {
    _id: string;
    invoiceNumber: string;
    saleDate: string;
    totalAmount: number;
    totalReturned?: number;
    discountAmount: number;
    paymentType: string;
};

type SaleItem = {
    _id?: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    lineTotal: number;
};

type ReturnItem = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    refundAmount: number;
};

const PAGE_SIZES = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 20;

const PosSalesHistory = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [list, setList] = useState<Sale[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [returnModal, setReturnModal] = useState<{ saleId: string; invoiceNumber: string } | null>(null);
    const [saleDetail, setSaleDetail] = useState<{
        items: SaleItem[];
        returns?: { items: ReturnItem[] }[];
        totalAmount?: number;
        discountAmount?: number;
    } | null>(null);
    const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
    const [returnReason, setReturnReason] = useState('');
    const [returnRefundPaymentType, setReturnRefundPaymentType] = useState<'cash' | 'card' | 'credit' | 'mix'>('cash');
    const [returnRefundPaymentDetails, setReturnRefundPaymentDetails] = useState('');
    const [returnLoading, setReturnLoading] = useState(false);
    const [returnDetailLoading, setReturnDetailLoading] = useState(false);
    const [returnError, setReturnError] = useState('');

    useEffect(() => {
        dispatch(setPageTitle(t('pos_sales_history_title')));
    }, [dispatch, t, i18n.language]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setLoading(true);
        const params: Record<string, string> = { page: String(page), limit: String(pageSize) };
        if (search) params.search = search;
        const q = new URLSearchParams(params).toString();
        axios
            .get(`${ServerSetting.apiUrl}/pos/sales?${q}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((r) => {
                if (r.data?.data) setList(r.data.data);
                if (r.data?.total != null) setTotal(r.data.total);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [page, pageSize, search]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        if (!returnModal?.saleId) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        setReturnDetailLoading(true);
        setReturnError('');
        axios
            .get(`${ServerSetting.apiUrl}/pos/sales/${returnModal.saleId}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((r) => {
                if (r.data?.data) {
                    setSaleDetail({
                        items: r.data.data.items || [],
                        returns: r.data.data.returns || [],
                        totalAmount: r.data.data.totalAmount,
                        discountAmount: r.data.data.discountAmount,
                    });
                    setReturnQuantities({});
                    setReturnReason('');
                    setReturnRefundPaymentType('cash');
                    setReturnRefundPaymentDetails('');
                } else setReturnError('Could not load sale details.');
            })
            .catch(() => setReturnError('Could not load sale details.'))
            .finally(() => setReturnDetailLoading(false));
    }, [returnModal?.saleId]);

    const maxReturnableByProduct = useMemo(() => {
        if (!saleDetail?.items) return {};
        const returned: Record<string, number> = {};
        (saleDetail.returns || []).forEach((r) => {
            (r.items || []).forEach((it: ReturnItem) => {
                const pid = typeof it.productId === 'object' ? (it.productId as any)?._id : it.productId;
                const id = typeof pid === 'string' ? pid : String(pid);
                returned[id] = (returned[id] || 0) + (it.quantity || 0);
            });
        });
        const max: Record<string, number> = {};
        saleDetail.items.forEach((it) => {
            const id = typeof it.productId === 'object' ? (it.productId as any)?._id : it.productId;
            const pid = typeof id === 'string' ? id : String(id);
            const sold = it.quantity || 0;
            const already = returned[pid] || 0;
            max[pid] = Math.max(0, sold - already);
        });
        return max;
    }, [saleDetail]);

    const openReturnModal = (sale: Sale) => {
        setReturnModal({ saleId: sale._id, invoiceNumber: sale.invoiceNumber });
    };

    const closeReturnModal = () => {
        setReturnModal(null);
        setSaleDetail(null);
        setReturnQuantities({});
        setReturnReason('');
        setReturnRefundPaymentType('cash');
        setReturnRefundPaymentDetails('');
        setReturnError('');
        setPage((p) => p);
    };

    const estimatedRefundTotal = useMemo(() => {
        if (!saleDetail?.items?.length) return 0;
        const sumLineTotals = saleDetail.items.reduce((s, it) => s + (it.lineTotal || 0), 0);
        const invoiceTotal = saleDetail.totalAmount ?? 0;
        const invoiceDiscount = saleDetail.discountAmount ?? 0;
        const ratioAfterInvoiceDiscount = sumLineTotals > 0 ? invoiceTotal / sumLineTotals : 1;
        let total = 0;
        saleDetail.items.forEach((it) => {
            const id = typeof it.productId === 'object' ? (it.productId as any)?._id : it.productId;
            const pid = typeof id === 'string' ? id : String(id);
            const max = maxReturnableByProduct[pid] ?? 0;
            const qty = Math.max(0, Math.min(max, Number(returnQuantities[pid]) || 0));
            if (qty < 0.001) return;
            const lineTotal = it.lineTotal || 0;
            const proportionOfLine = qty / (it.quantity || 1);
            const lineTotalForReturnedQty = lineTotal * proportionOfLine;
            const refund = Math.round(lineTotalForReturnedQty * ratioAfterInvoiceDiscount * 100) / 100;
            total += refund;
        });
        return Math.round(total * 100) / 100;
    }, [saleDetail?.items, saleDetail?.totalAmount, saleDetail?.discountAmount, maxReturnableByProduct, returnQuantities]);

    const submitReturn = () => {
        if (!returnModal?.saleId || !saleDetail?.items?.length) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        const items: { productId: string; quantity: number }[] = [];
        let hasAny = false;
        saleDetail.items.forEach((it) => {
            const id = typeof it.productId === 'object' ? (it.productId as any)?._id : it.productId;
            const pid = typeof id === 'string' ? id : String(id);
            const max = maxReturnableByProduct[pid] ?? 0;
            const qty = Math.max(0, Number(returnQuantities[pid]) || 0);
            if (qty > 0 && qty <= max) {
                items.push({ productId: pid, quantity: qty });
                hasAny = true;
            }
        });
        if (!hasAny) {
            setReturnError('Enter quantity to return for at least one item.');
            return;
        }
        setReturnError('');
        setReturnLoading(true);
        axios
            .post(
                `${ServerSetting.apiUrl}/pos/sales/${returnModal.saleId}/return`,
                { items, reason: returnReason, refundPaymentType: returnRefundPaymentType, refundPaymentDetails: returnRefundPaymentDetails },
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            )
            .then((r) => {
                if (r.data?.status === 201) {
                    closeReturnModal();
                    setReturnLoading(false);
                    setLoading(true);
                    const params: Record<string, string> = { page: String(page), limit: String(pageSize) };
                    if (search) params.search = search;
                    const q = new URLSearchParams(params).toString();
                    return axios.get(`${ServerSetting.apiUrl}/pos/sales?${q}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true });
                }
                setReturnError(r.data?.message || 'Return failed.');
            })
            .then((r) => {
                if (r?.data?.data) setList(r.data.data);
                if (r?.data?.total != null) setTotal(r.data.total);
                setLoading(false);
            })
            .catch(() => {
                setReturnError('Return request failed.');
                setLoading(false);
            })
            .finally(() => setReturnLoading(false));
    };

    return (
        <div className="space-y-6">
            <PageHeader title={t('pos_sales_history_title')} description={t('pos_sales_history_desc')} icon={<span>🗂️</span>} />

            <div className="panel bg-white dark:bg-[#0e1726] p-5 rounded-2xl border border-white-dark/10 shadow-sm dark:border-white/5">
                <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Search by invoice number</label>
                    <input
                        type="text"
                        placeholder="e.g. INV-20250131-123"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="form-input w-full max-w-md rounded-lg"
                    />
                </div>
                {loading ? (
                    <div className="flex justify-center py-8"><span className="animate-spin inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
                ) : (
                    <div className="datatables">
                        <DataTable
                            idAccessor="_id"
                            className="whitespace-nowrap table-hover"
                            highlightOnHover
                            records={list}
                            columns={[
                                { accessor: 'invoiceNumber', title: 'Invoice', render: (s) => <span className="font-semibold text-gray-800 dark:text-white">{s.invoiceNumber}</span> },
                                { accessor: 'saleDate', title: 'Date', render: (s) => new Date(s.saleDate).toLocaleString() },
                                {
                                    accessor: 'totalAmount',
                                    title: 'Amount',
                                    textAlignment: 'right',
                                    render: (s) => (
                                        <span>
                                            <span className="font-semibold text-primary-600 dark:text-primary-400">Rs {Math.max(0, (s.totalAmount || 0) - (s.totalReturned || 0)).toLocaleString()}</span>
                                            {(s.totalReturned || 0) > 0 && (
                                                <span className="block text-xs text-amber-600 dark:text-amber-400 mt-0.5">Refunded: Rs {(s.totalReturned || 0).toLocaleString()}</span>
                                            )}
                                        </span>
                                    ),
                                },
                                { accessor: 'paymentType', title: 'Payment', render: (s) => <span className="capitalize">{s.paymentType}</span> },
                                {
                                    accessor: 'actions',
                                    title: 'Action',
                                    textAlignment: 'right',
                                    render: (s) => (
                                        <div className="flex items-center justify-end gap-2 flex-wrap">
                                            <button type="button" className="btn btn-sm btn-outline-primary rounded-lg flex items-center gap-1.5" onClick={() => navigate(`/pos/receipt/${s._id}`)} title="View receipt">
                                                <IconEye className="w-4 h-4" />
                                                <span className="hidden sm:inline">View</span>
                                            </button>
                                            {(s.totalReturned || 0) === 0 && (
                                                <button type="button" className="btn btn-sm btn-outline-secondary rounded-lg flex items-center gap-1.5" onClick={() => navigate(`/pos/sale/${s._id}/edit`)} title="Edit invoice">
                                                    <IconPencil className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Edit</span>
                                                </button>
                                            )}
                                            <button type="button" className="btn btn-sm btn-primary rounded-lg flex items-center gap-1.5" onClick={() => navigate(`/pos/receipt/${s._id}?print=1`)} title="Print receipt">
                                                <IconPrinter className="w-4 h-4" />
                                                <span className="hidden sm:inline">Print</span>
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-warning rounded-lg flex items-center gap-1.5 border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10" onClick={() => openReturnModal(s)} title="Process return">
                                                <IconRestore className="w-4 h-4" />
                                                <span className="hidden sm:inline">Return</span>
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            totalRecords={total}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={(size) => { setPageSize(size); setPage(1); }}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} sales`}
                            noRecordsText="No sales found"
                        />
                    </div>
                )}
            </div>

            {/* Return modal */}
            {returnModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => !returnDetailLoading && !returnLoading && closeReturnModal()}>
                    <div className="bg-white dark:bg-[#0e1726] rounded-2xl shadow-xl border border-white-dark/10 dark:border-white/5 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-white-dark/10 dark:border-white/5">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Process Return — {returnModal.invoiceNumber}</h3>
                            <button type="button" className="p-2 rounded-lg hover:bg-white-dark/10 dark:hover:bg-white/5 text-gray-500" onClick={closeReturnModal} disabled={returnLoading}>
                                <IconX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            {returnDetailLoading ? (
                                <div className="flex justify-center py-8"><span className="animate-spin inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>
                            ) : returnError && !saleDetail ? (
                                <p className="text-danger py-4">{returnError}</p>
                            ) : saleDetail?.items?.length ? (
                                <>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Select quantities to return. Stock will be added back automatically.</p>
                                    {returnError && <p className="text-danger text-sm mb-3">{returnError}</p>}
                                    {Object.values(maxReturnableByProduct).some((m) => m >= 0.001) ? (
                                        <div className="overflow-x-auto">
                                            <table className="table-auto w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-white-dark/10 dark:border-white/5">
                                                        <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Product</th>
                                                        <th className="text-right py-2 font-semibold text-gray-700 dark:text-gray-300">Sold</th>
                                                        <th className="text-right py-2 font-semibold text-gray-700 dark:text-gray-300">Returnable</th>
                                                        <th className="text-right py-2 font-semibold text-gray-700 dark:text-gray-300">Return Qty</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {saleDetail.items.map((it) => {
                                                        const pid = typeof it.productId === 'object' ? (it.productId as any)?._id : it.productId;
                                                        const id = typeof pid === 'string' ? pid : String(pid);
                                                        const max = maxReturnableByProduct[id] ?? 0;
                                                        if (max < 0.001) return null;
                                                        return (
                                                            <tr key={id} className="border-b border-white-dark/5">
                                                                <td className="py-2.5 text-gray-800 dark:text-white">{it.productName}</td>
                                                                <td className="py-2.5 text-right text-gray-600 dark:text-gray-400">{it.quantity}</td>
                                                                <td className="py-2.5 text-right font-medium text-amber-600 dark:text-amber-400">{max}</td>
                                                                <td className="py-2.5 text-right">
                                                                    <input
                                                                        type="number"
                                                                        min={0}
                                                                        max={max}
                                                                        step="any"
                                                                        value={returnQuantities[id] ?? ''}
                                                                        onChange={(e) => setReturnQuantities((prev) => ({ ...prev, [id]: parseFloat(e.target.value) || 0 }))}
                                                                        className="form-input w-24 text-right rounded-lg py-1.5"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-amber-600 dark:text-amber-400 font-medium py-4">All items from this sale have already been returned.</p>
                                    )}
                                    {Object.values(maxReturnableByProduct).some((m) => m >= 0.001) && (
                                        <>
                                            <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-white-dark/10 dark:border-white/10">
                                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Refund summary</p>
                                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                    Refund amount: Rs {estimatedRefundTotal.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Refund payment method</label>
                                                    <select
                                                        value={returnRefundPaymentType}
                                                        onChange={(e) => setReturnRefundPaymentType(e.target.value as 'cash' | 'card' | 'credit' | 'mix')}
                                                        className="form-select w-full rounded-lg"
                                                    >
                                                        <option value="cash">Cash</option>
                                                        <option value="card">Card</option>
                                                        <option value="credit">Credit</option>
                                                        <option value="mix">Mix</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Refund payment details (optional)</label>
                                                    <input
                                                        type="text"
                                                        value={returnRefundPaymentDetails}
                                                        onChange={(e) => setReturnRefundPaymentDetails(e.target.value)}
                                                        placeholder="e.g. Card last 4 digits, cheque no."
                                                        className="form-input w-full rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for return (optional)</label>
                                        <textarea
                                            value={returnReason}
                                            onChange={(e) => setReturnReason(e.target.value)}
                                            placeholder="e.g. Defective, wrong item..."
                                            className="form-textarea w-full rounded-lg min-h-[80px]"
                                            rows={3}
                                        />
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-500 py-4">No items to return.</p>
                            )}
                        </div>
                        {saleDetail?.items?.length && Object.values(maxReturnableByProduct).some((m) => m >= 0.001) && (
                            <div className="flex justify-end gap-2 p-5 border-t border-white-dark/10 dark:border-white/5">
                                <button type="button" className="btn btn-outline-secondary rounded-xl" onClick={closeReturnModal} disabled={returnLoading}>Cancel</button>
                                <button type="button" className="btn bg-amber-600 hover:bg-amber-700 text-white rounded-xl flex items-center gap-2" onClick={submitReturn} disabled={returnLoading}>
                                    {returnLoading ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <IconRestore className="w-4 h-4" />}
                                    Process Return
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PosSalesHistory;
