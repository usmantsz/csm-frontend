import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import axios from 'axios';
import { ServerSetting } from '../helperComponents/ServerSetting';
import { useAuthToken } from '../Hooks/useAuthToken';
import AgriculturalCard from '../components/Agricultural/AgriculturalCard';
import QuickActionButton from '../components/Agricultural/QuickActionButton';
import IconUser from '../components/Icon/IconUser';
import IconUsers from '../components/Icon/IconUsers';
import IconTag from '../components/Icon/IconTag';
import IconMenuDashboard from '../components/Icon/Menu/IconMenuDashboard';
import IconShoppingCart from '../components/Icon/IconShoppingCart';
import IconFile from '../components/Icon/IconFile';

// Exact Stitch dark-emerald palette (from tailwind.config in the Stitch export)
const card =
    'relative overflow-hidden rounded-2xl border border-gray-300 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:border-[#163345] dark:bg-[#09151f] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.45)] dark:hover:border-[#10b981]/40';
const iconBadge =
    'inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-gray-100 text-primary-700 dark:bg-[#0b1d28] dark:border dark:border-[#10b981]/30 dark:text-[#10b981] dark:shadow-inner dark:ring-0';
const sectionHeading = 'text-lg font-bold text-gray-900 dark:text-white tracking-tight';

function parseRes(res: any): any {
    const data = res?.data;
    if (!data) return null;
    if (data.success && data.data) return data.data;
    if (data.status === 200 && data.data) return data.data;
    return null;
}

function normalizeAdminOverview(raw: any): {
    totalShops: number;
    totalShopOwners: number;
    totalCustomers: number;
    totalCrops: number;
    totalDanaMandiOrders: number;
    totalVegetableOrders: number;
} {
    if (!raw || typeof raw !== 'object') {
        return {
            totalShops: 0,
            totalShopOwners: 0,
            totalCustomers: 0,
            totalCrops: 0,
            totalDanaMandiOrders: 0,
            totalVegetableOrders: 0,
        };
    }
    return {
        totalShops: Number(raw.totalShops) || 0,
        totalShopOwners: Number(raw.totalShopOwners) || 0,
        totalCustomers: Number(raw.totalCustomers) || 0,
        totalCrops: Number(raw.totalCrops) || 0,
        totalDanaMandiOrders: Number(raw.totalDanaMandiOrders) || 0,
        totalVegetableOrders: Number(raw.totalVegetableOrders) || 0,
    };
}

const AdminOverview = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const [overview, setOverview] = useState<ReturnType<typeof normalizeAdminOverview> | null>(null);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        dispatch(setPageTitle(t('admin_overview')));
    }, [dispatch, t]);

    useEffect(() => {
        if (!token) {
            setApiError(t('please_login_again'));
            return;
        }
        setApiError(null);
        setLoading(true);
        axios
            .post(
                `${ServerSetting.serUrl}/api/admin/overview`,
                {},
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            )
            .then((res) => {
                if (res.status === 403) {
                    setApiError(t('admin_access_required'));
                    setOverview(normalizeAdminOverview(null));
                    return;
                }
                if (res.status >= 400) {
                    setApiError(t('failed_to_load_overview_try'));
                    setOverview(normalizeAdminOverview(null));
                    return;
                }
                const data = parseRes(res);
                setOverview(normalizeAdminOverview(data));
            })
            .catch(() => {
                setApiError(t('failed_to_load_overview_connection'));
                setOverview(normalizeAdminOverview(null));
            })
            .finally(() => setLoading(false));
    }, [token, t]);

    return (
        <div className="min-h-full p-4 dark:bg-[#060d13]">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Overview banner + metrics grid — styled to match the Stitch mockup exactly */}
                <div className={card}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3.5 sm:items-center">
                            <span className={iconBadge}>
                                <IconMenuDashboard className="w-5 h-5" />
                            </span>
                            <div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h2 className={sectionHeading}>{t('admin_overview')}</h2>
                                    <span className="hidden dark:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#022c1c] text-[#10b981] border border-[#10b981]/20">
                                        Live Mandi Network
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{t('admin_summary_desc')}</p>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center text-xs font-medium text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-[#060d13] px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-[#163345] self-start sm:self-center">
                            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse mr-2"></span>
                            {loading ? 'Syncing…' : 'Data Sync: Just now'}
                        </div>
                    </div>

                    {apiError && (
                        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                            {apiError}
                        </div>
                    )}

                    <div className="mt-6 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                        <AgriculturalCard
                            title={t('total_shops')}
                            value={loading ? '…' : overview?.totalShops ?? 0}
                            icon={<IconFile className="w-6 h-6" />}
                            subtitle={t('registered_shops')}
                            color="primary"
                        />
                        <AgriculturalCard
                            title={t('shop_owners')}
                            value={loading ? '…' : overview?.totalShopOwners ?? 0}
                            icon={<IconUser className="w-6 h-6" />}
                            subtitle={t('users_with_shop')}
                            color="success"
                        />
                        <AgriculturalCard
                            title={t('total_customers')}
                            value={loading ? '…' : overview?.totalCustomers ?? 0}
                            icon={<IconUsers className="w-6 h-6" />}
                            subtitle={t('across_all_shops')}
                            color="info"
                        />
                        <AgriculturalCard
                            title={t('total_crops_card')}
                            value={loading ? '…' : overview?.totalCrops ?? 0}
                            icon={<IconTag className="w-6 h-6" />}
                            subtitle={t('crop_types')}
                            color="crop"
                        />
                        <AgriculturalCard
                            title={t('dana_mandi_orders')}
                            value={loading ? '…' : overview?.totalDanaMandiOrders ?? 0}
                            icon={<IconShoppingCart className="w-6 h-6" />}
                            subtitle={t('total_dana_mandi_receipts')}
                            color="warning"
                        />
                        <AgriculturalCard
                            title={t('sabzi_mandi_orders')}
                            value={loading ? '…' : overview?.totalVegetableOrders ?? 0}
                            icon={<IconShoppingCart className="w-6 h-6" />}
                            subtitle={t('total_sabzi_mandi_receipts')}
                            color="warning"
                        />
                    </div>
                </div>

                {/* Quick actions panel — same Stitch look */}
                <div className={card}>
                    <div className="flex items-center gap-3.5 pb-5 border-b border-gray-200 dark:border-[#163345]/70 mb-1">
                        <span className={`${iconBadge} h-9 w-9 rounded-lg`}>
                            <IconTag className="w-4 h-4" />
                        </span>
                        <div>
                            <h2 className={sectionHeading}>{t('quick_actions_title')}</h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                Direct shortcuts to critical mandi configurations and operational controls
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
                        <QuickActionButton to="/shop" icon={<IconFile className="w-6 h-6" />} label={t('shops_label')} description={t('manage_shops')} color="primary" />
                        <QuickActionButton to="/shopowner" icon={<IconUser className="w-6 h-6" />} label={t('shop_owners')} description={t('users_with_shop')} color="success" />
                        <QuickActionButton to="/viewallcrops" icon={<IconTag className="w-6 h-6" />} label={t('crops')} description={t('crop_list_assign')} color="info" />
                        <QuickActionButton to="/subcriptions" icon={<IconMenuDashboard className="w-6 h-6" />} label={t('subscriptions_title')} description={t('plans_and_history')} color="warning" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;