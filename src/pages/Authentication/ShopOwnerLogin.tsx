import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconCreditCard from '../../components/Icon/IconCreditCard';
import IconLockDots from '../../components/Icon/IconLockDots';
import { Notification } from '../../helperComponents/Notification';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { showSubscriptionExpiringSoon, showSubscriptionExpired } from '../../utils/sweetAlert';
import axios from 'axios';

const ShopOwnerLogin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(setPageTitle('Sign In'));
    }, [dispatch]);

    const [data, setData] = useState({
        userEmail: '',
        userPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ userEmail: '', userPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('remember_shopowner') === 'true');

    useEffect(() => {
        const saved = localStorage.getItem('remember_shopowner_cnic');
        if (saved) {
            setData((prev) => ({ ...prev, userEmail: saved }));
        }
    }, []);

    const validateForm = () => {
        const newErrors = { userEmail: '', userPassword: '' };
        let isValid = true;
        const cnicDigits = String(data.userEmail || '').replace(/\D/g, '').trim();

        if (!cnicDigits) {
            newErrors.userEmail = 'CNIC is required';
            isValid = false;
        } else if (cnicDigits.length !== 13) {
            newErrors.userEmail = 'CNIC must be 13 digits';
            isValid = false;
        }

        if (!data.userPassword) {
            newErrors.userPassword = 'Password is required';
            isValid = false;
        } else if (data.userPassword.length < 3) {
            newErrors.userPassword = 'Password must be at least 3 characters';
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
        if (errors[field as keyof typeof errors]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const submitForm = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/login`,
                { userEmail: String(data.userEmail || '').replace(/\D/g, ''), userPassword: data.userPassword },
                { validateStatus: (status) => status < 500 }
            );

            if (response.status === 429) {
                Notification({
                    text: `Too many requests. Please wait ${response.data.retryAfter || 60} seconds and try again.`,
                    color: 'warning',
                });
                return;
            }

            if (response.data.subscriptionExpired) {
                showSubscriptionExpired();
                return;
            }

            if (response.data.status === 400 || response.status === 400) {
                Notification({
                    text: response.data.message || 'Invalid credentials',
                    color: 'danger',
                });
                return;
            }

            if (response.data.token && response.data.data) {
                const userInfo = response.data;
                const userRole = userInfo.data?.userRole;

                if (userRole === 0) {
                    Notification({
                        text: 'This account cannot sign in here. Please use the correct sign-in page.',
                        color: 'warning',
                    });
                    return;
                }

                if (typeof userRole === 'undefined') {
                    Notification({ text: 'Invalid user data received from server', color: 'danger' });
                    return;
                }

                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userInformation', JSON.stringify(userInfo));
                localStorage.setItem('userRole', userRole.toString());
                localStorage.setItem('token', userInfo.token);
                localStorage.removeItem('loginSource');

                // Remember me: store CNIC only (never store password).
                // Actual username/password saving is handled by the
                // browser's native password manager via autoComplete
                // attributes + a real form submit event below.
                if (rememberMe) {
                    localStorage.setItem('remember_shopowner', 'true');
                    localStorage.setItem('remember_shopowner_cnic', String(data.userEmail || '').replace(/\D/g, '').slice(0, 13));
                } else {
                    localStorage.removeItem('remember_shopowner');
                    localStorage.removeItem('remember_shopowner_cnic');
                }

                Notification({ text: 'Login successful', color: 'success' });
                navigate('/dashboard');

                if (response.data.subscriptionExpiringSoon) {
                    setTimeout(() => {
                        showSubscriptionExpiringSoon(
                            response.data.subscriptionExpireDate,
                            response.data.subscriptionDaysLeft
                        );
                    }, 500);
                }
            } else {
                Notification({ text: response.data.message || 'Login failed', color: 'danger' });
            }
        } catch (error: any) {
            Notification({
                text: error.response?.data?.message || error.message || 'Something went wrong',
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen overflow-hidden relative flex items-center justify-center px-4 py-4">
            <div className="auth-agri-sky" />
            <div className="auth-agri-field" />
            <div className="auth-agri-hills" />
            <div className="auth-agri-wheat auth-agri-wheat-right" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/20 pointer-events-none" />

            <div className="relative w-full max-w-md max-h-full overflow-y-auto">
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/50">
                    <div className="relative flex flex-col items-center px-6 pt-8 pb-6 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 dark:from-amber-800 dark:to-yellow-900 overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <svg className="w-full h-full" viewBox="0 0 400 120" fill="none" preserveAspectRatio="xMidYMax slice">
                                <path d="M0 120 Q50 80 100 100 Q150 60 200 90 Q250 50 300 80 Q350 40 400 70 L400 120 Z" fill="currentColor" />
                                <path d="M0 120 Q80 70 160 100 Q240 50 320 85 Q360 60 400 90 L400 120 Z" fill="currentColor" opacity="0.7" />
                            </svg>
                        </div>
                        <div className="relative w-20 h-20 rounded-2xl bg-white/25 backdrop-blur-sm ring-4 ring-white/30 flex items-center justify-center mb-3">
                            <img src="/assets/images/commission-shop-logo.png" alt="Commission Shop" className="w-full h-full object-contain p-2" />
                        </div>
                        <h1 className="relative text-xl font-bold text-white drop-shadow-sm">Sign In</h1>
                        <p className="relative text-sm text-amber-100 mt-1.5">Sign in with CNIC</p>
                    </div>
                    <div className="px-6 py-8">
                        {/* autoComplete="on" + name attributes on the real <form>/<input> elements
                            let Chrome/Edge/Firefox detect this as a login form and offer to
                            save the username + password in the browser's password manager. */}
                        <form onSubmit={submitForm} className="space-y-6" autoComplete="on">
                            <div>
                                <label htmlFor="loginId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    CNIC
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IconCreditCard className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="loginId"
                                        name="username"
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        autoComplete="username"
                                        value={data.userEmail}
                                        onChange={(e) => handleInputChange('userEmail', e.target.value)}
                                        placeholder="3310112345678"
                                        className={`form-input pl-10 py-3 w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500/30 ${errors.userEmail ? 'border-danger focus:ring-danger/30' : ''}`}
                                        disabled={loading}
                                    />
                                </div>
                                {errors.userEmail && <p className="mt-1 text-sm text-danger">{errors.userEmail}</p>}
                            </div>
                            <div>
                                <label htmlFor="Password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IconLockDots className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="Password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={data.userPassword}
                                        onChange={(e) => handleInputChange('userPassword', e.target.value)}
                                        placeholder="Enter your password"
                                        className={`form-input pl-10 pr-10 py-3 w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500/30 ${errors.userPassword ? 'border-danger focus:ring-danger/30' : ''}`}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
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
                                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Remember me</label>
                                </div>
                                <Link to="/forgotpassword" className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:ring-2 focus:ring-amber-500/50 shadow-lg shadow-amber-900/20 disabled:opacity-50 transition-all duration-200"
                            >
                                {loading ? (
                                    <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5 mr-2" /> Signing in...</>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopOwnerLogin;
