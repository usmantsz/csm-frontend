import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { useAuthToken } from '../../Hooks/useAuthToken';
import IconMenuInvoice from '../../components/Icon/Menu/IconMenuInvoice';

// Layout stays the newer card design; colors follow the original template
// palette (primary/gray) instead of hardcoded hex.
const card =
    'rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-gray-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:shadow-none dark:ring-0';
const sectionHeading = 'text-lg font-semibold text-gray-900 dark:text-white';

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
                <li><Link to="/dashboard" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link to="/pesticide-pos/shops" className="text-primary hover:underline">Pesticide POS</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-500 dark:text-gray-400"><span>Subscription for POS</span></li>
            </ul>

            <div className={card}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <span className={iconBadge}>
                            <IconMenuInvoice className="w-5 h-5" />
                        </span>
                        <h5 className={sectionHeading}>{t('pos_subscriptions_list_title')}</h5>
                    </div>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] px-4 py-2 text-sm font-semibold text-white border-0 shadow-sm shadow-[#16a34a]/20 transition-colors"
                        onClick={() => setShowAdd(!showAdd)}
                    >
                        {showAdd ? t('cancel') : t('btn_add_subscription')}
                    </button>
                </div>

                {showAdd && (
                    <form onSubmit={handleAddSubmit} className="mb-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-5 space-y-4 dark:border-gray-700 dark:bg-white/5">
                        <h6 className="font-semibold text-gray-800 dark:text-gray-200">{t('form_new_subscription')}</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">{t('form_name')} <span className="text-danger">*</span></label>
                                <input type="text" className="form-input" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} required />
                            </div>
                            <div>
                                <label className="form-label">{t('form_price_rs')}</label>
                                <input type="number" className="form-input" value={addForm.price} onChange={(e) => setAddForm((p) => ({ ...p, price: e.target.value }))} min="0" />
                            </div>
                            <div>
                                <label className="form-label">{t('form_duration_days')}</label>
                                <input type="number" className="form-input" value={addForm.durationDays} onChange={(e) => setAddForm((p) => ({ ...p, durationDays: e.target.value }))} min="1" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="form-label">{t('form_description')}</label>
                                <input type="text" className="form-input" value={addForm.description} onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))} />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary rounded-2xl disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? t('btn_saving') : t('btn_save')}
                        </button>
                    </form>
                )}

                {loading ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <p className="text-gray-500 dark:text-gray-400">{t('loading')}</p>
                    </div>
                ) : list.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                            <IconMenuInvoice className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">{t('no_subs_add_above')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                        <table className="w-full table-auto text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('form_name')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('form_description')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('form_price_rs')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('form_duration_days')}</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-gray-400">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((s) => (
                                    <tr key={s._id} className="border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
                                        <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{s.name}</td>
                                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{s.description || '—'}</td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Rs. {Number(s.price).toLocaleString()}</td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{s.durationDays}</td>
                                        <td className="py-3 px-4">
                                            <Link
                                                to={`/pesticide-pos/subscriptions/edit/${s._id}`}
                                                className="btn btn-outline-primary btn-sm rounded-xl hover:!bg-[#16a34a] hover:!text-white hover:!border-[#16a34a]"
                                            >
                                                {t('edit')}
                                            </Link>
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

export default PesticidePosSubscriptions;
