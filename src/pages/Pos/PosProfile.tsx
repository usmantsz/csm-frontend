import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import IconUser from '../../components/Icon/IconUser';
import IconMail from '../../components/Icon/IconMail';
import IconPhone from '../../components/Icon/IconPhone';
import IconMapPin from '../../components/Icon/IconMapPin';
import IconCreditCard from '../../components/Icon/IconCreditCard';
import PageHeader from '../../components/Agricultural/PageHeader';
import { ChangePasswordCard } from '../../components/Account/ChangePasswordCard';

type UserProfile = {
    _id: string;
    userNameF?: string;
    userNameL?: string;
    userEmail?: string;
    userPhone?: number | string;
    userCNIC?: number | string;
    userProvince?: string;
    userCity?: string;
    userAdress?: string;
    userProfileImage?: string;
};

type PosSubscriptionPlan = { _id?: string; name?: string; durationDays?: number; price?: number };

type PosShopSummary = {
    shopName?: string;
    subscriptionStartDate?: string | null;
    subscriptionExpireDate?: string | null;
    posSubscriptionId?: PosSubscriptionPlan | string | null;
};

const PROVINCES = [
    'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
    'Gilgit-Baltistan', 'Azad Jammu and Kashmir', 'Islamabad Capital Territory',
];

