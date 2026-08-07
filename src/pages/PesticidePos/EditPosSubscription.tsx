import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { useAuthToken } from '../../Hooks/useAuthToken';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';

const EditPosSubscription = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ _id: '', name: '', description: '', price: '', durationDays: '30', isActive: true });

    useEffect(() => {
        dispatch(setPageTitle('Edit POS Subscription'));
    }, [dispatch]);

    useEffect(() => {
        if (!token || !id) return;
        axios
            .get(`${ServerSetting.apiUrl}/pesticide-pos/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => {
                if (r.data?.status === 200 && Array.isArray(r.data.data)) {
                    const sub = r.data.data.find((s: any) => s._id === id);
                    if (sub) {
                        setForm({
                            _id: sub._id,
                            name: sub.name || '',
                            description: sub.description || '',
                            price: String(sub.price ?? ''),
                            durationDays: String(sub.durationDays ?? '30'),
                            isActive: sub.isActive !== false,
                        });
                    }
                }
            })
            .catch(() => Notification({ text: 'Failed to load subscription', color: 'danger' }))
            .finally(() => setLoading(false));
    }, [token, id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name?.trim() || !token) return;
        setSaving(true);
        axios
            .put(`${ServerSetting.apiUrl}/pesticide-pos/subscriptions/edit`, {
                _id: form._id,
                name: form.name.trim(),
                description: form.description.trim(),
                price: Number(form.price) || 0,
                durationDays: Number(form.durationDays) || 30,
                isActive: form.isActive,
            }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
            .then((r) => {
                if (r.data?.status === 200) {
                    Notification({ text: 'Subscription updated', color: 'success' });
                    navigate('/pesticide-pos/subscriptions');
                } else Notification({ text: r.data?.message || 'Failed', color: 'danger' });
            })
            .catch((err) => Notification({ text: err.response?.data?.message || 'Failed', color: 'danger' }))
            .finally(() => setSaving(false));
    };

    if (loading && !form._id) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-lg font-semibold text-stone-600 dark:text-stone-400">Loading subscription...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-primary-200 dark:border-primary-900/40 bg-white dark:bg-[#0e1726] p-6 sm:p-8 shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-primary-100 dark:border-primary-900/30">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-flex h-12 bg-shadow-lg shadow-gray-600/40 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-2xl">
                            📋
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white truncate">
                                {form.name || t('edit_subscription')}
                            </h1>
                            <p className="text-sm text-stone-500 dark:text-stone-400">{t('update_plan_details')}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/pesticide-pos/subscriptions')}
                        className="flex items-center gap-2 rounded-2xl bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50 shrink-0"
                    >
                        <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        <span className="hidden sm:inline">{t('back')}</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="form-label">{t('subscription_name')} *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t('subscription_name_placeholder')}
                            value={form.name}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label">{t('description')}</label>
                        <textarea
                            className="form-textarea min-h-[90px] resize-none"
                            placeholder={t('description_placeholder')}
                            value={form.description}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">{t('price')}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">Rs.</span>
                                <input
                                    type="number"
                                    className="form-input pl-9"
                                    placeholder={t('price_placeholder')}
                                    value={form.price}
                                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                                    min="0"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="form-label">{t('duration')}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="form-input pr-14"
                                    placeholder={t('duration_placeholder')}
                                    value={form.durationDays}
                                    onChange={(e) => setForm((p) => ({ ...p, durationDays: e.target.value }))}
                                    min="1"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">{t('days')}</span>
                            </div>
                        </div>
                    </div>

                    <label
                        htmlFor="isActive"
                        className="flex items-center justify-between gap-3 rounded-xl border border-primary-100 dark:border-primary-900/30 bg-primary-50/40 dark:bg-primary-900/10 px-4 py-3 cursor-pointer"
                    >
                        <div>
                            <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">{t('plan_status')}</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">{t('enable_plan_status')}</p>
                        </div>
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={form.isActive}
                            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                            className="w-5 h-5 accent-primary-600 shrink-0"
                        />
                    </label>

                    <div className="flex items-center gap-3 pt-2 border-t border-primary-100 dark:border-primary-900/30 mt-2 pt-5">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : t('save_changes')}
                        </button>
                        <Link
                            to="/pesticide-pos/subscriptions"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-6 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-200 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10"
                        >
                            {t('cancel')}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPosSubscription;
