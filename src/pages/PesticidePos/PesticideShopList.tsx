import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { confirmStatusChange, showSuccess, showError } from '../../utils/sweetAlert';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconMenuShop from '../../components/Icon/Menu/IconMenuShop';
import IconEdit from '../../components/Icon/IconEdit';
import IconXCircle from '../../components/Icon/IconXCircle';

// Shared style tokens so this page stays visually consistent with the rest
// of the app (see AdminOverview / Header / TableCard).
const card =
    'rounded-[2rem] border border-primary-200 bg-white/95 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-primary-800 dark:bg-gray-900/85';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-gray-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:shadow-none dark:ring-0';
const sectionHeading = 'text-lg font-semibold text-gray-900 dark:text-white';
const actionChipWide =
    'inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-colors';

const PesticideShopList = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle(t('pesticide_shop_list_page')));
    }, [dispatch, t]);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        axios
            .get(`${ServerSetting.apiUrl}/pesticide-pos/shops`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => {
                if (r.data?.status === 200 && Array.isArray(r.data.data)) setList(r.data.data);
            })
            .catch(() => Notification({ text: 'Failed to load shops', color: 'danger' }))
            .finally(() => setLoading(false));
    }, [token]);

    const handleBlock = async (shop: any) => {
        const newStatus = shop.status === 1 ? 0 : 1;
        const actionText = newStatus === 1 ? 'Block' : 'Unblock';
        const confirmed = await confirmStatusChange(actionText, 'this shop');
        if (!confirmed) return;
        axios
            .patch(`${ServerSetting.apiUrl}/pesticide-pos/shops/${shop._id}/block`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => {
                if (r.data?.status === 200) {
                    showSuccess(r.data.message || 'Status updated.');
                    setList((prev) => prev.map((s) => (s._id === shop._id ? { ...s, status: newStatus } : s)));
                } else {
                    showError(r.data?.message || 'Failed');
                }
            })
            .catch((err) => showError(err.response?.data?.message || 'Failed'));
    };

    const getOwnerName = (s: any) => {
        const o = s.shopOwnerId;
        if (!o) return '—';
        return [o.userNameF, o.userNameL].filter(Boolean).join(' ') || '—';
    };

    const getSubName = (s: any) => (s.posSubscriptionId?.name || '—');

    const formatExpire = (s: any) => {
        const d = s.subscriptionExpireDate;
        if (!d) return '—';
        const date = new Date(d);
        const expired = date.getTime() < Date.now();
        return (
            <span className={expired ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}>
                {date.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                {expired && ' (Expired)'}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <ul className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <li><Link to="/dashboard" className="text-primary hover:underline dark:text-primary-light">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Pesticide POS</span></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Pesticide Shop List</span></li>
            </ul>

            <div className={card}>
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className={iconBadge}>
                            <span className="text-lg">🏪</span>
                        </span>
                        <h2 className={sectionHeading}>{t('pesticide_shop_list_page')}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 rounded-2xl bg-primary-light px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-light/70 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30"
                    >
                        <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        {t('back')}
                    </button>
                </div>

                {loading ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent dark:border-primary-light"></div>
                        <p className="text-gray-500 dark:text-gray-400">{t('loading')}</p>
                    </div>
                ) : list.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-white/5">
                            <IconMenuShop className="w-7 h-7 text-primary/60 dark:text-primary-light/60" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">{t('no_pesticide_shops_yet')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-primary-100 dark:border-white/10">
                        <table className="w-full table-auto text-sm">
                            <thead>
                                <tr className="border-b border-primary-100 bg-primary-50 dark:border-white/10 dark:bg-white/5">
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('shop_name')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('table_reg_number')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('phone_number')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('table_owner')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('subscriptions_title')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('table_expires')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('status')}</th>
                                    <th className="py-3 px-4 text-right font-semibold text-gray-500 dark:text-gray-400">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((s) => (
                                    <tr key={s._id} className="border-b border-primary-100 transition-colors last:border-0 hover:bg-primary-50 dark:border-white/10 dark:hover:bg-white/5">
                                        <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{s.shopName}</td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{s.shopRegistrationNumber}</td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{s.shopPhone}</td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{getOwnerName(s)}</td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{getSubName(s)}</td>
                                        <td className="py-3 px-4">{formatExpire(s)}</td>
                                        <td className="py-3 px-4">
                                            <span className={`badge ${s.status === 1 ? 'badge-outline-danger' : 'badge-outline-success'}`}>
                                                {s.status === 1 ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-1.5 flex-nowrap whitespace-nowrap">
                                                <Link
                                                    to={`/pesticide-pos/shops/edit/${s._id}`}
                                                    className={`${actionChipWide} bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20`}
                                                >
                                                    <IconEdit className="w-3.5 h-3.5" />
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => handleBlock(s)}
                                                    className={`${actionChipWide} ${
                                                        s.status === 1
                                                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20'
                                                            : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20'
                                                    }`}
                                                >
                                                    <IconXCircle className="w-3.5 h-3.5" />
                                                    {s.status === 1 ? 'Unblock' : 'Block'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PesticideShopList;
