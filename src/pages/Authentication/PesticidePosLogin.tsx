import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconCreditCard from '../../components/Icon/IconCreditCard';
import IconLockDots from '../../components/Icon/IconLockDots';
import { Notification } from '../../helperComponents/Notification';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import axios from 'axios';

const PesticidePosLogin = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(setPageTitle(t('pos_login_title')));
    }, [dispatch, t, i18n.language]);

    const [data, setData] = useState({ userEmail: '', userPassword: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ userEmail: '', userPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('remember_pos') === 'true');

    useEffect(() => {
        const saved = localStorage.getItem('remember_pos_cnic');
        if (saved) {
            setData((prev) => ({ ...prev, userEmail: saved }));
        }
    }, []);

    const validateForm = () => {
        const newErrors = { userEmail: '', userPassword: '' };
        let isValid = true;
        const cnicDigits = String(data.userEmail || '').replace(/\D/g, '').trim();

        if (!cnicDigits) {
            newErrors.userEmail = t('pos_err_cnic_required');
            isValid = false;
        } else if (cnicDigits.length !== 13) {
            newErrors.userEmail = t('pos_err_cnic_13');
            isValid = false;
        }

        if (!data.userPassword) {
            newErrors.userPassword = t('pos_err_password_required');
            isValid = false;
        } else if (data.userPassword.length < 3) {
            newErrors.userPassword = t('pos_err_password_short');
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleInputChange = (field: string, value: string) => {
        if (field === 'userEmail') {
            const onlyDigits = String(value || '').replace(/\D/g, '').slice(0, 13);
            setData((prev) => ({ ...prev, [field]: onlyDigits }));
        } else {
            setData((prev) => ({ ...prev, [field]: value }));
        }
        if (errors[field as keyof typeof errors]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const submitForm = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/login`,
                { userEmail: String(data.userEmail || '').replace(/\D/g, ''), userPassword: data.userPassword, loginType: 'pos' },
                { validateStatus: (status) => status < 500 }
            );

            if (response.status === 429) {
                Notification({ text: t('pos_err_rate_limit'), color: 'warning' });
                return;
            }

            if (response.data.subscriptionExpired) {
                Notification({ text: t('pos_err_subscription_expired'), color: 'danger' });
                return;
            }

            if (response.data.status === 400) {
                Notification({ text: response.data.message || t('pos_err_invalid_credentials'), color: 'danger' });
                return;
            }

            if (response.data.token && response.data.data) {
                const userInfo = response.data;
                const userRole = userInfo.data?.userRole;

                if (userRole === 0) {
                    Notification({ text: t('pos_err_use_admin_login'), color: 'warning' });
                    return;
                }

                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userInformation', JSON.stringify(userInfo));
                localStorage.setItem('userRole', userRole.toString());
                localStorage.setItem('token', userInfo.token);
                localStorage.setItem('loginSource', 'pos');

                // Remember me: store CNIC only (never store password)
                if (rememberMe) {
                    localStorage.setItem('remember_pos', 'true');
                    localStorage.setItem('remember_pos_cnic', String(data.userEmail || '').replace(/\D/g, '').slice(0, 13));
                } else {
                    localStorage.removeItem('remember_pos');
                    localStorage.removeItem('remember_pos_cnic');
                }

                Notification({ text: t('pos_login_success'), color: 'success' });
                navigate('/pos/dashboard');
            } else {
                Notification({ text: response.data.message || t('pos_login_failed'), color: 'danger' });
            }
        } catch (error: any) {
            Notification({ text: error.response?.data?.message || error.message || t('pos_login_error_generic'), color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-root relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-4">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-teal-100 via-emerald-50 to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-emerald-200/70 via-emerald-100/30 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/10" />
            <svg className="absolute bottom-0 left-0 w-full h-48 text-emerald-300/60 dark:text-emerald-900/40" viewBox="0 0 400 120" fill="none" preserveAspectRatio="none">
                <path d="M0 120 Q50 80 100 100 Q150 60 200 90 Q250 50 300 80 Q350 40 400 70 L400 120 Z" fill="currentColor" />
                <path d="M0 120 Q80 70 160 100 Q240 50 320 85 Q360 60 400 90 L400 120 Z" fill="currentColor" opacity="0.7" />
            </svg>
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234b5563' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            <div className="auth-page-shell relative w-full max-w-md max-h-full overflow-y-auto">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="auth-login-card-header relative flex flex-col items-center bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-800 dark:to-emerald-900 overflow-hidden">
                        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 120" fill="none" preserveAspectRatio="xMidYMax slice">
                            <path d="M0 120 Q50 80 100 100 Q150 60 200 90 Q250 50 300 80 Q350 40 400 70 L400 120 Z" fill="currentColor" />
                            <path d="M0 120 Q80 70 160 100 Q240 50 320 85 Q360 60 400 90 L400 120 Z" fill="currentColor" opacity="0.7" />
                        </svg>
                        <div className="relative auth-page-logo rounded-2xl bg-white/20 backdrop-blur-sm ring-4 ring-white/30 flex items-center justify-center text-2xl sm:text-3xl">
                            🏪
                        </div>
                        <h1 className="relative auth-page-title text-white drop-shadow-sm">{t('pos_login_title')}</h1>
                        <p className="relative auth-page-subtitle text-teal-100 mt-1">{t('pos_login_sign_with_cnic')}</p>
                    </div>

                    <div className="auth-login-card-body">
                        <form onSubmit={submitForm} className="space-y-5">
                            <div>
                                <label htmlFor="loginId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t('pos_login_cnic_field')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IconCreditCard className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="loginId"
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={data.userEmail}
                                        onChange={(e) => handleInputChange('userEmail', e.target.value)}
                                        placeholder="3310112345678"
                                        className={`form-input pl-10 w-full focus:border-teal-600 focus:ring-teal-600/20 ${errors.userEmail ? 'border-danger' : ''}`}
                                        disabled={loading}
                                    />
                                </div>
                                {errors.userEmail && <p className="mt-1 text-sm text-danger">{errors.userEmail}</p>}
                            </div>

                            <div>
                                <label htmlFor="Password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t('pos_login_password')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IconLockDots className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.userPassword}
                                        onChange={(e) => handleInputChange('userPassword', e.target.value)}
                                        placeholder={t('pos_password_ph')}
                                        className={`form-input pl-10 pr-10 w-full focus:border-teal-600 focus:ring-teal-600/20 ${errors.userPassword ? 'border-danger' : ''}`}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? t('pos_login_hide') : t('pos_login_show')}
                                    </button>
                                </div>
                                {errors.userPassword && <p className="mt-1 text-sm text-danger">{errors.userPassword}</p>}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        {t('pos_login_remember_me')}
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="auth-page-btn w-full flex justify-center items-center py-3 rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 focus:ring-2 focus:ring-teal-600 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5 mr-2" /> {t('pos_login_signing_in')}
                                    </>
                                ) : (
                                    t('pos_login_sign_in_btn')
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PesticidePosLogin;
