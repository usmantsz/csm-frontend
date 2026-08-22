import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconCreditCard from '../../components/Icon/IconCreditCard';
import IconLockDots from '../../components/Icon/IconLockDots';
import { Notification } from '../../helperComponents/Notification';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import axios from 'axios';

const AdminLogin = () => {
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
    const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('remember_admin') === 'true');

    useEffect(() => {
        const saved = localStorage.getItem('remember_admin_cnic');
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

                if (userRole === 1) {
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

                // Remember me: store CNIC only (never store password).
                // Actual username/password saving is handled by the
                // browser's native password manager via autoComplete
                // attributes + a real form submit event below.
                if (rememberMe) {
                    localStorage.setItem('remember_admin', 'true');
                    localStorage.setItem('remember_admin_cnic', String(data.userEmail || '').replace(/\D/g, '').slice(0, 13));
                } else {
                    localStorage.removeItem('remember_admin');
                    localStorage.removeItem('remember_admin_cnic');
                }

                Notification({ text: 'Login successful', color: 'success' });
                navigate('/dashboard');
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
        <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative flex items-center justify-center px-4 py-4">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234b5563' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
            <div className="auth-page-shell relative w-full max-w-md max-h-full overflow-y-auto">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="auth-login-card-header relative flex flex-col items-center bg-gradient-to-r from-gray-700 to-gray-800 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                        <div className="relative auth-page-logo rounded-2xl bg-white/20 backdrop-blur-sm ring-4 ring-white/30 flex items-center justify-center">
                            <img src="/assets/images/commission-shop-logo.png" alt="Commission Shop" className="w-full h-full object-contain p-2" />
                        </div>
                        <h1 className="relative auth-page-title text-white">Sign In</h1>
                        <p className="relative auth-page-subtitle text-gray-300 mt-1">Sign in with CNIC</p>
                    </div>
                    <div className="auth-login-card-body">
                        {/* autoComplete="on" + name attributes on the real <form>/<input> elements
                            let Chrome/Edge/Firefox detect this as a login form and offer to
                            save the username + password in the browser's password manager. */}
                        <form onSubmit={submitForm} className="space-y-5" autoComplete="on">
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
                                        className={`form-input pl-10 w-full ${errors.userEmail ? 'border-danger' : ''}`}
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
                                        className={`form-input pl-10 pr-10 w-full ${errors.userPassword ? 'border-danger' : ''}`}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {errors.userPassword && <p className="mt-1 text-sm text-danger">{errors.userPassword}</p>}
                            </div>
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-gray-700 focus:ring-gray-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                    Remember me
                                </label>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="auth-page-btn w-full flex justify-center items-center py-3 rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
