import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconLockDots from '../../components/Icon/IconLockDots';
import IconUser from '../../components/Icon/IconUser';
import { Notification } from '../../helperComponents/Notification';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { showSubscriptionExpired } from '../../utils/sweetAlert';
import axios from 'axios';

const CustomerLogin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [data, setData] = useState({ cusCNIC: '', cusPassword: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ cusCNIC: '', cusPassword: '' });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Sign In'));
    }, [dispatch]);

    const validateForm = () => {
        const newErrors = { cusCNIC: '', cusPassword: '' };
        let isValid = true;
        const cnic = String(data.cusCNIC || '').trim().replace(/\D/g, '');
        if (cnic.length < 10) {
            newErrors.cusCNIC = 'Valid CNIC (13 digits) required';
            isValid = false;
        }
        if (!data.cusPassword) {
            newErrors.cusPassword = 'Password is required';
            isValid = false;
        } else if (data.cusPassword.length < 3) {
            newErrors.cusPassword = 'Password must be at least 3 characters';
            isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    };

    const submitForm = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/customer/login`,
                { cusCNIC: data.cusCNIC.trim(), cusPassword: data.cusPassword },
                { validateStatus: (s) => s < 500 }
            );
            if (response.data.subscriptionExpired) {
                showSubscriptionExpired();
                return;
            }
            if (response.data.status === 400 || response.status === 400) {
                Notification({ text: response.data.message || 'Invalid CNIC or password', color: 'danger' });
                return;
            }
            if (response.data.token && response.data.data) {
                const userInfo = response.data;
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userInformation', JSON.stringify(userInfo));
                localStorage.setItem('userRole', 'customer');
                localStorage.setItem('token', userInfo.token);
                Notification({ text: 'Login successful', color: 'success' });
                navigate('/dashboard');
            } else {
                Notification({ text: response.data.message || 'Login failed', color: 'danger' });
            }
        } catch (err: any) {
            Notification({ text: err.response?.data?.message || 'Login failed', color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen overflow-hidden relative flex items-center justify-center px-4 py-4">
            {/* Agriculture landscape background */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-emerald-50 to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-emerald-200/70 via-emerald-100/30 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/10" />
            <svg className="absolute bottom-0 left-0 w-full h-48 text-emerald-300/60 dark:text-emerald-900/40" viewBox="0 0 400 120" fill="none" preserveAspectRatio="none">
                <path d="M0 120 Q50 80 100 100 Q150 60 200 90 Q250 50 300 80 Q350 40 400 70 L400 120 Z" fill="currentColor" />
                <path d="M0 120 Q80 70 160 100 Q240 50 320 85 Q360 60 400 90 L400 120 Z" fill="currentColor" opacity="0.7" />
            </svg>
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234b5563' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

            <div className="auth-page-shell relative w-full max-w-md max-h-full overflow-y-auto">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header — height reduced (less vertical padding, smaller logo) */}
                    <div className="auth-login-card-header relative flex flex-col items-center bg-gradient-to-r from-green-700 to-green-800 dark:from-green-800 dark:to-green-900 overflow-hidden !py-5">
                        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 120" fill="none" preserveAspectRatio="xMidYMax slice">
                            <path d="M0 120 Q50 80 100 100 Q150 60 200 90 Q250 50 300 80 Q350 40 400 70 L400 120 Z" fill="currentColor" />
                            <path d="M0 120 Q80 70 160 100 Q240 50 320 85 Q360 60 400 90 L400 120 Z" fill="currentColor" opacity="0.7" />
                        </svg>
                        <div className="relative auth-page-logo !w-14 !h-14 rounded-2xl bg-white/20 backdrop-blur-sm ring-4 ring-white/30 flex items-center justify-center">
                            <img src="/assets/images/commission-shop-logo.png" alt="Commission Shop" className="w-full h-full object-contain p-2" />
                        </div>
                        <h1 className="relative auth-page-title text-white drop-shadow-sm !text-xl !mt-2">Sign In</h1>
                        <p className="relative auth-page-subtitle text-green-100 !mt-0.5 !mb-0">Sign in with your CNIC</p>
                    </div>
                    {/* Body — height increased (more vertical padding, more spacing between fields) */}
                    <div className="auth-login-card-body !py-10">
                        <form onSubmit={submitForm} className="space-y-7">
                            <div>
                                <label htmlFor="CNIC" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    CNIC
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IconUser className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="CNIC"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={15}
                                        value={data.cusCNIC}
                                        onChange={(e) => { setData((p) => ({ ...p, cusCNIC: e.target.value })); if (errors.cusCNIC) setErrors((p) => ({ ...p, cusCNIC: '' })); }}
                                        placeholder="Enter CNIC (e.g. 3310112345678)"
                                        className={`form-input pl-10 w-full !py-3 focus:border-green-600 focus:ring-green-600/20 ${errors.cusCNIC ? 'border-danger' : ''}`}
                                        disabled={loading}
                                    />
                                </div>
                                {errors.cusCNIC && <p className="mt-1 text-sm text-danger">{errors.cusCNIC}</p>}
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
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.cusPassword}
                                        onChange={(e) => { setData((p) => ({ ...p, cusPassword: e.target.value })); if (errors.cusPassword) setErrors((p) => ({ ...p, cusPassword: '' })); }}
                                        placeholder="Password"
                                        className={`form-input pl-10 pr-10 w-full !py-3 focus:border-green-600 focus:ring-green-600/20 ${errors.cusPassword ? 'border-danger' : ''}`}
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
                                {errors.cusPassword && <p className="mt-1 text-sm text-danger">{errors.cusPassword}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="auth-page-btn w-full flex justify-center items-center !py-3.5 rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 focus:ring-2 focus:ring-green-600 disabled:opacity-50"
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

export default CustomerLogin;
