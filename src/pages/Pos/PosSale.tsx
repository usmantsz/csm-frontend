import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { PosInput, PosSelect } from '../../components/Pos/PosFormField';
import PageHeader from '../../components/Agricultural/PageHeader';
import axios from 'axios';

type CartItem = {
    productId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    discountAmount: number;
    lineTotal: number;
    stock: number;
};

type Product = {
    _id: string;
    name: string;
    code?: string;
    category?: string;
    price: number;
    stock: number;
    unit?: string;
};

type SaleRecord = {
    _id: string;
    invoiceNumber: string;
    saleDate: string;
    totalAmount: number;
    discountAmount: number;
    paymentType: string;
    items: { productName: string; quantity: number; unitPrice: number; lineTotal: number }[];
};

type PosCustomer = { _id: string; name: string; cnic?: string; phone?: string };

const PosSale = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [overallDiscount, setOverallDiscount] = useState(0);
    const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
    const [discountPercent, setDiscountPercent] = useState(0);
    const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'credit' | 'mix'>('cash');
    const [customerMode, setCustomerMode] = useState<'walk-in' | 'customer'>('walk-in');
    const [customerName, setCustomerName] = useState('');
    const [walkInCnic, setWalkInCnic] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<PosCustomer | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerList, setCustomerList] = useState<PosCustomer[]>([]);
    const [customerSearching, setCustomerSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSale, setLastSale] = useState<SaleRecord | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('pos_sale_title')));
    }, [dispatch, t, i18n.language]);

    const fetchProducts = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        axios
            .get(`${ServerSetting.apiUrl}/pos/products?limit=200`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((r) => {
                if (r.data?.data) setProducts(r.data.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || customerMode !== 'customer') return;
        const t = setTimeout(() => {
            const q = customerSearch.trim();
            if (!q) {
                setCustomerList([]);
                return;
            }
            setCustomerSearching(true);
            axios
                .get(`${ServerSetting.apiUrl}/pos/customers?search=${encodeURIComponent(q)}&limit=20`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
                .then((r) => { if (r.data?.data) setCustomerList(r.data.data); })
                .catch(() => setCustomerList([]))
                .finally(() => setCustomerSearching(false));
        }, 300);
        return () => clearTimeout(t);
    }, [customerMode, customerSearch]);

    const filteredProducts = products.filter(
        (p) =>
            p.stock > 0 &&
            (search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || (p.code || '').toLowerCase().includes(search.toLowerCase()))
    );

    const addToCart = (p: Product, qty: number = 1) => {
        if (p.stock < qty) {
            Notification({ text: t('pos_only_in_stock', { count: p.stock }), color: 'warning' });
            return;
        }
        setCart((prev) => {
            const existing = prev.find((x) => x.productId === p._id);
            const newQty = (existing ? existing.quantity : 0) + qty;
            if (newQty > p.stock) {
                Notification({ text: t('pos_only_in_stock', { count: p.stock }), color: 'warning' });
                return prev;
            }
            const lineTotal = Math.round(newQty * p.price * 100) / 100;
            if (existing) {
                return prev.map((x) =>
                    x.productId === p._id ? { ...x, quantity: newQty, lineTotal } : x
                );
            }
            return [...prev, { productId: p._id, name: p.name, unitPrice: p.price, quantity: newQty, discountAmount: 0, lineTotal, stock: p.stock }];
        });
    };

    const updateCartQty = (productId: string, delta: number) => {
        setCart((prev) => {
            const item = prev.find((x) => x.productId === productId);
            if (!item) return prev;
            const newQty = Math.max(0, item.quantity + delta);
            if (newQty === 0) return prev.filter((x) => x.productId !== productId);
            const lineTotal = Math.round(newQty * item.unitPrice * 100) / 100;
            return prev.map((x) => (x.productId === productId ? { ...x, quantity: newQty, lineTotal } : x));
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((x) => x.productId !== productId));
    };

    const subtotal = cart.reduce((s, i) => s + i.lineTotal, 0);
    const discountAmt = discountType === 'percent'
        ? Math.round(subtotal * Math.min(100, Math.max(0, discountPercent)) / 100 * 100) / 100
        : Math.max(0, Number(overallDiscount) || 0);
    const grandTotal = Math.round((subtotal - discountAmt) * 100) / 100;

    const buildPayload = (): Record<string, unknown> => {
        const payload: Record<string, unknown> = {
            items: cart.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                discountAmount: i.discountAmount,
            })),
            discountAmount: discountAmt,
            paymentType,
            remarks: remarks.trim() || undefined,
        };
        if (customerMode === 'customer' && selectedCustomer) {
            payload.posCustomerId = selectedCustomer._id;
            payload.customerName = selectedCustomer.name;
        } else {
            payload.customerName = customerName.trim() || undefined;
            if (walkInCnic.trim()) payload.cnic = walkInCnic.trim();
        }
        return payload;
    };

    const openConfirmModal = () => {
        if (cart.length === 0) {
            Notification({ text: t('pos_add_to_cart'), color: 'warning' });
            return;
        }
        setShowConfirmModal(true);
    };

    const submitSaleAfterConfirm = () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setSaving(true);
        setShowConfirmModal(false);
        axios
            .post(`${ServerSetting.apiUrl}/pos/sales`, buildPayload(), { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((r) => {
                if (r.data?.data) {
                    setLastSale(r.data.data);
                    setShowReceipt(true);
                    setCart([]);
                    setOverallDiscount(0);
                    setDiscountPercent(0);
                    setDiscountType('fixed');
                    setCustomerName('');
                    setWalkInCnic('');
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                    setRemarks('');
                    fetchProducts();
                } else {
                    Notification({ text: r.data?.message || t('pos_sale_failed'), color: 'danger' });
                }
            })
            .catch((e) => {
                Notification({ text: e.response?.data?.message || e.message || t('pos_sale_failed'), color: 'danger' });
            })
            .finally(() => setSaving(false));
    };

    const printReceipt = () => {
        window.print();
    };

    return (
        <div className="space-y-4">
            <PageHeader
                title={t('pos_sale_title')}
                description={t('pos_sale_desc')}
                icon={<span>🛒</span>}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product list */}
                <div className="lg:col-span-2 panel p-5 rounded-2xl border border-white-dark/10 shadow-sm dark:border-white/5">
                    <PosInput
                        label={t('pos_search_products')}
                        placeholder={t('pos_search_products_ph')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        wrapperClass="mb-4"
                    />
                    {loading ? (
                        <div className="flex justify-center py-8"><span className="animate-spin inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                            {filteredProducts.map((p) => (
                                <button
                                    key={p._id}
                                    type="button"
                                    onClick={() => addToCart(p)}
                                    className="text-left p-4 rounded-xl border-2 border-white-dark/15 hover:border-primary-500 hover:bg-primary-50/80 dark:hover:bg-primary-900/20 dark:hover:border-primary-500/50 transition-all shadow-sm hover:shadow-md"
                                >
                                    <p className="font-semibold text-gray-800 dark:text-white truncate">{p.name}</p>
                                    <p className="text-sm text-gray-500 mt-0.5">Rs {p.price.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400 mt-1">{t('pos_stock_label', { count: p.stock })}</p>
                                </button>
                            ))}
                            {filteredProducts.length === 0 && <p className="col-span-full text-center text-gray-500 py-8">{t('pos_no_products')}</p>}
                        </div>
                    )}
                </div>

                {/* Cart */}
                <div className="panel p-5 rounded-2xl border border-white-dark/10 shadow-sm dark:border-white/5 flex flex-col">
                    <h2 className="font-bold text-lg text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-bold">{cart.length}</span>
                        {t('pos_cart')}
                    </h2>
                    <div className="flex-1 overflow-y-auto min-h-[180px] max-h-[38vh] space-y-2">
                        {cart.map((i) => (
                            <div key={i.productId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-white-dark/10">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 dark:text-white truncate">{i.name}</p>
                                    <p className="text-sm text-gray-500">Rs {i.unitPrice.toLocaleString()} × {i.quantity} = <span className="font-medium text-primary-600">Rs {i.lineTotal.toLocaleString()}</span></p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button type="button" className="w-8 h-8 rounded-lg border border-white-dark/20 hover:bg-white-dark/10 flex items-center justify-center font-medium" onClick={() => updateCartQty(i.productId, -1)}>−</button>
                                    <span className="w-9 text-center font-semibold">{i.quantity}</span>
                                    <button type="button" className="w-8 h-8 rounded-lg border border-white-dark/20 hover:bg-white-dark/10 flex items-center justify-center font-medium" onClick={() => updateCartQty(i.productId, 1)}>+</button>
                                    <button type="button" className="w-8 h-8 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 flex items-center justify-center" onClick={() => removeFromCart(i.productId)}>×</button>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && <div className="text-center py-8 text-gray-500"><p>{t('pos_cart_empty')}</p><p className="text-sm mt-1">{t('pos_cart_add_hint')}</p></div>}
                    </div>
                    <div className="space-y-4 mt-4 pt-4 border-t border-white-dark/10">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('pos_customer')}</label>
                            <div className="flex gap-2 mb-2">
                                <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-medium ${customerMode === 'walk-in' ? 'bg-primary-600 text-white' : 'bg-white-dark/10 dark:bg-white/5'}`} onClick={() => { setCustomerMode('walk-in'); setSelectedCustomer(null); setCustomerSearch(''); }}>{t('pos_walk_in')}</button>
                                <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-medium ${customerMode === 'customer' ? 'bg-primary-600 text-white' : 'bg-white-dark/10 dark:bg-white/5'}`} onClick={() => setCustomerMode('customer')}>{t('pos_registered')}</button>
                            </div>
                            {customerMode === 'walk-in' && (
                                <>
                                    <PosInput label={t('pos_name_optional')} placeholder={t('pos_customer_name_ph')} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                    <PosInput label={t('pos_cnic_optional')} placeholder={t('pos_cnic_account_hint')} value={walkInCnic} onChange={(e) => setWalkInCnic(e.target.value)} />
                                </>
                            )}
                            {customerMode === 'customer' && (
                                <>
                                    <input type="text" className="form-input w-full rounded-lg mb-1" placeholder={t('pos_search_customer_ph')} value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
                                    {customerSearching && <p className="text-xs text-gray-500">{t('pos_searching')}</p>}
                                    {!customerSearching && customerSearch.trim() && (
                                        <div className="max-h-32 overflow-y-auto border border-white-dark/10 rounded-lg mt-1">
                                            {customerList.length === 0 ? <p className="p-2 text-sm text-gray-500">{t('pos_no_customer')}</p> : customerList.map((c) => (
                                                <button key={c._id} type="button" className={`w-full text-left px-3 py-2 text-sm border-b border-white-dark/5 last:border-0 hover:bg-primary-50 dark:hover:bg-primary-900/20 ${selectedCustomer?._id === c._id ? 'bg-primary-100 dark:bg-primary-900/40' : ''}`} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerList([]); }}>{c.name}{c.cnic ? ` (${c.cnic})` : ''}</button>
                                            ))}
                                        </div>
                                    )}
                                    {selectedCustomer && <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">{t('pos_selected', { name: selectedCustomer.name })}</p>}
                                </>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('pos_discount')}</label>
                            <div className="flex gap-2 mb-1.5">
                                <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-medium ${discountType === 'fixed' ? 'bg-primary-600 text-white' : 'bg-white-dark/10 dark:bg-white/5'}`} onClick={() => setDiscountType('fixed')}>{t('pos_discount_fixed')}</button>
                                <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-medium ${discountType === 'percent' ? 'bg-primary-600 text-white' : 'bg-white-dark/10 dark:bg-white/5'}`} onClick={() => setDiscountType('percent')}>{t('pos_discount_percent')}</button>
                            </div>
                            {discountType === 'fixed' ? (
                                <input type="number" className="form-input w-full rounded-lg border border-white-dark/20" placeholder="0" value={overallDiscount || ''} onChange={(e) => setOverallDiscount(Number(e.target.value) || 0)} min={0} />
                            ) : (
                                <input type="number" className="form-input w-full rounded-lg border border-white-dark/20" placeholder="0" value={discountPercent || ''} onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)} min={0} max={100} />
                            )}
                            <p className="mt-1 text-xs text-gray-500">{discountType === 'fixed' ? t('pos_discount_hint_fixed') : t('pos_discount_hint_pct')}</p>
                        </div>
                        <PosSelect label={t('pos_payment_type')} value={paymentType} onChange={(e) => setPaymentType(e.target.value as any)} options={[{ value: 'cash', label: t('pos_pay_cash') }, { value: 'card', label: t('pos_pay_card') }, { value: 'credit', label: t('pos_pay_credit') }, { value: 'mix', label: t('pos_pay_mix') }]} />
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('pos_remarks_optional')}</label>
                            <input type="text" className="form-input w-full rounded-lg border border-white-dark/20" placeholder={t('pos_remarks_ph')} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t-2 border-white-dark/10 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>{t('pos_subtotal')}</span><span>Rs {subtotal.toLocaleString()}</span></div>
                        {discountAmt > 0 && <div className="flex justify-between text-sm text-amber-600"><span>{t('pos_discount_line')}</span><span>- Rs {discountAmt.toLocaleString()}</span></div>}
                        <div className="flex justify-between font-bold text-xl text-gray-800 dark:text-white pt-2"><span>{t('pos_total')}</span><span className="text-primary-600 dark:text-primary-400">Rs {grandTotal.toLocaleString()}</span></div>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary w-full mt-4 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition"
                        onClick={openConfirmModal}
                        disabled={saving || cart.length === 0}
                    >
                        {saving ? t('pos_completing') : t('pos_complete_sale')}
                    </button>
                </div>
            </div>

            {/* Confirm sale modal - product details & invoice before submit */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setShowConfirmModal(false)}>
                    <div className="bg-white dark:bg-[#0e1726] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-primary-500 to-primary-700 text-white px-6 py-4 flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold">{t('pos_confirm_sale')}</h3>
                            <button type="button" className="p-2 rounded-lg hover:bg-white/20" onClick={() => !saving && setShowConfirmModal(false)} aria-label="Close">×</button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('pos_confirm_sale_intro')}</p>
                            <div>
                                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">{t('pos_items')}</h4>
                                <div className="rounded-xl border border-white-dark/10 divide-y divide-white-dark/5 max-h-48 overflow-y-auto">
                                    {cart.map((i) => (
                                        <div key={i.productId} className="flex justify-between items-center py-2.5 px-3 text-sm">
                                            <span className="text-gray-800 dark:text-white">{i.name} × {i.quantity}</span>
                                            <span className="font-medium text-primary-600 dark:text-primary-400">Rs {i.lineTotal.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 space-y-1.5">
                                <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">{t('pos_subtotal')}</span><span>Rs {subtotal.toLocaleString()}</span></div>
                                {discountAmt > 0 && <div className="flex justify-between text-sm text-amber-600"><span>{t('pos_discount_line')}</span><span>- Rs {discountAmt.toLocaleString()}</span></div>}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t border-white-dark/10">
                                    <span className="text-gray-800 dark:text-white">{t('pos_total')}</span>
                                    <span className="text-primary-600 dark:text-primary-400">Rs {grandTotal.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p className="text-gray-500 dark:text-gray-400">{t('pos_customer')}</p>
                                <p className="font-medium">
                                    {customerMode === 'customer' && selectedCustomer ? selectedCustomer.name : (customerName.trim() || t('pos_walk_in_label'))}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400">{t('pos_payment')}</p>
                                <p className="font-medium capitalize">{paymentType === 'credit' ? t('pos_pay_credit') : paymentType}</p>
                                {remarks.trim() && (
                                    <>
                                        <p className="text-gray-500 dark:text-gray-400">{t('pos_remarks')}</p>
                                        <p className="font-medium">{remarks.trim()}</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="p-5 border-t border-white-dark/10 flex gap-3 shrink-0">
                            <button type="button" className="btn btn-outline-secondary flex-1 rounded-xl" onClick={() => setShowConfirmModal(false)} disabled={saving}>{t('pos_cancel_btn')}</button>
                            <button type="button" className="btn btn-primary flex-1 rounded-xl font-semibold" onClick={submitSaleAfterConfirm} disabled={saving}>
                                {saving ? t('pos_completing') : t('pos_confirm_complete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt modal */}
            {showReceipt && lastSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowReceipt(false)}>
                    <div className="bg-white dark:bg-[#0e1726] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden print:shadow-none print:bg-white" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold">{t('pos_sale_complete')}</h3>
                            <div className="flex gap-2">
                                <button type="button" className="btn btn-sm bg-white/20 hover:bg-white/30 text-white border-0 no-print" onClick={printReceipt}>{t('pos_print')}</button>
                                <button type="button" className="btn btn-sm bg-white/20 hover:bg-white/30 text-white border-0 no-print" onClick={() => setShowReceipt(false)}>{t('pos_close')}</button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p className="text-gray-500 dark:text-gray-400">{t('pos_invoice')}</p>
                                <p className="font-semibold">{lastSale.invoiceNumber}</p>
                                <p className="text-gray-500 dark:text-gray-400">{t('pos_date')}</p>
                                <p className="font-semibold">{new Date(lastSale.saleDate).toLocaleString()}</p>
                                <p className="text-gray-500 dark:text-gray-400">{t('pos_payment')}</p>
                                <p className="font-semibold capitalize">{lastSale.paymentType}</p>
                            </div>
                            <div className="border-t border-b border-white-dark/10 py-4 space-y-2">
                                {lastSale.items?.map((it: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span>{it.productName} × {it.quantity}</span>
                                        <span className="font-medium">Rs {it.lineTotal?.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2">
                                <span>{t('pos_total')}</span>
                                <span className="text-primary-600 dark:text-primary-400">Rs {lastSale.totalAmount?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PosSale;
