import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import IconUser from '../../components/Icon/IconUser';
import IconCashBanknotes from '../../components/Icon/IconCashBanknotes';
import IconTag from '../../components/Icon/IconTag';
import IconFile from '../../components/Icon/IconFile';
import IconMenu from '../../components/Icon/IconMenu';
import IconX from '../../components/Icon/IconX';

const CUSTOMER_API = `${ServerSetting.serUrl}/api/customer`;

type ShopItem = { shopId: string; customerId: string; shopName: string; shopNumber?: string; shopAddress?: string; shopCity?: string };
type CropItem = { _id: string; cropName?: string; cropImage?: string };
type DashboardData = {
    shopId: string;
    customerId: string;
    balance: { receivable: number; payable: number };
    loans: { total: number; paid: number; outstanding: number; count: number };
    ordersCount: number;
    crops: CropItem[];
};
type ProfileData = {
    _id: string;
    customerId?: string;
    cusNameF?: string;
    cusNameL?: string;
    cusNumber?: string;
    cusCNIC?: string;
    cusAddress?: string;
};
type LoanItem = {
    _id: string;
    loanAmount: number;
    loanPaidAmount: number;
    outstanding: number;
    finaceRemarks?: string;
    finaceCropId?: { _id?: string; cropName?: string } | string;
    createdAt?: string;
};
type OrderItem = {
    _id: string;
    vegetableOrderCropId?: { _id?: string; cropName?: string } | string;
    totalPrice?: number;
    totalPisces?: number;
    pricePisce?: number;
    commissioneTotal?: number;
    retrunPayment?: number;
    afterRetrunPayemnt?: number;
    createdAt?: string;
};

