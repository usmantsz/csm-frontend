import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import IconPencilPaper from '../../components/Icon/IconPencilPaper';
import IconCoffee from '../../components/Icon/IconCoffee';
import IconCalendar from '../../components/Icon/IconCalendar';
import IconMapPin from '../../components/Icon/IconMapPin';
import IconMail from '../../components/Icon/IconMail';
import IconPhone from '../../components/Icon/IconPhone';
import IconMenuInvoice from '../../components/Icon/Menu/IconMenuInvoice';
import IconClock from '../../components/Icon/IconClock';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { ChangePasswordCard } from '../../components/Account/ChangePasswordCard';

function formatAddress(u: Record<string, unknown>, notSetLabel: string): string {
    const line = (u?.userAdress ?? u?.userAddress) as string | undefined;
    const city = u?.userCity as string | undefined;
    const province = u?.userProvince as string | undefined;
    const parts = [line, city, province].filter((p) => p != null && String(p).trim() !== '');
    return parts.length ? parts.join(', ') : notSetLabel;
}

// Role labels now come from i18n instead of being hardcoded in English.
function roleLabel(role: unknown, t: (key: string) => string): string {
    const r = String(role ?? '');
    if (r === '0') return t('role_administrator');
    if (r === '1') return t('role_shop_owner');
    if (r === '2') return t('role_sub_administrator');
    if (r === '3') return t('team_member_role');
    if (r === 'customer') return t('role_customer');
    return t('role_user');
}

// Tries multiple common field-naming conventions so this works whether the
// logged-in account is an Admin, Team Member, Shop Owner, or Customer —
// different portals/backends sometimes store the display name under
// different keys (userNameF/userNameL, fullName, name, customerName, etc).
function getDisplayName(u: Record<string, any> | null | undefined): string {
    if (!u) return '';

    const f = (u.userNameF as string) || (u.customerNameF as string) || (u.nameF as string) || '';
    const l = (u.userNameL as string) || (u.customerNameL as string) || (u.nameL as string) || '';
    const combined = `${f} ${l}`.trim();
    if (combined) return combined;

    const single =
        (u.userName as string) ||
        (u.customerName as string) ||
        (u.fullName as string) ||
        (u.name as string) ||
        '';
    return (single || '').trim();
}

