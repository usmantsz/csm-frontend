import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconMail from '../../components/Icon/IconMail';
import IconLockDots from '../../components/Icon/IconLockDots';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconKey from '../../components/Icon/IconLockDots';
import IconCheck from '../../components/Icon/IconCircleCheck';
import { Notification } from './../../helperComponents/Notification';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import axios from 'axios';

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(setPageTitle('Forgot Password'));
    }, [dispatch]);

    const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
    const [loading, setLoading] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [data, setData] = useState({
        userEmail: "",
        otp: "",
        userPassword: "",
        confirmPassword: ""
    });
    const [errors, setErrors] = useState({
        userEmail: "",
        otp: "",
        userPassword: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [receivedOTP, setReceivedOTP] = useState<string | null>(null); // For development only

    const validateEmail = () => {
        const newErrors = { ...errors, userEmail: "" };
        let isValid = true;

        if (!data.userEmail.trim()) {
            newErrors.userEmail = "Email is required";
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.userEmail)) {
            newErrors.userEmail = "Please enter a valid email address";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const validateOTP = () => {
        const newErrors = { ...errors, otp: "" };
        let isValid = true;

        if (!data.otp.trim()) {
            newErrors.otp = "OTP is required";
            isValid = false;
        } else if (data.otp.length !== 6) {
            newErrors.otp = "OTP must be 6 digits";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const validatePassword = () => {
        const newErrors = { ...errors, userPassword: "", confirmPassword: "" };
        let isValid = true;

        if (!data.userPassword) {
            newErrors.userPassword = "Password is required";
            isValid = false;
        } else if (data.userPassword.length < 6) {
            newErrors.userPassword = "Password must be at least 6 characters";
            isValid = false;
        }

        if (!data.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
            isValid = false;
        } else if (data.userPassword !== data.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
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

    // Step 1: Check email and send OTP
    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateEmail()) {
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/check-email`,
                { userEmail: data.userEmail },
                { validateStatus: (status) => status < 500 }
            );

            if (response.data.status === 200) {
                setStep('otp');
                Notification({
                    text: response.data.message || 'If this email is registered, a verification code has been sent.',
                    color: 'success',
                });
            } else {
                Notification({
                    text: response.data.message || 'Unable to process request. Please try again.',
                    color: 'danger',
                });
            }
        } catch (error: any) {
            Notification({ 
                text: error.response?.data?.message || "Error checking email", 
                color: 'danger' 
            });
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateOTP()) {
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/verify-otp`,
                {
                    userEmail: data.userEmail,
                    otp: data.otp
                },
                { validateStatus: (status) => status < 500 }
            );

            if (response.data.status === 200 && response.data.verified) {
                setOtpVerified(true);
                setStep('password');
                Notification({ 
                    text: 'OTP verified successfully! Please set your new password.', 
                    color: 'success' 
                });
            } else {
                Notification({ 
                    text: response.data.message || 'Invalid OTP', 
                    color: 'danger' 
                });
            }
        } catch (error: any) {
            Notification({ 
                text: error.response?.data?.message || "Error verifying OTP", 
                color: 'danger' 
            });
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!otpVerified) {
            Notification({ 
                text: 'Please verify OTP first', 
                color: 'warning' 
            });
            return;
        }

        if (!validatePassword()) {
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${ServerSetting.serUrl}/api/forgotpassword`,
                {
                    userEmail: data.userEmail,
                    userPassword: data.userPassword,
                    otp: data.otp,
                },
                {
                    validateStatus: (status) => status < 500
                }
            );

            if (response.data.status === 200) {
                Notification({ 
                    text: response.data.message || 'Password reset successfully!', 
                    color: 'success' 
                });
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                Notification({ 
                    text: response.data.message || 'Failed to reset password', 
                    color: 'danger' 
                });
            }
        } catch (error: any) {
            console.error('Reset password error:', error);
            Notification({ 
                text: error.response?.data?.message || "Something went wrong. Please try again.", 
                color: 'danger' 
            });
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
            <div className="auth-page-decor-blob absolute top-0 left-0 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
            <div className="auth-page-decor-blob absolute top-0 right-0 w-72 h-72 bg-success-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
            <div className="auth-page-decor-blob absolute -bottom-8 left-20 w-72 h-72 bg-harvest-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

            <div className="auth-page-shell">
                {/* Forgot Password Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header Section */}
                    <div className="auth-page-header bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900">
                        <div className="flex justify-center mb-3 sm:mb-4">
                            <div className="auth-page-logo rounded-full bg-white/20 backdrop-blur-sm w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                                <IconKey className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <h1 className="auth-page-title text-white">
                            {step === 'email' && 'Forgot Password'}
                            {step === 'otp' && 'Verify OTP'}
                            {step === 'password' && 'Reset Password'}
                        </h1>
                        <p className="auth-page-subtitle text-primary-100">
                            {step === 'email' && 'Enter your email to reset your password'}
                            {step === 'otp' && 'Enter the OTP sent to your email'}
                            {step === 'password' && 'Enter your new password'}
                        </p>
                    </div>

                    {/* Form Section */}
                    <div className="auth-page-body">
                        {/* Step 1: Email */}
                        {step === 'email' && (
                            <form onSubmit={handleCheckEmail} className="space-y-6">
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
                                            Checking...
                                        </>
                                    ) : (
                                        <>
                                            <IconMail className="w-5 h-5 mr-2" />
                                            Send OTP
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Step 2: OTP Verification */}
                        {step === 'otp' && (
                            <form onSubmit={handleVerifyOTP} className="space-y-6">
                                {/* Development: Show OTP */}
                                {receivedOTP && (
                                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <p className="text-xs text-yellow-800 dark:text-yellow-200 font-semibold mb-1">
                                            🧪 Development Mode - OTP:
                                        </p>
                                        <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                                            {receivedOTP}
                                        </p>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                            (This will be removed in production)
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="OTP" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Enter OTP
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <IconKey className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="OTP"
                                            type="text"
                                            value={data.otp}
                                            onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="Enter 6-digit OTP"
                                            maxLength={6}
                                            className={`form-input pl-10 text-center text-2xl tracking-widest font-bold w-full transition-all duration-300 ${
                                                errors.otp 
                                                    ? 'border-danger focus:ring-danger' 
                                                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                                            }`}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    {errors.otp && (
                                        <p className="mt-1 text-sm text-danger flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.otp}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        OTP is valid for 10 minutes
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('email');
                                            setData(prev => ({ ...prev, otp: "" }));
                                            setReceivedOTP(null);
                                        }}
                                        className="btn btn-outline-primary flex-1"
                                        disabled={loading}
                                    >
                                        <IconArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`btn btn-primary flex-1 ${
                                            loading ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5 inline-block mr-2"></span>
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <IconCheck className="w-5 h-5 mr-2" />
                                                Verify OTP
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 3: Password Reset */}
                        {step === 'password' && otpVerified && (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                {/* Success Message */}
                                <div className="mb-4 p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg flex items-center">
                                    <IconCheck className="w-5 h-5 text-success-600 dark:text-success-400 mr-2" />
                                    <p className="text-sm text-success-800 dark:text-success-200">
                                        OTP verified! Please set your new password.
                                    </p>
                                </div>

                                {/* New Password Field */}
                                <div>
                                    <label htmlFor="Password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        New Password
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
                                            placeholder="Enter new password"
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

                                {/* Confirm Password Field */}
                                <div>
                                    <label htmlFor="ConfirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <IconLockDots className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="ConfirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={data.confirmPassword}
                                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                            placeholder="Confirm new password"
                                            className={`form-input pl-10 pr-10 w-full transition-all duration-300 ${
                                                errors.confirmPassword 
                                                    ? 'border-danger focus:ring-danger' 
                                                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                                            }`}
                                            required
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showConfirmPassword ? (
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
                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-sm text-danger flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('otp');
                                            setData(prev => ({ ...prev, userPassword: "", confirmPassword: "" }));
                                        }}
                                        className="btn btn-outline-primary flex-1"
                                        disabled={loading}
                                    >
                                        <IconArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`btn btn-primary flex-1 ${
                                            loading ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5 inline-block mr-2"></span>
                                                Resetting...
                                            </>
                                        ) : (
                                            <>
                                                <IconKey className="w-5 h-5 mr-2" />
                                                Reset Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Footer */}
                        <div className="mt-6 text-center">
                            <Link
                                to="/login"
                                className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center justify-center"
                            >
                                <IconArrowLeft className="w-4 h-4 mr-1" />
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Commission Shop Management System
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

export default ForgotPassword;
