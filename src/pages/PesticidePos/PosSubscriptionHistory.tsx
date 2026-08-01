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

// Layout stays the newer card design; colors follow the original template
// palette (primary/gray) instead of hardcoded hex.
const card =
    'rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-gray-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:shadow-none dark:ring-0';
const sectionHeading = 'text-lg font-semibold text-gray-900 dark:text-white';

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
                <li><Link to="/dashboard" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link to="/pesticide-pos/shops" className="text-primary hover:underline">Pesticide POS</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-500 dark:text-gray-400"><span>POS Subscription History</span></li>
            </ul>

            <div className={card}>
                <div className="mb-6 flex items-center gap-3">
                    <span className={iconBadge}>
                        <IconMenuCalendar className="w-5 h-5" />
                    </span>
                    <div>
                        <h2 className={sectionHeading}>{t('pos_subscription_history_page')}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('pos_subscription_history_desc')}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <p className="text-gray-500 dark:text-gray-400">{t('loading')}</p>
                    </div>
                ) : list.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                            <IconMenuCalendar className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">{t('no_subscriptions_yet')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                        <table className="w-full table-auto text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('shop_name')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('table_owner')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('subscriptions_title')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('table_start_date')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('table_expire_date')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((s) => {
                                    const expired = isExpired(s.subscriptionExpireDate);
                                    return (
                                        <tr key={s._id} className="border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
                                            <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{s.shopName}</td>
                                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{getOwnerName(s)}</td>
                                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{s.posSubscriptionId?.name || '—'}</td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatDate(s.subscriptionStartDate)}</td>
                                            <td className="py-3 px-4">
                                                <span className={expired ? 'font-medium text-danger' : 'text-gray-700 dark:text-gray-300'}>
                                                    {formatDate(s.subscriptionExpireDate)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {expired ? (
                                                    <span className="badge bg-danger">Expired</span>
                                                ) : (
                                                    <span className="badge bg-success">Active</span>
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
