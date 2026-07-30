import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import IconEye from '../../components/Icon/IconEye';
import IconPlus from '../../components/Icon/IconPlus';
import IconX from '../../components/Icon/IconX';
import { DataTable } from 'mantine-datatable';
import PageHeader from '../../components/Agricultural/PageHeader';
import axios from 'axios';

type PosCustomer = {
    _id: string;
    name: string;
    cnic?: string;
    phone?: string;
    phone2?: string;
    address?: string;
    balance?: number;
    creditSaleCount?: number;
};

const PAGE_SIZES = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

const PosCustomers = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const [list, setList] = useState<PosCustomer[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [detail, setDetail] = useState<PosCustomer | null>(null);
    const [sales, setSales] = useState<any[]>([]);
    const [returns, setReturns] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [balance, setBalance] = useState<{ balance: number; totalCredit: number; totalReturned: number; totalPaid: number } | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addName, setAddName] = useState('');
    const [addCnic, setAddCnic] = useState('');
    const [addPhone, setAddPhone] = useState('');
    const [addPhone2, setAddPhone2] = useState('');
    const [addAddress, setAddAddress] = useState('');
    const [addSaving, setAddSaving] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentSaleId, setPaymentSaleId] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mix'>('cash');
    const [paymentSaving, setPaymentSaving] = useState(false);
    const [creditInvoices, setCreditInvoices] = useState<any[]>([]);

    useEffect(() => {
        dispatch(setPageTitle(t('pos_customers_title')));
    }, [dispatch, t, i18n.language]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setLoading(true);
        const params: Record<string, string> = { limit: '100' };
        if (search) params.search = search;
        const q = new URLSearchParams(params).toString();
        axios
            .get(`${ServerSetting.apiUrl}/pos/customers?${q}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((r) => { if (r.data?.data) setList(r.data.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        if (!detailId) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        setDetailLoading(true);
        Promise.all([
            axios.get(`${ServerSetting.apiUrl}/pos/customers/${detailId}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
            axios.get(`${ServerSetting.apiUrl}/pos/customers/${detailId}/sales`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
            axios.get(`${ServerSetting.apiUrl}/pos/customers/${detailId}/returns`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
            axios.get(`${ServerSetting.apiUrl}/pos/customers/${detailId}/payments`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
            axios.get(`${ServerSetting.apiUrl}/pos/customers/${detailId}/balance`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
            axios.get(`${ServerSetting.apiUrl}/pos/customers/${detailId}/credit-invoices`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
        ])
            .then(([c, s, r, p, b, inv]) => {
                if (c.data?.data) setDetail(c.data.data);
                if (s.data?.data) setSales(s.data.data);
                if (r.data?.data) setReturns(r.data.data);
                if (p.data?.data) setPayments(p.data.data);
                if (b.data?.data) setBalance(b.data.data);
                if (inv.data?.data) setCreditInvoices(inv.data.data);
            })
            .catch(() => {})
            .finally(() => setDetailLoading(false));
    }, [detailId]);

    const openPaymentModal = () => {
        setShowPaymentModal(true);
        setPaymentSaleId(creditInvoices[0]?._id || '');
        setPaymentAmount(creditInvoices[0]?.due?.toString() || '');
    };

    const submitAddCustomer = () => {
        if (!addName.trim()) {
            Notification({ text: 'Name is required', color: 'warning' });
            return;
        }
        if (!addPhone.trim()) {
            Notification({ text: 'Phone is required', color: 'warning' });
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) return;
        setAddSaving(true);
        axios
            .post(
                `${ServerSetting.apiUrl}/pos/customers`,
                {
                    name: addName.trim(),
                    cnic: addCnic.trim() || undefined,
                    phone: addPhone.trim(),
                    phone2: addPhone2.trim() || undefined,
                    address: addAddress.trim() || undefined,
                },
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            )
            .then((r) => {
                if (r.data?.data) {
                    Notification({ text: 'Customer added', color: 'success' });
                    setShowAddModal(false);
                    setAddName('');
                    setAddCnic('');
                    setAddPhone('');
                    setAddPhone2('');
                    setAddAddress('');
                    setList((prev) => [...prev, r.data.data]);
                } else Notification({ text: r.data?.message || 'Failed', color: 'danger' });
            })
            .catch((e) => Notification({ text: e.response?.data?.message || 'Failed', color: 'danger' }))
            .finally(() => setAddSaving(false));
    };

    const submitPayment = () => {
        if (!detailId || !paymentSaleId || !paymentAmount || Number(paymentAmount) <= 0) {
            Notification({ text: 'Select invoice and enter amount', color: 'warning' });
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) return;
        setPaymentSaving(true);
        axios
            .post(
                `${ServerSetting.apiUrl}/pos/customers/${detailId}/payments`,
                { posSaleId: paymentSaleId, amount: Number(paymentAmount), paymentMethod },
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            )
            .then((r) => {
                if (r.data?.data) {
                    Notification({ text: 'Payment recorded', color: 'success' });
                    setShowPaymentModal(false);
                    setPaymentAmount('');
                    if (detailId) {
                        setDetailLoading(true);
                        Promise.all([
                            axios.get(`${ServerSetting.apiUrl}/pos/customers/${detailId}/balance`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
                            axios.get(`${ServerSetting.apiUrl}/pos/customers/${detailId}/payments`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
                            axios.get(`${ServerSetting.apiUrl}/pos/customers/${detailId}/credit-invoices`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
                        ]).then(([b, p, inv]) => {
                            if (b.data?.data) setBalance(b.data.data);
                            if (p.data?.data) setPayments(p.data.data);
                            if (inv.data?.data) setCreditInvoices(inv.data.data);
                        }).finally(() => setDetailLoading(false));
                    }
                } else Notification({ text: r.data?.message || 'Failed', color: 'danger' });
            })
            .catch((e) => Notification({ text: e.response?.data?.message || 'Failed', color: 'danger' }))
            .finally(() => setPaymentSaving(false));
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('pos_customers_page_title')}
                description={t('pos_customers_page_desc')}
                rightContent={
                    <button type="button" className="btn btn-outline-white flex items-center gap-2" onClick={() => setShowAddModal(true)}>
                        <IconPlus className="w-4 h-4" />
                        {t('pos_add_customer')}
                    </button>
                }
                icon={<span>👤</span>}
            />

            <div className="panel bg-white dark:bg-[#0e1726] p-5 rounded-2xl border border-white-dark/10 shadow-sm dark:border-white/5">
                <div className="mb-4">
                    <input type="text" className="form-input w-full max-w-md rounded-lg" placeholder={t('pos_search_customer_list_ph')} value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                {loading ? (
                    <div className="flex justify-center py-8"><span className="animate-spin inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
                ) : (
                    <div className="datatables">
                        <DataTable
                            idAccessor="_id"
                            className="whitespace-nowrap table-hover"
                            highlightOnHover
                            records={list.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)}
                            columns={[
                                { accessor: 'name', title: 'Name', render: (c) => <span className="font-semibold text-gray-800 dark:text-white">{c.name}</span> },
                                { accessor: 'cnic', title: 'CNIC', render: (c) => c.cnic || '—' },
                                { accessor: 'phone', title: 'Phone', render: (c) => c.phone || '—' },
                                { accessor: 'address', title: 'Address', render: (c) => <span className="max-w-[180px] truncate block" title={c.address || ''}>{c.address || '—'}</span> },
                                {
                                    accessor: 'balance',
                                    title: 'Balance',
                                    textAlignment: 'right',
                                    render: (c) =>
                                        c.balance != null && c.balance !== 0
                                            ? 0 < c.balance
                                                ? `Rs ${c.balance.toLocaleString()} (due)`
                                                : `Rs ${Math.abs(c.balance).toLocaleString()} (over)`
                                            : '—',
                                },
                                {
                                    accessor: 'actions',
                                    title: 'Action',
                                    textAlignment: 'right',
                                    render: (c) => (
                                        <button type="button" className="btn btn-sm btn-outline-primary rounded-lg flex items-center gap-1.5" onClick={() => setDetailId(c._id)}>
                                            <IconEye className="w-4 h-4" />
                                            View
                                        </button>
                                    ),
                                },
                            ]}
                            totalRecords={list.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={(size) => { setPageSize(size); setPage(1); }}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} customers`}
                            noRecordsText="No customers found"
                        />
                    </div>
                )}
            </div>

            {/* Detail drawer */}
            {detailId && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-black/50" onClick={() => setDetailId(null)}>
                    <div className="w-full max-w-lg bg-white dark:bg-[#0e1726] shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-white-dark/10">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">{detail?.name || 'Customer'}</h2>
                            <button type="button" className="p-2 rounded-lg hover:bg-white-dark/10" onClick={() => setDetailId(null)}><IconX className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {detailLoading ? (
                                <div className="flex justify-center py-8"><span className="animate-spin inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
                            ) : (
                                <>
                                    {detail && (
                                        <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 space-y-1">
                                            <p className="text-sm text-gray-500">CNIC: {detail.cnic || '—'}</p>
                                            <p className="text-sm text-gray-500">Phone: {detail.phone || '—'}</p>
                                            {detail.phone2 ? <p className="text-sm text-gray-500">Phone 2: {detail.phone2}</p> : null}
                                            <p className="text-sm text-gray-500">Address: {detail.address || '—'}</p>
                                        </div>
                                    )}
                                    {balance != null && (
                                        <div className="rounded-xl border-2 border-primary-200 dark:border-primary-800 p-4">
                                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Outstanding balance</p>
                                            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">Rs {balance.balance.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 mt-1">Credit sales: Rs {balance.totalCredit?.toLocaleString()} | Returned: Rs {balance.totalReturned?.toLocaleString()} | Paid: Rs {balance.totalPaid?.toLocaleString()}</p>
                                            {balance.balance > 0 && creditInvoices.length > 0 && (
                                                <button type="button" className="btn btn-sm btn-primary mt-2" onClick={openPaymentModal}>Receive Payment</button>
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Sales ({sales.length})</h3>
                                        <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                                            {sales.slice(0, 20).map((s: any) => (
                                                <div key={s._id} className="flex justify-between py-1 border-b border-white-dark/5">
                                                    <span>{s.invoiceNumber} — {new Date(s.saleDate).toLocaleDateString()}</span>
                                                    <span className="font-medium">Rs {s.totalAmount?.toLocaleString()} {s.paymentType === 'credit' && '(Pay later)'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Returns ({returns.length})</h3>
                                        <div className="max-h-32 overflow-y-auto space-y-1 text-sm">
                                            {returns.slice(0, 15).map((r: any) => (
                                                <div key={r._id} className="flex justify-between py-1 border-b border-white-dark/5">
                                                    <span>{new Date(r.returnDate).toLocaleString()}</span>
                                                    <span className="text-amber-600 dark:text-amber-400">Rs {r.totalReturnAmount?.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Payments received ({payments.length})</h3>
                                        <div className="max-h-32 overflow-y-auto space-y-1 text-sm">
                                            {payments.slice(0, 15).map((p: any) => (
                                                <div key={p._id} className="flex justify-between py-1 border-b border-white-dark/5">
                                                    <span>{new Date(p.paymentDate).toLocaleString()} {p.posSaleId?.invoiceNumber && `— ${p.posSaleId.invoiceNumber}`}</span>
                                                    <span className="text-primary-600 dark:text-primary-400">Rs {p.amount?.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add customer modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50" onClick={() => !addSaving && setShowAddModal(false)}>
                    <div className="bg-white dark:bg-[#0e1726] rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Add Customer</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                                <input type="text" className="form-input w-full rounded-lg" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Customer name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNIC (optional)</label>
                                <input type="text" className="form-input w-full rounded-lg" value={addCnic} onChange={(e) => setAddCnic(e.target.value)} placeholder="CNIC" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
                                <input type="text" className="form-input w-full rounded-lg" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="Phone" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone 2 (optional)</label>
                                <input type="text" className="form-input w-full rounded-lg" value={addPhone2} onChange={(e) => setAddPhone2(e.target.value)} placeholder="Second phone" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address (optional)</label>
                                <textarea className="form-input w-full rounded-lg min-h-[80px]" value={addAddress} onChange={(e) => setAddAddress(e.target.value)} placeholder="Address" rows={3} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" className="btn btn-outline-secondary rounded-xl" onClick={() => setShowAddModal(false)} disabled={addSaving}>Cancel</button>
                            <button type="button" className="btn btn-primary rounded-xl" onClick={submitAddCustomer} disabled={addSaving}>{addSaving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receive payment modal */}
            {showPaymentModal && detailId && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50" onClick={() => !paymentSaving && setShowPaymentModal(false)}>
                    <div className="bg-white dark:bg-[#0e1726] rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Receive Payment</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice</label>
                                <select className="form-select w-full rounded-lg" value={paymentSaleId} onChange={(e) => { setPaymentSaleId(e.target.value); const inv = creditInvoices.find((i: any) => i._id === e.target.value); if (inv) setPaymentAmount(String(inv.due)); }}>
                                    {creditInvoices.map((inv: any) => (
                                        <option key={inv._id} value={inv._id}>{inv.invoiceNumber} — Due: Rs {inv.due?.toLocaleString()}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (Rs)</label>
                                <input type="number" className="form-input w-full rounded-lg" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} min={0} step={0.01} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment method</label>
                                <select className="form-select w-full rounded-lg" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="mix">Mix</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" className="btn btn-outline-secondary rounded-xl" onClick={() => setShowPaymentModal(false)} disabled={paymentSaving}>Cancel</button>
                            <button type="button" className="btn btn-primary rounded-xl" onClick={submitPayment} disabled={paymentSaving}>{paymentSaving ? 'Saving...' : 'Record Payment'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PosCustomers;
