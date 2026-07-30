import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../store/themeConfigSlice';
import axios from 'axios';
import { ServerSetting } from '../helperComponents/ServerSetting';
import { useAuthToken } from '../Hooks/useAuthToken';
import { useUserPermissions } from '../Hooks/useUserPermissions';
import AgriculturalCard from '../components/Agricultural/AgriculturalCard';
import QuickActionButton from '../components/Agricultural/QuickActionButton';
import IconUser from '../components/Icon/IconUser';
import IconUsers from '../components/Icon/IconUsers';
import IconTag from '../components/Icon/IconTag';
import IconMenuDashboard from '../components/Icon/Menu/IconMenuDashboard';
import IconShoppingCart from '../components/Icon/IconShoppingCart';
import IconFile from '../components/Icon/IconFile';
import IconMenuChat from '../components/Icon/Menu/IconMenuChat';

// Shared style tokens so this page stays visually consistent with the rest
// of the app (see AdminOverview / Header / TableCard).
const card =
    'rounded-[2rem] border border-green-200 bg-white/95 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-green-800 dark:bg-[#0b1526]/85';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200';
const sectionHeading = 'text-lg font-semibold text-stone-900 dark:text-white';

function parseRes(res: any): any {
    const data = res?.data;
    if (!data) return null;
    if (data.success && data.data) return data.data;
    if (data.status === 200 && data.data) return data.data;
    return null;
}