const Profile = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { token, user } = useAuthToken();
    const [dataUserLogin, setDataUserLogin] = useState<Record<string, unknown>>({});
    const [activeSubscription, setActiveSubscription] = useState<any>(null);
    const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);
    const [loadingSub, setLoadingSub] = useState(false);
    const isShopOwner = user?.userRole === 1 || user?.userRole === '1';

    const displayName = useMemo(() => {
        const combined = getDisplayName(dataUserLogin);
        return combined || t('my_profile');
    }, [dataUserLogin, t]);

    const avatarSrc = dataUserLogin?.userProfileImage
        ? `${ServerSetting.serUrl}/profile/${dataUserLogin.userProfileImage}`
        : '/assets/images/profile-34.jpeg';

    useEffect(() => {
        const userInfo = localStorage.getItem('userInformation');
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                setDataUserLogin(parsed?.data || parsed || {});
            } catch {
                setDataUserLogin({});
            }
        }
        dispatch(setPageTitle('Profile'));
    }, [dispatch]);

    useEffect(() => {
        if (isShopOwner && user?._id && token) {
            setLoadingSub(true);
            Promise.all([
                axios
                    .post(`${ServerSetting.apiUrl}/getActiveSubscription`, { userId: user._id }, { headers: { Authorization: `Bearer ${token}` } })
                    .then((r) => (r.data?.status === 200 ? r.data.data : null))
                    .catch(() => null),
                axios
                    .post(`${ServerSetting.apiUrl}/getSubscriptionHistory`, { userId: user._id }, { headers: { Authorization: `Bearer ${token}` } })
                    .then((r) => (r.data?.status === 200 ? r.data.data || [] : []))
                    .catch(() => []),
            ])
                .then(([active, history]) => {
                    setActiveSubscription(active);
                    setSubscriptionHistory(Array.isArray(history) ? history : []);
                })
                .finally(() => setLoadingSub(false));
        }
    }, [isShopOwner, user?._id, token]);

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/dashboard" className="text-primary hover:underline">
                        {t('dashboard')}
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>{t('profile')}</span>
                </li>
            </ul>

            <div className="pt-5 space-y-6">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    {/* Profile hero */}
                    <div className="xl:col-span-7">
                        <div className="overflow-hidden rounded-[2rem] border border-white-dark/15 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#0e1726]">
                            <div className="relative h-28 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 sm:h-32">
                                <div
                                    className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_50%),radial-gradient(circle_at_80%_60%,white_0,transparent_45%)]"
                                    aria-hidden
                                />
                            </div>
                            <div className="relative px-6 pb-6 pt-0 sm:px-8">
                                <div className="-mt-10 flex flex-col gap-6 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="flex flex-col items-center sm:flex-row sm:items-end sm:gap-5">
                                        <div className="relative shrink-0">
                                            <img
                                                src={avatarSrc}
                                                alt=""
                                                className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-xl dark:border-[#0e1726] sm:h-32 sm:w-32"
                                            />
                                            <Link
                                                to="/users/user-account-settings"
                                                className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md transition hover:opacity-95"
                                                title={t('edit_profile')}
                                            >
                                                <IconPencilPaper className="h-5 w-5" />
                                            </Link>
                                        </div>
                                        <div className="mt-4 text-center sm:mt-0 sm:pb-1 sm:text-left">
                                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">{displayName}</h1>
                                            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                                <span className="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                                                    <IconCoffee className="mr-1.5 h-3.5 w-3.5" />
                                                    {roleLabel(dataUserLogin?.userRole, t)}
                                                </span>
                                                <Link
                                                    to="/users/user-account-settings?tab=password"
                                                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                                                >
                                                    {t('account_settings')}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                    <div className="flex items-start gap-3 rounded-2xl border border-white-dark/10 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm dark:bg-white/10">
                                            <IconMapPin className="h-5 w-5" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('address')}</p>
                                            <p className="mt-1 text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">{formatAddress(dataUserLogin, t('not_set'))}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-2xl border border-white-dark/10 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm dark:bg-white/10">
                                            <IconMail className="h-5 w-5" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('email')}</p>
                                            <p className="mt-1 truncate text-sm font-medium text-primary">{dataUserLogin.userEmail ? String(dataUserLogin.userEmail) : '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-2xl border border-white-dark/10 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm dark:bg-white/10">
                                            <IconCalendar className="h-5 w-5" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('cnic_label')}</p>
                                            <p className="mt-1 font-mono text-sm font-medium text-gray-900 dark:text-gray-100" dir="ltr">
                                                {dataUserLogin.userCNIC != null && String(dataUserLogin.userCNIC) !== '' ? String(dataUserLogin.userCNIC) : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-2xl border border-white-dark/10 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm dark:bg-white/10">
                                            <IconPhone className="h-5 w-5" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('phone')}</p>
                                            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100" dir="ltr">
                                                {dataUserLogin.userPhone != null && String(dataUserLogin.userPhone) !== '' ? String(dataUserLogin.userPhone) : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-5">
                        <ChangePasswordCard token={token} className="h-full" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {isShopOwner && (
                        <>
                            <div className="rounded-2xl border border-white-dark/15 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0e1726]">
                                <div className="mb-5 flex items-center justify-between">
                                    <h5 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                                        <IconMenuInvoice className="h-5 w-5 text-primary" />
                                        {t('current_plan')}
                                    </h5>
                                    <Link to="/users/user-account-settings?tab=subscription" className="btn btn-primary btn-sm rounded-xl">
                                        {t('manage')}
                                    </Link>
                                </div>
                                {loadingSub ? (
                                    <div className="flex justify-center py-8">
                                        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                                    </div>
                                ) : activeSubscription ? (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('table_plan_name')}</p>
                                            <p className="text-lg font-semibold">{activeSubscription.subId?.subName || activeSubscription.subNameHistory || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('price')}</p>
                                            <p className="font-semibold">Rs. {activeSubscription.subId?.subPrice ?? activeSubscription.subPriceHistory ?? '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('table_expires')}</p>
                                            <p className="font-semibold">
                                                {activeSubscription.expireDate
                                                    ? new Date(activeSubscription.expireDate).toLocaleDateString(t('date_locale') || 'en-PK', {
                                                          year: 'numeric',
                                                          month: 'long',
                                                          day: 'numeric',
                                                      })
                                                    : '—'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-[#ebedf2] pt-3 dark:border-[#191e3a]">
                                            <span className="flex items-center gap-1 text-sm">
                                                <IconClock className="h-4 w-4" />
                                                {activeSubscription.expireDate
                                                    ? (() => {
                                                          const exp = new Date(activeSubscription.expireDate);
                                                          const now = new Date();
                                                          const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                                          return days > 0 ? t('days_left', { count: days }) : days === 0 ? t('expires_today') : t('expired');
                                                      })()
                                                    : '—'}
                                            </span>
                                            <span
                                                className={`badge ${activeSubscription.status === 'active' && !activeSubscription.isExpired ? 'bg-success' : 'bg-danger'}`}
                                            >
                                                {activeSubscription.status === 'active' && !activeSubscription.isExpired ? t('active') : t('expired')}
                                            </span>
                                        </div>
                                        <Link to="/SubcriptionHistory" className="btn btn-outline-primary btn-sm mt-2 w-full rounded-xl">
                                            {t('view_full_history')}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                                        <p className="mb-3">{t('no_active_subscription')}</p>
                                        <Link to="/addsubcription" className="btn btn-primary btn-sm rounded-xl">
                                            {t('subscribe_now')}
                                        </Link>
                                    </div>
                                )}
                            </div>
                            <div className="rounded-2xl border border-white-dark/15 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0e1726]">
                                <div className="mb-5 flex items-center justify-between">
                                    <h5 className="text-lg font-bold text-gray-900 dark:text-white">{t('subscription_history_title')}</h5>
                                    <Link to="/SubcriptionHistory" className="text-sm text-primary hover:underline">
                                        {t('view_all')}
                                    </Link>
                                </div>
                                {loadingSub ? (
                                    <div className="flex justify-center py-6">
                                        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                                    </div>
                                ) : subscriptionHistory.length > 0 ? (
                                    <div className="space-y-2">
                                        {subscriptionHistory.slice(0, 5).map((h: any) => {
                                            const exp = h.expireDateHistory ? new Date(h.expireDateHistory) : null;
                                            const status = exp && exp < new Date() ? t('expired') : t('active');
                                            return (
                                                <div
                                                    key={h._id}
                                                    className="flex items-center justify-between border-b border-[#ebedf2] py-2 last:border-0 dark:border-[#191e3a]"
                                                >
                                                    <div>
                                                        <p className="font-medium">{h.subNameHistory || h.subIdHistory?.subName || '—'}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Rs. {h.subPriceHistory || h.subIdHistory?.subPrice || '—'} •{' '}
                                                            {h.expireDateHistory ? new Date(h.expireDateHistory).toLocaleDateString() : '—'}
                                                        </p>
                                                    </div>
                                                    <span className={`badge text-xs ${status === t('active') ? 'bg-success' : 'bg-danger'}`}>{status}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="py-6 text-center text-gray-500 dark:text-gray-400">{t('no_subscription_history')}</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;