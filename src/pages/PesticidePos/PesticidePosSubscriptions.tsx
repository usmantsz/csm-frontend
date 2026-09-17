import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { useAuthToken } from '../../Hooks/useAuthToken';
import IconMenuInvoice from '../../components/Icon/Menu/IconMenuInvoice';

// Design tokens taken from the Stitch dark navy + emerald "brand" theme.
// Same structure/features/handlers as before — only the visual styling
// (banner, metric summary, table rows) has been made richer to match Stitch.
const card =
    'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md ' +
    'dark:border-slate-800/80 dark:bg-[#0b1a26] dark:shadow-xl dark:hover:shadow-xl';
const metricCard =
    'rounded-2xl border border-gray-200 bg-white p-4 flex items-center justify-between shadow-sm ' +
    'dark:border-slate-800/80 dark:bg-[#0b1a26] dark:shadow-none';
const inputBase =
    'form-input rounded-xl dark:bg-[#08131d] dark:border-slate-800 dark:text-slate-200 dark:placeholder-slate-500 ' +
    'dark:focus:border-emerald-500 dark:focus:ring-emerald-500';
const labelBase = 'form-label dark:text-slate-300';

const PesticidePosSubscriptions = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', description: '', price: '', durationDays: '30' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('pos_subscriptions_page')));
    }, [dispatch, t]);

    const fetchList = () => {
        if (!token) return;
        setLoading(true);
        axios
            .get(`${ServerSetting.apiUrl}/pesticide-pos/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => {
                if (r.data?.status === 200 && Array.isArray(r.data.data)) setList(r.data.data);
            })
            .catch(() => Notification({ text: 'Failed to load subscriptions', color: 'danger' }))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchList();
    }, [token]);

    // Purely derived from already-fetched data — no new API calls or fields.
    const stats = useMemo(() => {
        if (list.length === 0) return { total: 0, avgPrice: 0, avgDuration: 0 };
        const avgPrice = list.reduce((sum, s) => sum + (Number(s.price) || 0), 0) / list.length;
        const avgDuration = list.reduce((sum, s) => sum + (Number(s.durationDays) || 0), 0) / list.length;
        return { total: list.length, avgPrice: Math.round(avgPrice), avgDuration: Math.round(avgDuration) };
    }, [list]);

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!addForm.name?.trim()) {
            Notification({ text: 'Name is required', color: 'warning' });
            return;
        }
        if (!token) return;
        setSaving(true);
        axios
            .post(
                `${ServerSetting.apiUrl}/pesticide-pos/subscriptions`,
                {
                    name: addForm.name.trim(),
                    description: addForm.description.trim(),
                    price: Number(addForm.price) || 0,
                    durationDays: Number(addForm.durationDays) || 30,
                },
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
            )
            .then((r) => {
                if (r.data?.status === 201) {
                    Notification({ text: 'Subscription added', color: 'success' });
                    setAddForm({ name: '', description: '', price: '', durationDays: '30' });
                    setShowAdd(false);
                    fetchList();
                } else Notification({ text: r.data?.message || 'Failed', color: 'danger' });
            })
            .catch((err) => Notification({ text: err.response?.data?.message || 'Failed', color: 'danger' }))
            .finally(() => setSaving(false));
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
                    <span>Subscription for POS</span>
                </li>
            </ul>

            {/* Header banner — same "Add Subscription" toggle button as before, just restyled */}
            <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-gradient-to-r dark:from-[#0c1c28] dark:via-[#0f2434] dark:to-[#0c1c28] dark:shadow-xl">
                <div className="hidden dark:block absolute -right-20 -top-20 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-inner dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400">
                        <IconMenuInvoice className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                {t('pos_subscriptions_list_title')}
                            </h5>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                                Active Management
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 dark:text-slate-400">
                            Configure pricing tiers, renewal cycles, and shop access packages for pesticide retail POS.
                        </p>
                    </div>
                </div>

                <div className="relative z-10">
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white border border-emerald-400/40 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => setShowAdd(!showAdd)}
                    >
                        {showAdd ? t('cancel') : t('btn_add_subscription')}
                    </button>
                </div>
            </div>

            {/* Quick metrics — computed from the already-loaded list, no new data source */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={metricCard}>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Total Configured Plans</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{String(stats.total).padStart(2, '0')}</h3>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span> Active in catalogue
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-emerald-700 dark:bg-slate-900/80 dark:border dark:border-slate-800 dark:text-emerald-400">
                        <IconMenuInvoice className="w-5 h-5" />
                    </div>
                </div>

                <div className={metricCard}>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Average Price</p>
                        <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {stats.avgPrice.toLocaleString()} <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">PKR</span>
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">Across all configured plans</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-emerald-700 dark:bg-slate-900/80 dark:border dark:border-slate-800 dark:text-emerald-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                </div>

                <div className={metricCard}>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Average Cycle</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.avgDuration} <span className="text-xs font-normal text-gray-500 dark:text-slate-400">Days</span>
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">Across all configured plans</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-cyan-700 dark:bg-slate-900/80 dark:border dark:border-slate-800 dark:text-cyan-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className={card}>
                {showAdd && (
                    <form
                        onSubmit={handleAddSubmit}
                        className="mb-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-5 space-y-4 dark:border-slate-800 dark:bg-slate-900/40"
                    >
                        <h6 className="font-semibold text-gray-800 dark:text-slate-200">{t('form_new_subscription')}</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelBase}>
                                    {t('form_name')} <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className={inputBase}
                                    value={addForm.name}
                                    onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelBase}>{t('form_price_rs')}</label>
                                <input
                                    type="number"
                                    className={inputBase}
                                    value={addForm.price}
                                    onChange={(e) => setAddForm((p) => ({ ...p, price: e.target.value }))}
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className={labelBase}>{t('form_duration_days')}</label>
                                <input
                                    type="number"
                                    className={inputBase}
                                    value={addForm.durationDays}
                                    onChange={(e) => setAddForm((p) => ({ ...p, durationDays: e.target.value }))}
                                    min="1"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelBase}>{t('form_description')}</label>
                                <input
                                    type="text"
                                    className={inputBase}
                                    value={addForm.description}
                                    onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white border border-emerald-400/40 shadow-lg shadow-emerald-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? t('btn_saving') : t('btn_save')}
                        </button>
                    </form>
                )}

                {loading ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                        <p className="text-gray-500 dark:text-slate-400">{t('loading')}</p>
                    </div>
                ) : list.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-900/60 dark:border dark:border-slate-800">
                            <IconMenuInvoice className="w-7 h-7 text-gray-400 dark:text-slate-500" />
                        </div>
                        <p className="text-gray-500 dark:text-slate-400">{t('no_subs_add_above')}</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Active Plan Records</h4>
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-gray-100 text-gray-600 border border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                {list.length} {list.length === 1 ? 'Record' : 'Records'}
                            </span>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800/80">
                            <table className="w-full table-auto text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-800/80 dark:bg-slate-900/40">
                                        <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                            {t('form_name')}
                                        </th>
                                        <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                            {t('form_description')}
                                        </th>
                                        <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                            {t('form_price_rs')}
                                        </th>
                                        <th className="py-3.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                            {t('form_duration_days')}
                                        </th>
                                        <th className="py-3.5 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                            {t('actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="dark:divide-y dark:divide-slate-800/60">
                                    {list.map((s) => (
                                        <tr
                                            key={s._id}
                                            className="border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-0 dark:hover:bg-slate-800/30"
                                        >
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs dark:bg-gradient-to-tr dark:from-emerald-600/30 dark:to-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400">
                                                        {String(s.name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-gray-900 dark:text-white">{s.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-500 dark:text-slate-400 max-w-xs">{s.description || '—'}</td>
                                            <td className="py-4 px-4">
                                                <div className="inline-flex items-baseline gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg dark:bg-emerald-500/10 dark:border-emerald-500/20">
                                                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Rs.</span>
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {Number(s.price).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                                    <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="font-medium">{s.durationDays} days</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <Link
                                                    to={`/pesticide-pos/subscriptions/edit/${s._id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-xs font-medium transition-all dark:border-emerald-500/40 dark:text-emerald-400"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                    </svg>
                                                    <span>{t('edit')}</span>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PesticidePosSubscriptions;