function formatDate(iso?: string | null) {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const PosProfile = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const subscriptionAnchorRef = useRef<HTMLDivElement>(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [form, setForm] = useState({
        userNameF: '',
        userNameL: '',
        userEmail: '',
        userPhone: '',
        userProvince: '',
        userCity: '',
        userAdress: '',
    });
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [profileImagePreview, setProfileImagePreview] = useState<string>('');
    const [posShop, setPosShop] = useState<PosShopSummary | null>(null);
    const [shopLoadFailed, setShopLoadFailed] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('pos_profile_title')));
    }, [dispatch, t, i18n.language]);

    useEffect(() => {
        if (!token) {
            navigate('/pos-login', { replace: true });
            return;
        }
        setLoading(true);
        setShopLoadFailed(false);
        Promise.allSettled([
            axios.get(`${ServerSetting.apiUrl}/me`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
            axios.get(`${ServerSetting.apiUrl}/pos/my-shop`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
        ])
            .then((results) => {
                const meOutcome = results[0];
                const shopOutcome = results[1];
                if (meOutcome.status === 'fulfilled') {
                    const meRes = meOutcome.value;
                    const data = meRes.data?.data ?? meRes.data;
                    if (data && data._id) {
                        setProfile(data);
                        setForm({
                            userNameF: data.userNameF ?? '',
                            userNameL: data.userNameL ?? '',
                            userEmail: data.userEmail ?? '',
                            userPhone: data.userPhone != null ? String(data.userPhone) : '',
                            userProvince: data.userProvince ?? '',
                            userCity: data.userCity ?? '',
                            userAdress: data.userAdress ?? '',
                        });
                        setProfileImagePreview(
                            data.userProfileImage
                                ? `${ServerSetting.serUrl}/profile/${data.userProfileImage}`
                                : '/assets/images/profile-34.jpeg'
                        );
                    }
                }
                if (shopOutcome.status === 'fulfilled') {
                    const shopRes = shopOutcome.value;
                    if (shopRes.status === 200 && shopRes.data?.data) {
                        setPosShop(shopRes.data.data as PosShopSummary);
                        setShopLoadFailed(false);
                    } else {
                        setShopLoadFailed(true);
                        setPosShop(null);
                    }
                } else {
                    setShopLoadFailed(true);
                    setPosShop(null);
                }
            })
            .finally(() => setLoading(false));
    }, [token, navigate]);

    useEffect(() => {
        if (location.hash !== '#pos-subscription') return;
        const scrollT = window.setTimeout(() => {
            subscriptionAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return () => window.clearTimeout(scrollT);
    }, [location.hash, loading]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImageFile(file);
            setProfileImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setSaving(true);
        const formDataToSend = new FormData();
        formDataToSend.append('userNameF', form.userNameF.trim());
        formDataToSend.append('userNameL', form.userNameL.trim());
        formDataToSend.append('userEmail', form.userEmail.trim());
        formDataToSend.append('userPhone', form.userPhone.replace(/\D/g, '') || '0');
        formDataToSend.append('userProvince', form.userProvince.trim());
        formDataToSend.append('userCity', form.userCity.trim());
        formDataToSend.append('userAdress', form.userAdress.trim());
        if (profileImageFile) formDataToSend.append('userProfileImage', profileImageFile);

        axios
            .patch(`${ServerSetting.apiUrl}/updateProfile`, formDataToSend, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
                validateStatus: () => true,
            })
            .then((res) => {
                if (res.data?.status === 200 || res.data?.success) {
                    Swal.fire({ title: t('pos_saved'), text: t('pos_profile_updated'), icon: 'success', timer: 2000, showConfirmButton: false });
                    const updated = res.data?.data ?? res.data;
                    if (updated) {
                        setProfile((p) => (p ? { ...p, ...updated } : p));
                        try {
                            const raw = localStorage.getItem('userInformation');
                            if (raw) {
                                const parsed = JSON.parse(raw);
                                const data = parsed?.data ?? parsed;
                                if (data) {
                                    parsed.data = { ...data, ...updated };
                                    localStorage.setItem('userInformation', JSON.stringify(parsed));
                                }
                            }
                        } catch (_) {}
                    }
                    setProfileImageFile(null);
                } else {
                    Swal.fire({ title: t('pos_error'), text: res.data?.message || t('pos_update_failed'), icon: 'error' });
                }
            })
            .catch(() => Swal.fire({ title: t('pos_error'), text: t('pos_update_failed'), icon: 'error' }))
            .finally(() => setSaving(false));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <span className="animate-spin inline-block w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="panel p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t('pos_load_profile_fail')}</p>
                <button type="button" className="btn btn-primary mt-4" onClick={() => navigate('/pos/dashboard')}>{t('pos_back_dashboard')}</button>
            </div>
        );
    }

    const plan =
        posShop?.posSubscriptionId && typeof posShop.posSubscriptionId === 'object'
            ? posShop.posSubscriptionId
            : null;
    const expiry = posShop?.subscriptionExpireDate ? new Date(posShop.subscriptionExpireDate) : null;
    const subActive = expiry ? expiry.getTime() >= Date.now() : false;

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('pos_profile_title')}
                description={t('pos_profile_desc')}
                backTo="/pos/dashboard"
                backLabel={t('pos_back_dashboard')}
                icon={<span>👤</span>}
            />

            <ChangePasswordCard
                token={token}
                title={t('pos_password_heading')}
                description={t('pos_password_hint')}
                className="scroll-mt-24"
            />

            {/* POS subscription — anchor for /pos/profile#pos-subscription */}
            <div
                id="pos-subscription"
                ref={subscriptionAnchorRef}
                className="panel bg-white dark:bg-[#0e1726] p-6 rounded-2xl border border-white-dark/10 dark:border-white/5 scroll-mt-24"
            >
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                    <IconCreditCard className="w-5 h-5 text-primary-500" />
                    {t('pos_subscription_heading')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                    {t('pos_subscription_intro')}
                </p>

                {shopLoadFailed || !posShop ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('pos_subscription_load_fail')}
                    </p>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    subActive
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-red-500/15 text-red-700 dark:text-red-400'
                                }`}
                            >
                                {subActive ? t('pos_status_active') : t('pos_status_expired')}
                            </span>
                            {posShop.shopName ? (
                                <span className="text-sm text-gray-600 dark:text-gray-300">{t('pos_shop_label', { name: posShop.shopName })}</span>
                            ) : null}
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-0.5">{t('pos_plan_label')}</p>
                                <p className="font-semibold text-gray-800 dark:text-white">{plan?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-0.5">{t('pos_duration_days')}</p>
                                <p className="font-semibold text-gray-800 dark:text-white">{plan?.durationDays != null ? String(plan.durationDays) : '—'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-0.5">{t('pos_period_start')}</p>
                                <p className="font-semibold text-gray-800 dark:text-white">{formatDate(posShop.subscriptionStartDate)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-0.5">{t('pos_expires')}</p>
                                <p className="font-semibold text-gray-800 dark:text-white">{formatDate(posShop.subscriptionExpireDate)}</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-5 border-t border-white-dark/10 dark:border-white/10">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">{t('pos_history_heading')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                {t('pos_history_note')}
                            </p>
                            <div className="overflow-x-auto rounded-lg border border-white-dark/10 dark:border-white/10">
                                <table className="table-auto w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-white/5 text-left">
                                            <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">{t('pos_history_col_period')}</th>
                                            <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">{t('pos_history_col_plan')}</th>
                                            <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">{t('pos_history_col_status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-t border-white-dark/10 dark:border-white/10">
                                            <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                                                {formatDate(posShop.subscriptionStartDate)} — {formatDate(posShop.subscriptionExpireDate)}
                                            </td>
                                            <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{plan?.name ?? '—'}</td>
                                            <td className="px-3 py-2">{subActive ? t('pos_history_status_current') : t('pos_history_status_ended')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="panel bg-white dark:bg-[#0e1726] p-6 rounded-2xl border border-white-dark/10 dark:border-white/5">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                        <IconUser className="w-5 h-5 text-primary-500" />
                        {t('pos_account_contact')}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {t('pos_account_contact_hint')}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                            <label className="form-label">{t('pos_form_first_name')}</label>
                            <input type="text" name="userNameF" value={form.userNameF} onChange={handleChange} className="form-input" required />
                        </div>
                        <div>
                            <label className="form-label">{t('pos_form_last_name')}</label>
                            <input type="text" name="userNameL" value={form.userNameL} onChange={handleChange} className="form-input" required />
                        </div>
                        <div>
                            <label className="form-label flex items-center gap-1"><IconMail className="w-4 h-4" /> {t('pos_form_email')}</label>
                            <input type="email" name="userEmail" value={form.userEmail} onChange={handleChange} className="form-input" required />
                        </div>
                        <div>
                            <label className="form-label flex items-center gap-1"><IconPhone className="w-4 h-4" /> {t('pos_form_phone')}</label>
                            <input type="text" name="userPhone" value={form.userPhone} onChange={handleChange} className="form-input" placeholder={t('pos_phone_placeholder')} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="form-label">{t('pos_form_profile_photo')}</label>
                            <div className="flex items-center gap-4 mt-2">
                                <img src={profileImagePreview} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-white-dark/10" />
                                <input type="file" accept="image/*" onChange={handleImageChange} className="form-input file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white" />
                            </div>
                        </div>
                        <div>
                            <label className="form-label">{t('pos_form_cnic')}</label>
                            <input type="text" value={profile.userCNIC != null ? String(profile.userCNIC) : ''} className="form-input bg-gray-100 dark:bg-white/5 cursor-not-allowed" readOnly disabled />
                            <p className="text-xs text-gray-500 mt-1">{t('pos_cnic_readonly')}</p>
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-white-dark/10 dark:border-white/10">
                        <h3 className="text-base font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                            <IconMapPin className="w-5 h-5 text-primary-500" />
                            {t('pos_address_heading')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t('pos_address_hint')}</p>
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div>
                                <label className="form-label">{t('pos_form_province')}</label>
                                <select name="userProvince" value={form.userProvince} onChange={handleChange} className="form-select">
                                    <option value="">{t('pos_select_province')}</option>
                                    {PROVINCES.map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">{t('pos_form_city')}</label>
                                <input type="text" name="userCity" value={form.userCity} onChange={handleChange} className="form-input" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="form-label">{t('pos_form_address')}</label>
                                <textarea name="userAdress" value={form.userAdress} onChange={handleChange} rows={3} className="form-textarea" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="btn btn-primary px-6 py-2.5 rounded-xl font-medium disabled:opacity-50">
                        {saving ? t('pos_saving') : t('pos_save_changes')}
                    </button>
                    <button type="button" className="btn btn-outline-secondary px-6 py-2.5 rounded-xl" onClick={() => navigate('/pos/dashboard')}>{t('pos_cancel')}</button>
                </div>
            </form>
        </div>
    );
};

export default PosProfile;
