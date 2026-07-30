import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconMail from '../../components/Icon/IconMail';
import IconLockDots from '../../components/Icon/IconLockDots';
import IconUser from '../../components/Icon/IconUser';
import { Notification } from './../../helperComponents/Notification';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { showSubscriptionExpiringSoon, showSubscriptionExpired } from '../../utils/sweetAlert';
import axios from 'axios';

const LoginBoxed = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(setPageTitle('Login'));
    }, [dispatch]);

    const [data, setData] = useState({
        userEmail: "",
        userPassword: ""
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        userEmail: "",
        userPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);

    const validateForm = () => {
        const newErrors = {
            userEmail: "",
            userPassword: ""
        };
        let isValid = true;

        if (!data.userEmail.trim()) {
            newErrors.userEmail = "Email is required";
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.userEmail)) {
            newErrors.userEmail = "Please enter a valid email address";
            isValid = false;
        }

        if (!data.userPassword) {
            newErrors.userPassword = "Password is required";
            isValid = false;
        } else if (data.userPassword.length < 3) {
            newErrors.userPassword = "Password must be at least 3 characters";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleInputChange = (field: string, value: string) => {
        setData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const submitForm = async (e?: React.FormEvent) => {
        e?.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${ServerSetting.serUrl}/api/login`, data, {
                validateStatus: (status) => status < 500 // Don't throw for 4xx errors
            });

            // Handle 429 rate limit error
            if (response.status === 429) {
                const retryAfter = response.data.retryAfter || 60;
                Notification({ 
                    text: `Too many requests. Please wait ${retryAfter} seconds and try again.`, 
                    color: 'warning' 
                });
                return;
            }

            // Handle subscription expired - show SweetAlert and block login
            if (response.data.subscriptionExpired) {
                showSubscriptionExpired();
                return;
            }

            // Handle other 400 errors (bad credentials, blocked, etc.)
            if (response.data.status === 400 || response.status === 400) {
                Notification({ text: response.data.message || 'Invalid credentials', color: 'danger' });
                return;
            }

            // Handle successful login
            if (response.data.token && response.data.data) {
                const userInfo = response.data;

                if (!userInfo || typeof userInfo.data.userRole === "undefined") {
                    Notification({ text: 'Invalid user data received from server', color: 'danger' });
                    return;
                }

                // Store user information
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userInformation', JSON.stringify(userInfo));
                localStorage.setItem('userRole', userInfo.data.userRole.toString());
                // Store token both in userInfo and separately for easy access
                localStorage.setItem('token', userInfo.token);
                
                // Ensure token is also in userInfo object
                if (!userInfo.token) {
                    userInfo.token = userInfo.token;
                }

                Notification({ text: 'Login Successfully', color: 'success' });
                navigate('/dashboard');

                // If subscription is active but expiring within 7 days, show SweetAlert
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
            console.error('Login error:', error);
            if (error.response?.status === 429) {
                Notification({ 
                    text: 'Too many login attempts. Please wait a moment and try again.', 
                    color: 'warning' 
                });
            } else {
                Notification({ 
                    text: error.response?.data?.message || error.message || "Something went wrong", 
                    color: 'danger' 
                });
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="auth-page-root bg-gradient-to-br from-primary-50 via-white to-success-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232d8659' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-success-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-harvest-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="auth-page-shell">
                {/* Login Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header Section */}
                    <div className="auth-page-header bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900">
                        <div className="flex justify-center mb-4">
                            <div className="w-24 h-24 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden p-1.5">
                                <img src="/assets/images/commission-shop-logo.png" alt="Commission Shop" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-primary-100 text-sm">Sign in to your Commission Shop account</p>
                    </div>

                    {/* Form Section */}
                    <div className="auth-page-body">
                        <form onSubmit={submitForm} className="space-y-6">
                            {/* Email Field */}
                                <div>
                                <label htmlFor="Email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IconMail className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="Email"
                                        type="email"
                                        value={data.userEmail}
                                        onChange={(e) => handleInputChange('userEmail', e.target.value)}
                                        placeholder="Enter your email"
                                        className={`form-input pl-10 w-full transition-all duration-300 ${
                                            errors.userEmail 
                                                ? 'border-danger focus:ring-danger' 
                                                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                                        }`}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                {errors.userEmail && (
                                    <p className="mt-1 text-sm text-danger flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.userEmail}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                                <div>
                                <label htmlFor="Password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IconLockDots className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="Password"
                                        type={showPassword ? "text" : "password"}
                                        value={data.userPassword}
                                        onChange={(e) => handleInputChange('userPassword', e.target.value)}
                                        placeholder="Enter your password"
                                        className={`form-input pl-10 pr-10 w-full transition-all duration-300 ${
                                            errors.userPassword 
                                                ? 'border-danger focus:ring-danger' 
                                                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                                        }`}
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.userPassword && (
                                    <p className="mt-1 text-sm text-danger flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.userPassword}
                                    </p>
                                )}
                            </div>

                            {/* Forgot Password Link */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        Remember me
                                    </label>
                                </div>
                                <Link
                                    to="/forgotpassword"
                                    className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                                    loading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5 inline-block mr-2"></span>
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <IconUser className="w-5 h-5 mr-2" />
                                        Sign In
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Don't have an account?{' '}
                                <Link
                                    to="/register"
                                    className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Commission Shop Management System
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Agricultural & Grain Market Management
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};

export default LoginBoxed;