function normalizeOverview(raw: any): {
    totalShops: number;
    totalShopOwners: number;
    totalCustomers: number;
    totalCrops: number;
    totalDanaMandiOrders: number;
    totalVegetableOrders: number;
} {
    if (!raw || typeof raw !== 'object') {
        return { totalShops: 0, totalShopOwners: 0, totalCustomers: 0, totalCrops: 0, totalDanaMandiOrders: 0, totalVegetableOrders: 0 };
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

const TeamMemberOverview = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const { canViewAdminDashboard, canViewTeam, canViewTickets, canViewShopOwners, canManageSubscriptions } = useUserPermissions();
    const [overview, setOverview] = useState<ReturnType<typeof normalizeOverview> | null>(null);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        dispatch(setPageTitle(t('team_member_dashboard_title')));
    }, [dispatch, t]);

    useEffect(() => {
        if (!canViewAdminDashboard || !token) return;
        setApiError(null);
        setLoading(true);
        axios
            .post(
                `${ServerSetting.serUrl}/api/admin/overview`,
                {},
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            )
            .then((res) => {
                if (res.status === 403 || res.status >= 400) {
                    setOverview(normalizeOverview(null));
                    return;
                }
                const data = parseRes(res);
                setOverview(normalizeOverview(data));
            })
            .catch(() => {
                setApiError(t('failed_to_load_overview'));
                setOverview(normalizeOverview(null));
            })
            .finally(() => setLoading(false));
    }, [token, canViewAdminDashboard, t]);

    const hasAnyPermission = canViewAdminDashboard || canViewTeam || canViewTickets || canViewShopOwners || canManageSubscriptions;

    return (
        <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-green-600/25 bg-green-600 shadow-[0_20px_50px_rgba(21,128,61,0.18)] transition-shadow hover:shadow-[0_24px_60px_rgba(21,128,61,0.24)]">
                <div className="flex flex-wrap items-center justify-between gap-4 p-6">
                    <div className="min-w-0 flex items-center gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur">
                            👥
                        </span>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{t('team_member_dashboard')}</h2>
                            <p className="text-sm text-green-100">{t('your_permitted_sections')}</p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-4xl opacity-90">
                        <span>📋</span><span>🎫</span>
                    </div>
                </div>
            </div>

            {!hasAnyPermission && (
                <div className={`${card} text-center`}>
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl dark:bg-amber-500/10">
                        ℹ️
                    </div>
                    <p className="text-stone-600 dark:text-stone-400">{t('no_permissions_contact_admin')}</p>
                </div>
            )}

            {canViewAdminDashboard && (
                <div className={card}>
                    <div className="mb-6 flex items-center gap-3">
                        <span className={iconBadge}>
                            <IconMenuDashboard className="w-5 h-5" />
                        </span>
                        <h5 className={sectionHeading}>{t('overview')}</h5>
                    </div>
                    {apiError && (
                        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                            {apiError}
                        </div>
                    )}
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        <AgriculturalCard title={t('total_shops')} value={loading ? '…' : (overview?.totalShops ?? 0)} icon={<IconFile className="w-6 h-6" />} subtitle={t('registered_shops')} color="primary" />
                        <AgriculturalCard title={t('shop_owners')} value={loading ? '…' : (overview?.totalShopOwners ?? 0)} icon={<IconUser className="w-6 h-6" />} subtitle={t('users_with_shop')} color="success" />
                        <AgriculturalCard title={t('total_customers')} value={loading ? '…' : (overview?.totalCustomers ?? 0)} icon={<IconUsers className="w-6 h-6" />} subtitle={t('across_all_shops')} color="info" />
                        <AgriculturalCard title={t('crops')} value={loading ? '…' : (overview?.totalCrops ?? 0)} icon={<IconTag className="w-6 h-6" />} subtitle={t('crop_types')} color="crop" />
                        <AgriculturalCard title={t('dana_mandi_orders')} value={loading ? '…' : (overview?.totalDanaMandiOrders ?? 0)} icon={<IconShoppingCart className="w-6 h-6" />} subtitle={t('total_dana_mandi_receipts')} color="warning" />
                        <AgriculturalCard title={t('sabzi_mandi_orders')} value={loading ? '…' : (overview?.totalVegetableOrders ?? 0)} icon={<IconShoppingCart className="w-6 h-6" />} subtitle={t('total_sabzi_mandi_receipts')} color="warning" />
                    </div>
                </div>
            )}

            <div className="rounded-[2rem] border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-green-800 dark:from-[#0b1526]/60 dark:to-green-900/10">
                <div className="mb-6 flex items-center gap-3">
                    <span className={iconBadge}>
                        <IconTag className="w-5 h-5" />
                    </span>
                    <h5 className={sectionHeading}>{t('quick_actions')}</h5>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {canViewTeam && (
                        <>
                            <QuickActionButton to="/admin/team" icon={<IconUsers className="w-6 h-6" />} label={t('team_members')} description={t('view_and_manage_team')} color="primary" />
                            <QuickActionButton to="/admin/team/add" icon={<IconUser className="w-6 h-6" />} label={t('add_team_member')} description={t('add_new_member')} color="success" />
                        </>
                    )}
                    {canViewShopOwners && (
                        <>
                            <QuickActionButton to="/shopowner" icon={<IconUser className="w-6 h-6" />} label={t('shop_owners')} description={t('all_shop_owners_short')} color="primary" />
                            <QuickActionButton to="/creatshopowner" icon={<IconUser className="w-6 h-6" />} label={t('create_shop_owner')} description={t('add_shop_owner_short')} color="success" />
                        </>
                    )}
                    {canManageSubscriptions && (
                        <QuickActionButton to="/subcriptions" icon={<IconMenuDashboard className="w-6 h-6" />} label={t('subscriptions')} description={t('plans_and_history')} color="warning" />
                    )}
                    {canViewTickets && (
                        <>
                            <QuickActionButton to="/support/new" icon={<IconMenuChat className="w-6 h-6" />} label={t('create_ticket')} description={t('new_support_ticket')} color="primary" />
                            <QuickActionButton to="/support" icon={<IconMenuChat className="w-6 h-6" />} label={t('my_tickets')} description={t('your_tickets')} color="success" />
                            <QuickActionButton to="/support/all" icon={<IconMenuChat className="w-6 h-6" />} label={t('all_tickets')} description={t('all_support_tickets')} color="primary" />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamMemberOverview;