const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || (() => {
        try {
            const u = localStorage.getItem('userInformation');
            return u ? JSON.parse(u)?.token : null;
        } catch { return null; }
    })();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatRs = (n: number) => 'Rs. ' + (n ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatDate = (d: string | undefined) => d ? new Date(d).toLocaleDateString('en-PK', { dateStyle: 'short' }) : '';

function getCropIdFromRef(ref: LoanItem['finaceCropId'] | OrderItem['vegetableOrderCropId']): string | null {
    if (!ref) return null;
    if (typeof ref === 'string') return ref;
    return (ref as { _id?: string })._id ?? null;
}

function getCropNameFromRef(ref: LoanItem['finaceCropId'] | OrderItem['vegetableOrderCropId']): string {
    if (!ref) return '–';
    if (typeof ref === 'string') return ref;
    return (ref as { cropName?: string }).cropName || '–';
}

const CustomerOverview = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [shops, setShops] = useState<ShopItem[]>([]);
    const [selectedShop, setSelectedShop] = useState<ShopItem | null>(null);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loans, setLoans] = useState<LoanItem[]>([]);
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loadingShops, setLoadingShops] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
    const [dataError, setDataError] = useState<string | null>(null);

    useEffect(() => {
        dispatch(setPageTitle(t('customer_dashboard')));
    }, [dispatch, t]);

    useEffect(() => {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
        setLoadingShops(true);
        axios
            .post(`${CUSTOMER_API}/shops`, {}, { headers, validateStatus: () => true })
            .then((res) => {
                const data = res.data?.data;
                if (Array.isArray(data) && data.length > 0) {
                    setShops(data);
                    if (!selectedShop && data[0]) setSelectedShop(data[0]);
                } else {
                    setShops([]);
                    setSelectedShop(null);
                }
            })
            .catch(() => setShops([]))
            .finally(() => setLoadingShops(false));
    }, []);

    useEffect(() => {
        if (!selectedShop?.shopId) {
            setDashboard(null);
            setProfile(null);
            setLoans([]);
            setOrders([]);
            setSelectedCropId(null);
            setDataError(null);
            return;
        }
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
        setLoadingData(true);
        setSelectedCropId(null);
        setDataError(null);
        const shopId = selectedShop.shopId;
        const body = { shopId };

        Promise.all([
            axios.post(`${CUSTOMER_API}/dashboard`, body, { headers, validateStatus: () => true }),
            axios.post(`${CUSTOMER_API}/profile`, body, { headers, validateStatus: () => true }),
            axios.post(`${CUSTOMER_API}/loans`, body, { headers, validateStatus: () => true }).then(r => r.data?.data || []),
            axios.post(`${CUSTOMER_API}/orders`, { ...body, limit: 100 }, { headers, validateStatus: () => true }).then(r => r.data?.data || []),
        ])
            .then(([dashRes, profileRes, loansData, ordersData]) => {
                if (dashRes.data?.status === 200 && dashRes.data?.data) {
                    setDashboard(dashRes.data.data);
                    setDataError(null);
                } else {
                    setDashboard(null);
                    setDataError(dashRes.data?.message || t('not_registered_this_shop'));
                }
                if (profileRes.data?.status === 200 && profileRes.data?.data) setProfile(profileRes.data.data);
                else setProfile(null);
                setLoans(Array.isArray(loansData) ? loansData : []);
                setOrders(Array.isArray(ordersData) ? ordersData : []);
            })
            .catch(() => {
                setDashboard(null);
                setProfile(null);
                setLoans([]);
                setOrders([]);
                setDataError(t('failed_to_load_data'));
            })
            .finally(() => setLoadingData(false));
    }, [selectedShop?.shopId]);

    const filteredLoans = selectedCropId
        ? loans.filter((l) => getCropIdFromRef(l.finaceCropId) === selectedCropId)
        : loans;
    const filteredOrders = selectedCropId
        ? orders.filter((o) => getCropIdFromRef(o.vegetableOrderCropId) === selectedCropId)
        : orders;
    const selectedCropName = selectedCropId && dashboard?.crops?.find((c) => c._id === selectedCropId)?.cropName;

    if (loadingShops) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="animate-spin border-4 border-primary-600 border-t-transparent rounded-full w-12 h-12 inline-block mb-4" />
                <p className="text-stone-600 dark:text-stone-400">{t('loading_your_shops')}</p>
            </div>
        );
    }

    if (shops.length === 0) {
        return (
            <div className="rounded-2xl bg-white dark:bg-white/5 p-8 text-center shadow-lg shadow-black/10 dark:shadow-none">
                <p className="text-stone-700 dark:text-stone-300 font-medium">{t('no_shop_found')}</p>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">{t('not_registered_any_shop')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ul className="flex flex-wrap items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                <li><span className="text-primary-600 dark:text-primary-400 font-medium">{t('dashboard')}</span></li>
            </ul>
            {dataError && selectedShop && (
                <div className="rounded-2xl border-2 border-danger/30 bg-danger/5 dark:bg-danger/10 text-danger px-4 py-3 shadow-lg shadow-black/10 dark:shadow-none">
                    {dataError}
                </div>
            )}

            {/* Shop selector */}
            <div className="rounded-2xl bg-white dark:bg-white/5 p-6 shadow-lg shadow-black/10 dark:shadow-none">
                <h5 className="font-semibold text-lg mb-4 flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <IconMenu className="w-5 h-5 shrink-0" />
                    {t('select_shop')}
                </h5>
                <div className="flex flex-wrap gap-3">
                    {shops.map((shop) => (
                        <button
                            key={shop.shopId}
                            type="button"
                            onClick={() => setSelectedShop(shop)}
                            className={`min-w-0 max-w-full px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 ${
                                selectedShop?.shopId === shop.shopId
                                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300'
                                    : 'border-primary-200 dark:border-white/10 hover:border-primary-500/50'
                            }`}
                        >
                            <span className="font-semibold block truncate">{shop.shopName}</span>
                            {shop.shopNumber && <span className="text-sm text-stone-500 dark:text-stone-400">#{shop.shopNumber}</span>}
                            {shop.shopCity && <span className="text-sm text-stone-500 dark:text-stone-400 ml-1">• {shop.shopCity}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {!selectedShop ? null : loadingData ? (
                <div className="rounded-2xl bg-white dark:bg-white/5 p-12 shadow-lg shadow-black/10 dark:shadow-none flex flex-col items-center justify-center">
                    <span className="animate-spin border-4 border-primary-600 border-t-transparent rounded-full w-10 h-10 inline-block mb-3" />
                    <p className="text-stone-600 dark:text-stone-400">{t('loading_data_for')} {selectedShop.shopName}…</p>
                </div>
            ) : (
                <>
                    {/* Overview cards */}
                    {dashboard && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="rounded-2xl bg-white dark:bg-white/5 p-5 shadow-lg shadow-black/10 dark:shadow-none transition-transform duration-200 hover:-translate-y-0.5">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-12 shadow-gray-500/40 shadow-lg dark:shadow-none h-12 shrink-0 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                        <IconCashBanknotes className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-stone-600 dark:text-stone-400">{t('pay_to_shop_owner')}</p>
                                        <p className="text-xl font-bold text-primary-600 dark:text-primary-400 truncate">{formatRs(dashboard.balance.receivable)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-white dark:bg-white/5 p-5 shadow-lg shadow-black/10 dark:shadow-none transition-transform duration-200 hover:-translate-y-0.5">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-12 h-12 shadow-gray-500/40 shadow-lg dark:shadow-none shrink-0 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                        <IconTag className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-stone-600 dark:text-stone-400">{t('shop_owner_will_pay_you')}</p>
                                        <p className="text-xl font-bold text-primary-600 dark:text-primary-400 truncate">{formatRs(dashboard.balance.payable)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border-2 border-warning/30 bg-warning/5 dark:bg-warning/10 p-5 shadow-lg shadow-black/10 dark:shadow-none transition-transform duration-200 hover:-translate-y-0.5">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-12 h-12 shadow-gray-500/40 shadow-lg dark:shadow-none shrink-0 rounded-xl bg-warning/15 flex items-center justify-center">
                                        <IconFile className="w-6 h-6 text-warning" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-stone-600 dark:text-stone-400">{t('loans_outstanding')}</p>
                                        <p className="text-xl font-bold text-warning truncate">{formatRs(dashboard.loans.outstanding)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-white dark:bg-white/5 p-5 shadow-lg shadow-black/10 dark:shadow-none transition-transform duration-200 hover:-translate-y-0.5">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-12 h-12 shadow-gray-500/40 shadow-lg dark:shadow-none shrink-0 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                        <IconMenu className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-stone-600 dark:text-stone-400">{t('vegetable_orders')}</p>
                                        <p className="text-xl font-bold text-stone-800 dark:text-stone-200">{dashboard.ordersCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profile (view only) */}
                    {profile && (
                        <div className="rounded-2xl bg-white dark:bg-white/5 p-6 shadow-lg shadow-black/10 dark:shadow-none">
                            <h5 className="font-semibold  text-lg mb-4 flex items-center gap-2 text-stone-900 dark:text-white">
                                <IconUser className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
                                {t('profile')} – {selectedShop.shopName}
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <p className="break-words"><span className="text-stone-500 dark:text-stone-400">{t('name')}:</span> <span className="font-medium">{profile.cusNameF} {profile.cusNameL}</span></p>
                                <p className="break-words"><span className="text-stone-500 dark:text-stone-400">{t('phone')}:</span> <span className="font-medium">{profile.cusNumber || '–'}</span></p>
                                <p className="break-words"><span className="text-stone-500 dark:text-stone-400">{t('cnic')}:</span> <span className="font-medium">{profile.cusCNIC || '–'}</span></p>
                                <p className="sm:col-span-2 break-words"><span className="text-stone-500 dark:text-stone-400">{t('address')}:</span> <span className="font-medium">{profile.cusAddress || '–'}</span></p>
                            </div>
                        </div>
                    )}

                    {/* Crops in this shop – clickable */}
                    {dashboard?.crops && dashboard.crops.length > 0 && (
                        <div className="rounded-2xl bg-white dark:bg-white/5 p-6 shadow-lg shadow-black/10 dark:shadow-none">
                            <h5 className="font-semibold text-lg mb-3 text-stone-900 dark:text-white">{t('crops_in_shop_hint')}</h5>
                            <div className="flex flex-wrap gap-2">
                                {dashboard.crops.map((c) => {
                                    const isSelected = selectedCropId === c._id;
                                    return (
                                        <button
                                            key={c._id}
                                            type="button"
                                            onClick={() => setSelectedCropId(isSelected ? null : c._id)}
                                            className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-200 max-w-full truncate ${
                                                isSelected
                                                    ? 'border-primary-600 bg-primary-600 text-white'
                                                    : 'border-primary-200 dark:border-white/10 bg-primary-50/40 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300 hover:border-primary-500/50'
                                            }`}
                                        >
                                            {c.cropName || c._id}
                                        </button>
                                    );
                                })}
                                {selectedCropId && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCropId(null)}
                                        className="px-4 py-2  rounded-xl border-2 border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 text-sm flex items-center gap-1 shrink-0"
                                    >

                                        <IconX className="w-4 h-4 shadow-gray-500/40 shadow-lg" /> {t('clear_filter')}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* When crop selected: show orders & loans for that crop */}
                    {selectedCropId && selectedCropName && (
                        <div className="rounded-2xl bg-primary-50/40 dark:bg-primary-900/10 p-6 shadow-lg shadow-black/10 dark:shadow-none">
                            <h5 className="font-semibold text-lg mb-4 text-primary-600 dark:text-primary-400 truncate">
                                {t('orders_and_loans_for')}: {selectedCropName}
                            </h5>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="min-w-0">
                                    <h6 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">{t('orders')} ({filteredOrders.length})</h6>
                                    {filteredOrders.length === 0 ? (
                                        <p className="text-stone-500 dark:text-stone-400 text-sm">{t('no_orders_for_crop')}</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="table-auto w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-primary-200 dark:border-white/10">
                                                        <th className="text-left py-2">{t('date')}</th>
                                                        <th className="text-right py-2">{t('pcs')}</th>
                                                        <th className="text-right py-2">{t('total')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredOrders.map((o) => (
                                                        <tr key={o._id} className="border-b border-primary-100 dark:border-white/5">
                                                            <td className="py-2">{formatDate(o.createdAt)}</td>
                                                            <td className="text-right">{o.totalPisces ?? '–'}</td>
                                                            <td className="text-right font-medium">{formatRs(o.totalPrice ?? 0)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h6 className="text-sm font-medium text-warning mb-2">{t('loans')} ({filteredLoans.length})</h6>
                                    {filteredLoans.length === 0 ? (
                                        <p className="text-stone-500 dark:text-stone-400 text-sm">{t('no_loans_for_crop')}</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="table-auto w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-primary-200 dark:border-white/10">
                                                        <th className="text-left py-2">{t('date')}</th>
                                                        <th className="text-right py-2">{t('amount')}</th>
                                                        <th className="text-right py-2">{t('paid')}</th>
                                                        <th className="text-right py-2">{t('outstanding')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredLoans.map((l) => (
                                                        <tr key={l._id} className="border-b border-primary-100 dark:border-white/5">
                                                            <td className="py-2">{formatDate(l.createdAt)}</td>
                                                            <td className="text-right">{formatRs(l.loanAmount)}</td>
                                                            <td className="text-right">{formatRs(l.loanPaidAmount)}</td>
                                                            <td className="text-right font-medium">{formatRs(l.outstanding)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Full Loan List */}
                    <div className="rounded-2xl bg-white dark:bg-white/5 p-6 shadow-lg shadow-black/10 dark:shadow-none">
                        <h5 className="font-semibold text-lg mb-4 flex items-center gap-2 text-warning">
                            <IconFile className="w-5 h-5 shrink-0" />
                            <span className="truncate">{t('loan_list')} {selectedCropId ? `(${t('filtered_by')} ${selectedCropName})` : ''}</span>
                        </h5>
                        {loans.length === 0 ? (
                            <p className="text-stone-500 dark:text-stone-400 text-sm">{t('no_loans_in_shop')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table-auto w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-primary-200 dark:border-white/10">
                                            <th className="text-left py-2">{t('crop')}</th>
                                            <th className="text-left py-2">{t('date')}</th>
                                            <th className="text-right py-2">{t('amount')}</th>
                                            <th className="text-right py-2">{t('paid')}</th>
                                            <th className="text-right py-2">{t('outstanding')}</th>
                                            <th className="text-left py-2">{t('remarks')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLoans.map((l) => (
                                            <tr key={l._id} className="border-b border-primary-100 dark:border-white/5 hover:bg-primary-50/50 dark:hover:bg-white/[0.03]">
                                                <td className="py-2">{getCropNameFromRef(l.finaceCropId)}</td>
                                                <td className="py-2">{formatDate(l.createdAt)}</td>
                                                <td className="text-right">{formatRs(l.loanAmount)}</td>
                                                <td className="text-right">{formatRs(l.loanPaidAmount)}</td>
                                                <td className="text-right font-medium">{formatRs(l.outstanding)}</td>
                                                <td className="py-2 text-stone-600 dark:text-stone-400 max-w-[160px] truncate" title={l.finaceRemarks}>{l.finaceRemarks || '–'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Full Order List (Vegetable / Crop orders) */}
                    <div className="rounded-2xl bg-white dark:bg-white/5 p-6 shadow-lg shadow-black/10 dark:shadow-none">
                        <h5 className="font-semibold text-lg mb-4 flex items-center gap-2 text-primary-600 dark:text-primary-400">
                            <IconMenu className="w-5 h-5 shrink-0" />
                            <span className="truncate">{t('vegetable_crop_order_list')} {selectedCropId ? `(${t('filtered_by')} ${selectedCropName})` : ''}</span>
                        </h5>
                        {orders.length === 0 ? (
                            <p className="text-stone-500 dark:text-stone-400 text-sm">{t('no_orders_in_shop')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table-auto w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-primary-200 dark:border-white/10">
                                            <th className="text-left py-2">{t('crop')}</th>
                                            <th className="text-left py-2">{t('date')}</th>
                                            <th className="text-right py-2">{t('pcs')}</th>
                                            <th className="text-right py-2">{t('price_per_pc')}</th>
                                            <th className="text-right py-2">{t('total')}</th>
                                            <th className="text-right py-2">{t('commission')}</th>
                                            <th className="text-right py-2">{t('return')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map((o) => (
                                            <tr key={o._id} className="border-b border-primary-100 dark:border-white/5 hover:bg-primary-50/50 dark:hover:bg-white/[0.03]">
                                                <td className="py-2">{getCropNameFromRef(o.vegetableOrderCropId)}</td>
                                                <td className="py-2">{formatDate(o.createdAt)}</td>
                                                <td className="text-right">{o.totalPisces ?? '–'}</td>
                                                <td className="text-right">{formatRs(o.pricePisce ?? 0)}</td>
                                                <td className="text-right font-medium">{formatRs(o.totalPrice ?? 0)}</td>
                                                <td className="text-right">{formatRs(o.commissioneTotal ?? 0)}</td>
                                                <td className="text-right">{formatRs(o.retrunPayment ?? 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default CustomerOverview;
