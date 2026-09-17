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

// Design tokens taken from the Stitch dark navy + emerald "brand" theme.
// Same structure/features/handlers as before — only the visual styling
// (card, icon badge, table, action chips, status badges, empty state) changed.
const card =
    'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md ' +
    'dark:border-emerald-500/20 dark:bg-[#081522] dark:shadow-2xl';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-gray-100 text-emerald-700 ' +
    'dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-1 dark:ring-emerald-500/30 dark:shadow-inner';
const sectionHeading = 'text-lg font-bold tracking-tight text-gray-900 dark:text-white';
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
            <span className={expired ? 'font-medium text-red-600 dark:text-rose-400' : 'text-gray-700 dark:text-slate-300'}>
                {date.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                {expired && ' (Expired)'}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <ul className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-500">
                <li>
                    <Link to="/dashboard" className="text-emerald-600 hover:underline dark:text-emerald-400">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Pesticide POS</span>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Pesticide Shop List</span>
                </li>
            </ul>

            <div className={card}>
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-200 dark:border-[#112438]">
                    <div className="flex items-center gap-3">
                        <span className={iconBadge}>
                            <IconMenuShop className="w-5 h-5" />
                        </span>
                        <h2 className={sectionHeading}>{t('pesticide_shop_list_page')}</h2>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                        <p className="text-gray-500 dark:text-slate-400">{t('loading')}</p>
                    </div>
                ) : list.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-[#0d2235]/60 dark:border dark:border-[#163552]">
                            <IconMenuShop className="w-7 h-7 text-gray-400 dark:text-slate-400" />
                        </div>
                        <p className="text-gray-500 dark:text-slate-300">{t('no_pesticide_shops_yet')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-[#112438]">
                        <table className="w-full table-auto text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 dark:border-[#112438] dark:bg-[#0b1a26]">
                                    <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('shop_name')}
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('table_reg_number')}
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('phone_number')}
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('table_owner')}
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('subscriptions_title')}
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('table_expires')}
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('status')}
                                    </th>
                                    <th className="py-3.5 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {t('actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="dark:divide-y dark:divide-[#112438]">
                                {list.map((s) => (
                                    <tr
                                        key={s._id}
                                        className="border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-0 dark:hover:bg-[#0b1a26]/60"
                                    >
                                        <td className="py-4 px-4 font-semibold text-gray-800 dark:text-white">{s.shopName}</td>
                                        <td className="py-4 px-4 text-gray-700 dark:text-slate-300">{s.shopRegistrationNumber}</td>
                                        <td className="py-4 px-4 text-gray-700 dark:text-slate-300">{s.shopPhone}</td>
                                        <td className="py-4 px-4 text-gray-700 dark:text-slate-300">{getOwnerName(s)}</td>
                                        <td className="py-4 px-4 text-gray-700 dark:text-slate-300">{getSubName(s)}</td>
                                        <td className="py-4 px-4">{formatExpire(s)}</td>
                                        <td className="py-4 px-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                                                    s.status === 1
                                                        ? 'bg-red-50 text-rose-700 border-red-200 dark:bg-red-950/80 dark:text-rose-300 dark:border-red-500/40'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-500/40'
                                                }`}
                                            >
                                                {s.status === 1 ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
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