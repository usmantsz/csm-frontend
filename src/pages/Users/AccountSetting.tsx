import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconHome from '../../components/Icon/IconHome';
import IconPhone from '../../components/Icon/IconPhone';
import IconUser from '../../components/Icon/IconUser';
import IconMail from '../../components/Icon/IconMail';
import IconMapPin from '../../components/Icon/IconMapPin';
import IconCreditCard from '../../components/Icon/IconCreditCard';
import IconCamera from '../../components/Icon/IconCamera';
import IconMenuInvoice from '../../components/Icon/Menu/IconMenuInvoice';
import IconClock from '../../components/Icon/IconClock';
import IconLockDots from '../../components/Icon/IconLockDots';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { Notification } from './../../helperComponents/Notification';
import { useAuthToken } from './../../Hooks/useAuthToken';
import Swal from 'sweetalert2';
import axios from 'axios';
import FormField from '../../components/Agricultural/FormField';
import { confirmUpdate, showSuccess, showError, showLoading, closeAlert } from '../../utils/sweetAlert';
import { ChangePasswordCard } from '../../components/Account/ChangePasswordCard';

const AccountSetting = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const { token, user } = useAuthToken();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tabs, setTabs] = useState<string>('home');

    const [formData, setFormData] = useState({
        userNameF: '',
        userNameL: '',
        user_phone: '',
        userEmail: '',
        userCNIC: '',
        userProvince: '',
        userCity: '',
        userAdress: '',
        userProfileImage: null as File | null,
        profileImagePreview: ''
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Subscription data (shop owner only)
    const [activeSubscription, setActiveSubscription] = useState<any>(null);
    const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);
    const [loadingSubscription, setLoadingSubscription] = useState(false);
    const isShopOwner = user?.userRole === 1 || user?.userRole === '1';

    useEffect(() => {
        dispatch(setPageTitle('Account Setting'));
    }, [dispatch]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'password') {
            setTabs('password');
        } else if (tab === 'subscription' && isShopOwner) {
            setTabs('subscription');
        }
    }, [searchParams, isShopOwner]);

    useEffect(() => {
        if (user && user._id) {
            loadUserData();
        }
    }, [user?._id]);

    useEffect(() => {
        if (isShopOwner && user?._id && token) {
            loadSubscriptionData();
        }
    }, [isShopOwner, user?._id, token]);

    const loadSubscriptionData = async () => {
        if (!user?._id || !token) return;
        setLoadingSubscription(true);
        try {
            const [activeRes, historyRes] = await Promise.all([
                axios.post(`${ServerSetting.apiUrl}/getActiveSubscription`, { userId: user._id }, { headers: { Authorization: `Bearer ${token}` } }),
                axios.post(`${ServerSetting.apiUrl}/getSubscriptionHistory`, { userId: user._id }, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (activeRes.data?.status === 200 && activeRes.data?.data) {
                setActiveSubscription(activeRes.data.data);
            } else {
                setActiveSubscription(null);
            }
            if (historyRes.data?.status === 200 && Array.isArray(historyRes.data?.data)) {
                setSubscriptionHistory(historyRes.data.data);
            } else {
                setSubscriptionHistory([]);
            }
        } catch (err) {
            setActiveSubscription(null);
            setSubscriptionHistory([]);
        } finally {
            setLoadingSubscription(false);
        }
    };

    const loadUserData = () => {
        if (user) {
            setFormData({
                userNameF: user.userNameF || '',
                userNameL: user.userNameL || '',
                user_phone: user.userPhone?.toString() || '',
                userEmail: user.userEmail || '',
                userCNIC: user.userCNIC?.toString() || '',
                userProvince: user.userProvince || '',
                userCity: user.userCity || '',
                userAdress: user.userAdress || '',
                userProfileImage: null,
                profileImagePreview: user.userProfileImage
                    ? `${ServerSetting.serUrl}/profile/${user.userProfileImage}`
                    : '/assets/images/profile-34.jpeg'
            });
        }
    };

    const toggleTabs = (name: string) => {
        setTabs(name);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (1MB max)
            if (file.size > 1000000) {
                Notification({ text: t('image_size_max_1mb'), color: 'warning' });
                return;
            }
            // Validate file type
            if (!file.type.startsWith('image/')) {
                Notification({ text: t('select_valid_image'), color: 'warning' });
                return;
            }
            setFormData(prev => ({
                ...prev,
                userProfileImage: file,
                profileImagePreview: URL.createObjectURL(file)
            }));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.userNameF.trim()) {
            newErrors.userNameF = t('first_name_required');
        }
        if (!formData.userNameL.trim()) {
            newErrors.userNameL = t('last_name_required');
        }
        if (!formData.user_phone.trim()) {
            newErrors.user_phone = t('phone_required');
        } else if (!/^\d{10,15}$/.test(formData.user_phone.replace(/\D/g, ''))) {
            newErrors.user_phone = t('valid_phone');
        }
        if (!formData.userEmail.trim()) {
            newErrors.userEmail = t('email_required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
            newErrors.userEmail = t('valid_email_required');
        }
        // CNIC validation removed - it's read-only
        if (!formData.userProvince.trim()) {
            newErrors.userProvince = t('province_required');
        }
        if (!formData.userCity.trim()) {
            newErrors.userCity = t('city_required');
        }
        if (!formData.userAdress.trim()) {
            newErrors.userAdress = t('address_required');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showError(t('fix_form_errors'));
            return;
        }

        if (!token || !user?._id) {
            showError(t('auth_required_login_again'));
            return;
        }

        // Show confirmation dialog
        const confirmed = await confirmUpdate(t('your_profile'));
        if (!confirmed) return;

        setIsSubmitting(true);
        showLoading(t('updating_profile'));

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('userId', user._id);
            formDataToSend.append('userNameF', formData.userNameF.trim());
            formDataToSend.append('userNameL', formData.userNameL.trim());
            formDataToSend.append('user_phone', formData.user_phone.replace(/\D/g, ''));
            formDataToSend.append('userEmail', formData.userEmail.trim());
            // CNIC is not editable - don't send it in update request
            formDataToSend.append('userProvince', formData.userProvince.trim());
            formDataToSend.append('userCity', formData.userCity.trim());
            formDataToSend.append('userAdress', formData.userAdress.trim());

            if (formData.userProfileImage) {
                formDataToSend.append('userProfileImage', formData.userProfileImage);
            }

            const response = await axios.patch(
                `${ServerSetting.serUrl}/api/updateProfile`,
                formDataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.data.status === 200) {
                closeAlert();
                showSuccess(t('profile_updated_success'));
                // Update local storage with new user data
                const storedUser = JSON.parse(localStorage.getItem('userInformation') || '{}');
                if (storedUser.data) {
                    storedUser.data = { ...storedUser.data, ...response.data.data };
                    localStorage.setItem('userInformation', JSON.stringify(storedUser));
                }
                // Reload page to reflect changes
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                closeAlert();
                showError(response.data.message || t('failed_update_profile'));
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            closeAlert();
            showError(error.response?.data?.message || t('error_updating_profile_retry'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Pakistan provinces
    const provinces = [
        t('province_punjab'),
        t('province_sindh'),
        t('province_kpk'),
        t('province_balochistan'),
        t('province_gilgit_baltistan'),
        t('province_ajk'),
        t('province_ict')
    ];

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/users/profile" className="text-primary hover:underline">
                        {t('user_profile')}
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>{t('account_settings')}</span>
                </li>
            </ul>
            <div className="pt-5">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('settings')}</h5>
                </div>
                <div>
                    <ul className="sm:flex font-semibold border-b border-[#ebedf2] dark:border-[#191e3a] mb-5 whitespace-nowrap overflow-y-auto">
                        <li className="inline-block">
                            <button
                                onClick={() => toggleTabs('home')}
                                className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${tabs === 'home' ? '!border-primary text-primary' : ''}`}
                            >
                                <IconHome />
                                {t('edit_profile')}
                            </button>
                        </li>
                        <li className="inline-block">
                            <button
                                onClick={() => toggleTabs('password')}
                                className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${tabs === 'password' ? '!border-primary text-primary' : ''}`}
                            >
                                <IconLockDots />
                                {t('password_tab')}
                            </button>
                        </li>
                        {isShopOwner && (
                            <li className="inline-block">
                                <button
                                    onClick={() => toggleTabs('subscription')}
                                    className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${tabs === 'subscription' ? '!border-primary text-primary' : ''}`}
                                >
                                    <IconMenuInvoice />
                                    {t('subscriptions')}
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
                {tabs === 'home' ? (
                    <div>
                        <form onSubmit={handleSubmit} className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black">
                            <h6 className="text-lg font-bold mb-5">{t('general_information')}</h6>
                            <div className="flex flex-col sm:flex-row">
                                <div className="ltr:sm:mr-4 rtl:sm:ml-4 w-full sm:w-2/12 mb-5">
                                    <div className="relative">
                                        <img
                                            src={formData.profileImagePreview}
                                            alt="Profile"
                                            className="w-20 h-20 md:w-32 md:h-32 rounded-full object-cover mx-auto border-4 border-primary-200 dark:border-primary-800"
                                        />
                                        <label
                                            htmlFor="profileImage"
                                            className="absolute bottom-0 right-0 md:right-4 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary-600 transition-colors"
                                            title={t('change_profile_picture')}
                                        >
                                            <IconCamera className="w-4 h-4" />
                                        </label>
                                        <input
                                            id="profileImage"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </div>
                                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                                        {t('max_1mb')}
                                    </p>
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <FormField
                                        label={t('form_first_name')}
                                        name="userNameF"
                                        type="text"
                                        value={formData.userNameF}
                                        onChange={handleInputChange}
                                        error={errors.userNameF}
                                        placeholder={t('enter_first_name')}
                                        required
                                        icon={<IconUser className="w-5 h-5" />}
                                    />
                                    <FormField
                                        label={t('form_last_name')}
                                        name="userNameL"
                                        type="text"
                                        value={formData.userNameL}
                                        onChange={handleInputChange}
                                        error={errors.userNameL}
                                        placeholder={t('enter_last_name')}
                                        required
                                        icon={<IconUser className="w-5 h-5" />}
                                    />
                                    <FormField
                                        label={t('phone_number')}
                                        name="user_phone"
                                        type="tel"
                                        value={formData.user_phone}
                                        onChange={handleInputChange}
                                        error={errors.user_phone}
                                        placeholder="03001234567"
                                        required
                                        icon={<IconPhone className="w-5 h-5" />}
                                        helpText={t('phone_digits_hint')}
                                    />
                                    <FormField
                                        label={t('form_email')}
                                        name="userEmail"
                                        type="email"
                                        value={formData.userEmail}
                                        onChange={handleInputChange}
                                        error={errors.userEmail}
                                        placeholder="user@example.com"
                                        required
                                        icon={<IconMail className="w-5 h-5" />}
                                    />
                                    <FormField
                                        label={t('form_cnic')}
                                        name="userCNIC"
                                        type="text"
                                        value={formData.userCNIC}
                                        onChange={handleInputChange}
                                        error={errors.userCNIC}
                                        placeholder="1234567890123"
                                        required
                                        disabled={true}
                                        icon={<IconCreditCard className="w-5 h-5" />}
                                        helpText={t('cnic_cannot_change')}
                                    />
                                    <FormField
                                        label={t('province')}
                                        name="userProvince"
                                        type="select"
                                        value={formData.userProvince}
                                        onChange={handleInputChange}
                                        error={errors.userProvince}
                                        required
                                        icon={<IconMapPin className="w-5 h-5" />}
                                        options={provinces.map(p => ({ value: p, label: p }))}
                                    />
                                    <FormField
                                        label={t('city')}
                                        name="userCity"
                                        type="text"
                                        value={formData.userCity}
                                        onChange={handleInputChange}
                                        error={errors.userCity}
                                        placeholder={t('enter_city_name')}
                                        required
                                        icon={<IconMapPin className="w-5 h-5" />}
                                    />
                                    <div className="sm:col-span-2">
                                        <FormField
                                            label={t('address')}
                                            name="userAdress"
                                            type="textarea"
                                            value={formData.userAdress}
                                            onChange={handleInputChange}
                                            error={errors.userAdress}
                                            placeholder={t('enter_complete_address')}
                                            required
                                            rows={3}
                                        />
                                    </div>
                                    <div className="sm:col-span-2 mt-3">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 inline-block mr-2"></span>
                                                    {t('saving')}
                                                </>
                                            ) : (
                                                t('save_changes')
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                ) : tabs === 'password' ? (
                    <div className="max-w-xl">
                        <ChangePasswordCard token={token} />
                    </div>
                ) : tabs === 'subscription' ? (
                    <div className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <IconMenuInvoice className="w-5 h-5" />
                                {t('current_plan')}
                            </h5>
                            {loadingSubscription ? (
                                <div className="flex justify-center py-8">
                                    <span className="animate-spin border-2 border-primary border-t-transparent rounded-full w-8 h-8 inline-block"></span>
                                </div>
                            ) : activeSubscription ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="rounded-lg border border-[#ebedf2] dark:border-[#191e3a] p-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('table_plan_name')}</p>
                                        <p className="font-semibold text-lg">{activeSubscription.subId?.subName || activeSubscription.subName || '—'}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#ebedf2] dark:border-[#191e3a] p-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('price')}</p>
                                        <p className="font-semibold text-lg">Rs. {activeSubscription.subId?.subPrice ?? activeSubscription.subPrice ?? '—'}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#ebedf2] dark:border-[#191e3a] p-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('table_start_date')}</p>
                                        <p className="font-semibold">{activeSubscription.startDate ? new Date(activeSubscription.startDate).toLocaleDateString(t('date_locale'), { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#ebedf2] dark:border-[#191e3a] p-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('table_expire_date')}</p>
                                        <p className="font-semibold">{activeSubscription.expireDate ? new Date(activeSubscription.expireDate).toLocaleDateString(t('date_locale'), { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                                    </div>
                                    <div className="md:col-span-2 rounded-lg border border-[#ebedf2] dark:border-[#191e3a] p-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('plan_description')}</p>
                                        <p className="font-medium">{activeSubscription.subId?.subDescription || activeSubscription.subDescription || '—'}</p>
                                    </div>
                                    <div className="md:col-span-2 flex items-center justify-between rounded-lg bg-primary/10 dark:bg-primary/20 p-4">
                                        <span className="flex items-center gap-2">
                                            <IconClock className="w-5 h-5" />
                                            {activeSubscription.expireDate ? (() => {
                                                const exp = new Date(activeSubscription.expireDate);
                                                const now = new Date();
                                                const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                                return days > 0 ? t('days_left', { count: days }) : days === 0 ? t('expires_today') : t('expired');
                                            })() : '—'}
                                        </span>
                                        <Link to="/SubcriptionHistory" className="btn btn-primary btn-sm">
                                            {t('view_full_history')}
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <p className="mb-3">{t('no_active_subscription')}</p>
                                    <Link to="/addsubcription" className="btn btn-primary btn-sm">{t('subscribe_now')}</Link>
                                </div>
                            )}
                        </div>
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">{t('subscription_history_title')}</h5>
                            {loadingSubscription ? (
                                <div className="flex justify-center py-6">
                                    <span className="animate-spin border-2 border-primary border-t-transparent rounded-full w-6 h-6 inline-block"></span>
                                </div>
                            ) : subscriptionHistory.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table-auto w-full">
                                        <thead>
                                            <tr className="border-b border-[#ebedf2] dark:border-[#191e3a]">
                                                <th className="text-left py-3 px-2">{t('plan')}</th>
                                                <th className="text-left py-3 px-2">{t('price')}</th>
                                                <th className="text-left py-3 px-2">{t('table_start')}</th>
                                                <th className="text-left py-3 px-2">{t('table_expire')}</th>
                                                <th className="text-left py-3 px-2">{t('status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subscriptionHistory.slice(0, 10).map((h: any) => {
                                                const exp = h.expireDateHistory ? new Date(h.expireDateHistory) : null;
                                                const status = exp && exp < new Date() ? t('expired') : t('active');
                                                return (
                                                    <tr key={h._id} className="border-b border-[#ebedf2] dark:border-[#191e3a] hover:bg-gray-50 dark:hover:bg-dark/30">
                                                        <td className="py-3 px-2">{h.subNameHistory || h.subIdHistory?.subName || '—'}</td>
                                                        <td className="py-3 px-2">Rs. {h.subPriceHistory || h.subIdHistory?.subPrice || '—'}</td>
                                                        <td className="py-3 px-2">{h.startDateHistory ? new Date(h.startDateHistory).toLocaleDateString() : '—'}</td>
                                                        <td className="py-3 px-2">{h.expireDateHistory ? new Date(h.expireDateHistory).toLocaleDateString() : '—'}</td>
                                                        <td className="py-3 px-2">
                                                            <span className={`badge ${status === t('active') ? 'bg-success' : 'bg-danger'} `}>{status}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {subscriptionHistory.length > 10 && (
                                        <Link to="/SubcriptionHistory" className="block text-center py-3 text-primary hover:underline">
                                            {t('view_all_records', { count: subscriptionHistory.length })}
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <p className="text-center py-6 text-gray-500 dark:text-gray-400">{t('no_subscription_history')}</p>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default AccountSetting;
