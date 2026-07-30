import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

type SaleItem = {
    productId: string | { _id: string };
    productName: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    lineTotal: number;
};

type PosCustomer = { _id: string; name: string; cnic?: string; phone?: string };

const PosSaleEdit = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
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
    const [remarks, setRemarks] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        dispatch(setPageTitle(t('pos_edit_invoice_title')));
    }, [dispatch, t, i18n.language]);

    const fetchSaleAndProducts = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token || !id) return;
        setLoading(true);
        setLoadError('');
        Promise.all([
            axios.get(`${ServerSetting.apiUrl}/pos/sales/${id}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
            axios.get(`${ServerSetting.apiUrl}/pos/products?limit=200`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
        ])
            .then(([saleRes, productsRes]) => {
                if (saleRes.data?.data) {
                    const sale = saleRes.data.data;
                    if (sale.returns && sale.returns.length > 0) {
                        setLoadError('This invoice has returns. It cannot be edited.');
                        setLoading(false);
                        return;
                    }
                    setInvoiceNumber(sale.invoiceNumber || '');
                    setCustomerName(sale.customerName || '');
                    setPaymentType((sale.paymentType || 'cash') as 'cash' | 'card' | 'credit' | 'mix');
                    setOverallDiscount(sale.discountAmount || 0);
                    setRemarks((sale as any).remarks || '');
                    if ((sale as any).posCustomerId) {
                        setCustomerMode('customer');
                        setSelectedCustomer({ _id: (sale as any).posCustomerId, name: sale.customerName || '' });
                        setCustomerSearch(sale.customerName || '');
                    } else {
                        setCustomerMode('walk-in');
                        setSelectedCustomer(null);
                        setWalkInCnic('');
                    }
                    const items: SaleItem[] = sale.items || [];
                    const productList = productsRes.data?.data || [];
                    setProducts(productList);
                    const productMap: Record<string, Product> = {};
                    productList.forEach((p: Product) => { productMap[p._id] = p; });
                    const cartItems: CartItem[] = items.map((it: SaleItem) => {
                        const pid = typeof it.productId === 'object' ? (it.productId as any)?._id : it.productId;
                        const p = productMap[pid];
                        const stock = (p?.stock ?? 0) + (it.quantity || 0);
                        return {
                            productId: pid,
                            name: it.productName || p?.name || '',
                            unitPrice: it.unitPrice || 0,
                            quantity: it.quantity || 0,
                            discountAmount: it.discountAmount || 0,
                            lineTotal: it.lineTotal || 0,
                            stock,
                        };
                    });
                    setCart(cartItems);
                } else {
                    setLoadError('Invoice not found.');
                }
            })
            .catch(() => setLoadError('Failed to load invoice.'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        fetchSaleAndProducts();
    }, [fetchSaleAndProducts]);

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

    const getEffectiveStock = (p: Product) => {
        const inCart = cart.find((c) => c.productId === p._id);
        return p.stock + (inCart?.quantity || 0);
    };

    const filteredProducts = products.filter(
        (p) =>
            getEffectiveStock(p) > 0 &&
            (search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || (p.code || '').toLowerCase().includes(search.toLowerCase()))
    );

    const addToCart = (p: Product, qty: number = 1) => {
        const effective = getEffectiveStock(p);
        if (effective < qty) {
            Notification({ text: `Only ${effective} available for this invoice`, color: 'warning' });
            return;
        }
        setCart((prev) => {
            const existing = prev.find((x) => x.productId === p._id);
            const newQty = (existing ? existing.quantity : 0) + qty;
            if (newQty > effective) return prev;
            const lineTotal = Math.round((newQty * p.price - (existing?.discountAmount || 0)) * 100) / 100;
            if (existing) {
                return prev.map((x) =>
                    x.productId === p._id ? { ...x, quantity: newQty, lineTotal: Math.round(newQty * x.unitPrice * 100) / 100 } : x
                );
            }
            return [...prev, { productId: p._id, name: p.name, unitPrice: p.price, quantity: newQty, discountAmount: 0, lineTotal: Math.round(newQty * p.price * 100) / 100, stock: p.stock }];
        });
    };

    const updateCartQty = (productId: string, delta: number) => {
        setCart((prev) => {
            const item = prev.find((x) => x.productId === productId);
            if (!item) return prev;
            const newQty = Math.max(0, item.quantity + delta);
            if (newQty === 0) return prev.filter((x) => x.productId !== productId);
            const lineTotal = Math.round((newQty * item.unitPrice - item.discountAmount) * 100) / 100;
            return prev.map((x) => (x.productId === productId ? { ...x, quantity: newQty, lineTotal } : x));
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((x) => x.productId !== productId));
    };

    const subtotal = cart.reduce((s, i) => s + i.lineTotal, 0);
    const discountAmt =
        discountType === 'percent' ? Math.round((subtotal * Math.min(100, Math.max(0, discountPercent)) / 100) * 100) / 100 : Math.max(0, Number(overallDiscount) || 0);
    const grandTotal = Math.round((subtotal - discountAmt) * 100) / 100;

    const saveInvoice = () => {
        if (cart.length === 0) {
            Notification({ text: 'Add at least one item', color: 'warning' });
            return;
        }
        const token = localStorage.getItem('token');
        if (!token || !id) return;
        setSaving(true);
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
        axios
            .put(`${ServerSetting.apiUrl}/pos/sales/${id}`, payload, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((r) => {
                if (r.data?.data) {
                    Notification({ text: 'Invoice updated successfully', color: 'success' });
                    navigate(`/pos/receipt/${id}`);
                } else {
                    Notification({ text: r.data?.message || 'Update failed', color: 'danger' });
                }
            })
            .catch((e) => {
                Notification({ text: e.response?.data?.message || e.message || 'Update failed', color: 'danger' });
            })
            .finally(() => setSaving(false));
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <span className="animate-spin inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="panel p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">{loadError}</p>
                <button type="button" className="btn btn-outline-primary mt-4" onClick={() => navigate('/pos/sales-history')}>
                    Back to Sales History
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <PageHeader
                title={t('pos_edit_invoice_title')}
                description={invoiceNumber ? t('pos_edit_invoice_desc_num', { num: invoiceNumber }) : t('pos_edit_invoice_desc')}
                backTo="/pos/sales-history"
                backLabel={t('pos_back_sales_history')}
                icon={<span>✏️</span>}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 panel p-5 rounded-2xl border border-white-dark/10 shadow-sm dark:border-white/5">
                    <PosInput label={t('pos_search_products')} placeholder={t('pos_search_products_ph')} value={search} onChange={(e) => setSearch(e.target.value)} wrapperClass="mb-4" />
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
                                <p className="text-xs text-gray-400 mt-1">Available: {getEffectiveStock(p)}</p>
                            </button>
                        ))}
                        {filteredProducts.length === 0 && <p className="col-span-full text-center text-gray-500 py-8">No products found</p>}
                    </div>
                </div>

                <div className="panel p-5 rounded-2xl border border-white-dark/10 shadow-sm dark:border-white/5 flex flex-col">
                    <h2 className="font-bold text-lg text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-bold">{cart.length}</span>
                        Cart
                    </h2>
                    <div className="flex-1 overflow-y-auto min-h-[180px] max-h-[38vh] space-y-2">
                        {cart.map((i) => (
                            <div key={i.productId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-white-dark/10">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 dark:text-white truncate">{i.name}</p>
                                    <p className="text-sm text-gray-500">
                                        Rs {i.unitPrice.toLocaleString()} × {i.quantity} = <span className="font-medium text-primary-600">Rs {i.lineTotal.toLocaleString()}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button type="button" className="w-8 h-8 rounded-lg border border-white-dark/20 hover:bg-white-dark/10 flex items-center justify-center font-medium" onClick={() => updateCartQty(i.productId, -1)}>−</button>
                                    <span className="w-9 text-center font-semibold">{i.quantity}</span>
                                    <button type="button" className="w-8 h-8 rounded-lg border border-white-dark/20 hover:bg-white-dark/10 flex items-center justify-center font-medium" onClick={() => updateCartQty(i.productId, 1)}>+</button>
                                    <button type="button" className="w-8 h-8 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 flex items-center justify-center" onClick={() => removeFromCart(i.productId)}>×</button>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>Cart is empty</p>
                                <p className="text-sm mt-1">Add products from the list</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-4 mt-4 pt-4 border-t border-white-dark/10">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Customer</label>
                            <div className="flex gap-2 mb-2">
                                <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-medium ${customerMode === 'walk-in' ? 'bg-primary-600 text-white' : 'bg-white-dark/10 dark:bg-white/5'}`} onClick={() => { setCustomerMode('walk-in'); setSelectedCustomer(null); setCustomerSearch(''); }}>Walk-in</button>
                                <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-medium ${customerMode === 'customer' ? 'bg-primary-600 text-white' : 'bg-white-dark/10 dark:bg-white/5'}`} onClick={() => setCustomerMode('customer')}>Registered</button>
                            </div>
                            {customerMode === 'walk-in' && (
                                <>
                                    <PosInput label="Name (optional)" placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                    <PosInput label="CNIC (optional)" placeholder="Add to customer account" value={walkInCnic} onChange={(e) => setWalkInCnic(e.target.value)} />
                                </>
                            )}
                            {customerMode === 'customer' && (
                                <>
                                    <input type="text" className="form-input w-full rounded-lg mb-1" placeholder="Search by name or CNIC..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
                                    {customerSearching && <p className="text-xs text-gray-500">Searching...</p>}
                                    {!customerSearching && customerSearch.trim() && (
                                        <div className="max-h-32 overflow-y-auto border border-white-dark/10 rounded-lg mt-1">
                                            {customerList.length === 0 ? <p className="p-2 text-sm text-gray-500">No customer found</p> : customerList.map((c) => (
                                                <button key={c._id} type="button" className={`w-full text-left px-3 py-2 text-sm border-b border-white-dark/5 last:border-0 hover:bg-primary-50 dark:hover:bg-primary-900/20 ${selectedCustomer?._id === c._id ? 'bg-primary-100 dark:bg-primary-900/40' : ''}`} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerList([]); }}>{c.name}{c.cnic ? ` (${c.cnic})` : ''}</button>
                                            ))}
                                        </div>
                                    )}
                                    {selectedCustomer && <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">Selected: {selectedCustomer.name}</p>}
                                </>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Discount</label>
                            <div className="flex gap-2 mb-1.5">
                                <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-medium ${discountType === 'fixed' ? 'bg-primary-600 text-white' : 'bg-white-dark/10 dark:bg-white/5'}`} onClick={() => setDiscountType('fixed')}>Fixed (Rs)</button>
                                <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-medium ${discountType === 'percent' ? 'bg-primary-600 text-white' : 'bg-white-dark/10 dark:bg-white/5'}`} onClick={() => setDiscountType('percent')}>Percent (%)</button>
                            </div>
                            {discountType === 'fixed' ? (
                                <input type="number" className="form-input w-full rounded-lg border border-white-dark/20" placeholder="0" value={overallDiscount || ''} onChange={(e) => setOverallDiscount(Number(e.target.value) || 0)} min={0} />
                            ) : (
                                <input type="number" className="form-input w-full rounded-lg border border-white-dark/20" placeholder="0" value={discountPercent || ''} onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)} min={0} max={100} />
                            )}
                        </div>
                        <PosSelect label="Payment type" value={paymentType} onChange={(e) => setPaymentType(e.target.value as any)} options={[{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }, { value: 'credit', label: 'Pay later (Credit)' }, { value: 'mix', label: 'Mix' }]} />
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Remarks (optional)</label>
                            <input type="text" className="form-input w-full rounded-lg border border-white-dark/20" placeholder="Notes or remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t-2 border-white-dark/10 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>Rs {subtotal.toLocaleString()}</span></div>
                        {discountAmt > 0 && <div className="flex justify-between text-sm text-amber-600"><span>Discount</span><span>- Rs {discountAmt.toLocaleString()}</span></div>}
                        <div className="flex justify-between font-bold text-xl text-gray-800 dark:text-white pt-2"><span>Total</span><span className="text-primary-600 dark:text-primary-400">Rs {grandTotal.toLocaleString()}</span></div>
                    </div>
                    <button type="button" className="btn btn-primary w-full mt-4 py-3 rounded-xl font-semibold" onClick={saveInvoice} disabled={saving || cart.length === 0}>
                        {saving ? 'Saving...' : 'Save Invoice'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PosSaleEdit;
