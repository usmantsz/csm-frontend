import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { useAuthToken } from '../../Hooks/useAuthToken';
import IconMenuCalendar from '../../components/Icon/Menu/IconMenuCalendar';

// Design tokens taken from the Stitch dark navy + emerald theme.
// Same structure/features/handlers as before — only the visual styling
// (card, icon badge, status pills, empty state) has been restyled.
// No new functionality (search, filters, extra buttons) or static numbers
// were added — the record count badge below uses the real fetched list length.
const card =
    'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md relative overflow-hidden ' +
    'dark:border-slate-800/80 dark:bg-[#0b1a26] dark:shadow-xl';
const iconBadge =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-gray-100 text-emerald-700 ' +
    'dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-900/30 dark:text-emerald-400 dark:ring-1 dark:ring-emerald-500/30 dark:shadow-inner';
const sectionHeading = 'text-lg font-bold tracking-tight text-gray-900 dark:text-white';

const PosSubscriptionHistory = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle(t('pos_subscription_history_page')));
    }, [dispatch, t]);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        axios
            .get(`${ServerSetting.apiUrl}/pesticide-pos/shops`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => {
                if (r.data?.status === 200 && Array.isArray(r.data.data)) setList(r.data.data);
            })
            .catch(() => Notification({ text: 'Failed to load history', color: 'danger' }))
            .finally(() => setLoading(false));
    }, [token]);

    const getOwnerName = (s: any) => {
        const o = s.shopOwnerId;
        if (!o) return '—';
        return [o.userNameF, o.userNameL].filter(Boolean).join(' ') || '—';
    };

    const formatDate = (d: string | Date | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const isExpired = (expireDate: string | Date | null) => {
        if (!expireDate) return false;
        return new Date(expireDate).getTime() < Date.now();
    };

    return (
        <div className="space-y-6">
            <ul className="flex items-center gap-2 text-sm">
                <li>
                    <Link to="/dashboard" className="text-emerald-600 hover:underline dark:text-emerald-400">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link to="/pesticide-pos/shops" className="text-emerald-600 hover:underline dark:text-emerald-400">
                        Pesticide POS
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-500 dark:text-slate-500">
                    <span>POS Subscription History</span>
                </li>
            </ul>

            <div className={card}>
                {/* decorative glow — dark mode only, no functional change */}
                <div className="hidden dark:block absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="mb-6 flex items-center gap-4 relative z-10">
                    <span className={iconBadge}>
                        <IconMenuCalendar className="w-6 h-6" />
                    </span>
                    <div>
                        <h2 className={`${sectionHeading} flex items-center gap-2 flex-wrap`}>
                            {t('pos_subscription_history_page')}
                            <span className="text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full dark:bg-[#07121c] dark:text-slate-400 dark:border-slate-800">
                                {list.length} {list.length === 1 ? 'Record' : 'Records'}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{t('pos_subscription_history_desc')}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 text-center relative z-10">
                        <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                        <p className="text-gray-500 dark:text-slate-400">{t('loading')}</p>
                    </div>
                ) : list.length === 0 ? (
                    <div className="py-16 text-center relative z-10">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-[#061019] dark:border dark:border-emerald-500/30">
                            <IconMenuCalendar className="w-7 h-7 text-gray-400 dark:text-emerald-400" />
                        </div>
                        <p className="text-gray-500 dark:text-slate-400">{t('no_subscriptions_yet')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 relative z-10 dark:border-slate-800/80">
                        <table className="w-full table-auto text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-800/80 dark:bg-slate-900/40">
                                    <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('shop_name')}
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('table_owner')}
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('subscriptions_title')}
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('table_start_date')}
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('table_expire_date')}
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('status')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="dark:divide-y dark:divide-slate-800/60">
                                {list.map((s) => {
                                    const expired = isExpired(s.subscriptionExpireDate);
                                    return (
                                        <tr
                                            key={s._id}
                                            className="border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-0 dark:hover:bg-slate-800/30"
                                        >
                                            <td className="py-4 px-4 font-semibold text-gray-800 dark:text-white">{s.shopName}</td>
                                            <td className="py-4 px-4 text-gray-700 dark:text-slate-300">{getOwnerName(s)}</td>
                                            <td className="py-4 px-4 text-gray-700 dark:text-slate-300">{s.posSubscriptionId?.name || '—'}</td>
                                            <td className="py-4 px-4 text-gray-600 dark:text-slate-400">{formatDate(s.subscriptionStartDate)}</td>
                                            <td className="py-4 px-4">
                                                <span className={expired ? 'font-medium text-danger' : 'text-gray-700 dark:text-slate-300'}>
                                                    {formatDate(s.subscriptionExpireDate)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                {expired ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-red-50 text-rose-700 border border-red-200 dark:bg-red-950/80 dark:text-rose-300 dark:border-red-500/40">
                                                        Expired
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-500/40">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PosSubscriptionHistory;
