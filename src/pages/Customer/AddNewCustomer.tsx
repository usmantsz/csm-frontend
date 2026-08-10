import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { Notification } from './../../helperComponents/Notification';
import { useShopId } from "./../../Hooks/useShopId";
import { showError, showSuccess, confirmCreate, showLoading, closeAlert } from '../../utils/sweetAlert';
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setPageTitle } from './../../store/themeConfigSlice';
import IconUser from './../../components/Icon/IconUser';
import IconPhone from './../../components/Icon/IconPhone';
import IconLockDots from './../../components/Icon/IconLockDots';
import IconMapPin from './../../components/Icon/IconMapPin';
import IconCreditCard from './../../components/Icon/IconCreditCard';
import IconArrowLeft from "../../components/Icon/IconArrowLeft";

interface CustomerFormData {
    shopId: string;
    cusNameF: string;
    cusNameL: string;
    cusNumber: string;
    cusCNIC: string;
    cusAddress: string;
    cusPassword: string;
    confirmPassword: string;
}

const AddNewCustomer: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { token, user } = useAuthToken();
    const navigate = useNavigate();
    const { shopId, error } = useShopId();

    useEffect(() => {
        dispatch(setPageTitle(t('add_new_customer_page')));
    }, [dispatch, t]);

    if (error) {
        Notification({
            text: error,
            color: 'error',
        });
    }

    const [formData, setFormData] = useState<CustomerFormData>({
        shopId: shopId || "",
        cusNameF: "",
        cusNameL: "",
        cusNumber: "",
        cusCNIC: "",
        cusAddress: "",
        cusPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (shopId) {
            setFormData(prev => ({ ...prev, shopId }));
        }
    }, [shopId]);

    const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === "cusCNIC") {
            const onlyDigits = value.replace(/\D/g, "").slice(0, 13);
            setFormData(prev => ({ ...prev, [name]: onlyDigits }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const validate = () => {
        const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};

        if (!formData.cusNameF.trim()) {
            newErrors.cusNameF = t('first_name_required');
        }
        if (!formData.cusNameL.trim()) {
            newErrors.cusNameL = t('last_name_required');
        }
        if (!formData.cusNumber.trim()) {
            newErrors.cusNumber = t('phone_required');
        } else if (!/^\d{10,11}$/.test(formData.cusNumber)) {
            newErrors.cusNumber = t('valid_phone');
        }
        if (!formData.cusCNIC.trim()) {
            newErrors.cusCNIC = t('cnic_required');
        } else if (formData.cusCNIC.length !== 13) {
            newErrors.cusCNIC = t('cnic_13_digits');
        }
        if (!formData.cusAddress.trim()) {
            newErrors.cusAddress = t('address_required');
        }
        if (!formData.cusPassword) {
            newErrors.cusPassword = t('password_required');
        } else if (formData.cusPassword.length < 6) {
            newErrors.cusPassword = t('password_min_6');
        }
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = t('confirm_password_required');
        } else if (formData.cusPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = t('passwords_do_not_match');
        }

        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const userShopId = (user as any)?.shopId || shopId;

        if (!userShopId) {
            Notification({
                text: t('shop_id_missing'),
                color: 'danger',
            });
            return;
        }

        const confirmed = await confirmCreate(t('customer'), { title: t('create_confirm_title'), text: t('create_confirm_text', { item: t('customer') }), confirmButtonText: t('yes_create'), cancelButtonText: t('cancel') });
        if (!confirmed) return;

        setLoading(true);
        setErrors({});
        showLoading(t('creating_customer'));

        const { confirmPassword, ...submitData } = formData;

        const finalSubmitData = {
            ...submitData,
            shopId: userShopId
        };

        try {
            const response = await axios.post(`${ServerSetting.serUrl}/api/addcus`, finalSubmitData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.status === 200) {
                closeAlert();
                showSuccess(response.data.message || t('customer_created_success'));
                setTimeout(() => {
                    navigate('/customerlist');
                }, 1500);
            } else {
                closeAlert();
                const errorMessage = response.data.message || t('failed_add_customer');
                if (errorMessage.includes('CNIC') || errorMessage.includes('already registered')) {
                    showError(errorMessage, t('customer_already_exists_title'));
                } else {
                    showError(errorMessage);
                }
            }
        } catch (error: any) {
            closeAlert();
            const errorMessage = error.response?.data?.message || t('error_add_customer_retry');
            if (errorMessage.includes('CNIC') || errorMessage.includes('already registered')) {
                showError(errorMessage, t('customer_already_exists_title'));
            } else {
                showError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // Reusable input field renderer
    const renderField = (
        label: string,
        name: keyof CustomerFormData,
        icon: React.ReactNode,
        type: string = "text",
        placeholder: string = "",
        helpText?: string
    ) => (
        <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {label} <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                    {icon}
                </div>
                <input
                    type={type}
                    name={name}
                    value={formData[name] as string}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={`autofill-fix w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-[#0e1726] border ${
                        errors[name] ? 'border-red-500 focus:ring-red-500/40' : 'border-gray-300 dark:border-white/10 focus:ring-emerald-500/40'
                    } text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition`}
                />
            </div>
            {helpText && !errors[name] && (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-500">{helpText}</p>
            )}
            {errors[name] && (
                <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors[name]}
                </p>
            )}
        </div>
    );

            return (
        <div>
            {/* Override browser autofill text color so it stays blue instead of the browser's default white/black */}
            <style>{`
                input.autofill-fix:-webkit-autofill,
                input.autofill-fix:-webkit-autofill:hover,
                input.autofill-fix:-webkit-autofill:focus,
                input.autofill-fix:-webkit-autofill:active {
                    -webkit-text-fill-color: #111827;
                    caret-color: #111827;
                    box-shadow: 0 0 0px 1000px #ffffff inset;
                    -webkit-box-shadow: 0 0 0px 1000px #ffffff inset;
                    border-color: #d1d5db;
                    transition: background-color 5000s ease-in-out 0s;
                }
                .dark input.autofill-fix:-webkit-autofill,
                .dark input.autofill-fix:-webkit-autofill:hover,
                .dark input.autofill-fix:-webkit-autofill:focus,
                .dark input.autofill-fix:-webkit-autofill:active {
                    -webkit-text-fill-color: #ffffff;
                    caret-color: #ffffff;
                    box-shadow: 0 0 0px 1000px #0e1726 inset;
                    -webkit-box-shadow: 0 0 0px 1000px #0e1726 inset;
                    border-color: rgba(255, 255, 255, 0.1);
                }
                input.autofill-fix-pw:-webkit-autofill,
                input.autofill-fix-pw:-webkit-autofill:hover,
                input.autofill-fix-pw:-webkit-autofill:focus,
                input.autofill-fix-pw:-webkit-autofill:active {
                    -webkit-text-fill-color: #111827;
                    caret-color: #111827;
                    box-shadow: 0 0 0px 1000px #f9fafb inset;
                    -webkit-box-shadow: 0 0 0px 1000px #f9fafb inset;
                    border-color: #d1d5db;
                    transition: background-color 5000s ease-in-out 0s;
                }
                .dark input.autofill-fix-pw:-webkit-autofill,
                .dark input.autofill-fix-pw:-webkit-autofill:hover,
                .dark input.autofill-fix-pw:-webkit-autofill:focus,
                .dark input.autofill-fix-pw:-webkit-autofill:active {
                    -webkit-text-fill-color: #ffffff;
                    caret-color: #ffffff;
                    box-shadow: 0 0 0px 1000px #171f2f inset;
                    -webkit-box-shadow: 0 0 0px 1000px #171f2f inset;
                    border-color: rgba(255, 255, 255, 0.1);
                }
            `}</style>
            {/* Back to Customer List - outside the card, top left */}
            <div className="flex justify-end"> 
            <button
                            type="button"
                            onClick={() => navigate('/customerlist')}
                            className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                        >
                            <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                            {t('back_to_customer_list')}
            </button>
            </div>
            

            {/* Form Card */}
            <div className="rounded-xl mt-4 bg-white dark:bg-[#0e1726] border border-gray-300 dark:border-white/10 shadow-sm p-6 sm:p-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {t('add_new_customer_page')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {t('register_new_customer_shop')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    {/* Personal Info Section */}
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-4">
                            {t('personal_information')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {renderField(t('form_first_name'), "cusNameF", <IconUser className="w-5 h-5" />, "text", t('enter_first_name'))}
                            {renderField(t('form_last_name'), "cusNameL", <IconUser className="w-5 h-5" />, "text", t('enter_last_name'))}
                            {renderField(t('phone_number'), "cusNumber", <IconPhone className="w-5 h-5" />, "tel", "03XX-XXXXXXX", t('phone_help_text'))}
                            {renderField(t('form_cnic'), "cusCNIC", <IconCreditCard className="w-5 h-5" />, "text", "1234567890123", t('cnic_help_text'))}
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-4">
                            {t('account_security')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Password */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('form_password')} <span className="text-red-500 dark:text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                                        <IconLockDots className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="cusPassword"
                                        value={formData.cusPassword}
                                        onChange={handleChange}
                                        placeholder={t('form_enter_password')}
                                        className={`autofill-fix-pw w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-50 dark:bg-[#171f2f] border ${
                                            errors.cusPassword ? 'border-red-500 focus:ring-red-500/40' : 'border-gray-300 dark:border-white/10 focus:ring-emerald-500/40'
                                        } text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                        tabIndex={-1}
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
                                {errors.cusPassword && (
                                    <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.cusPassword}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('confirm_password')} <span className="text-red-500 dark:text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                                        <IconLockDots className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder={t('confirm_password_placeholder')}
                                        className={`autofill-fix-pw w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-50 dark:bg-[#171f2f] border ${
                                            errors.confirmPassword ? 'border-red-500 focus:ring-red-500/40' : 'border-gray-300 dark:border-white/10 focus:ring-emerald-500/40'
                                        } text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? (
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
                                    <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="mb-2">
                        <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-4">
                            {t('address')}
                        </h3>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('complete_address')} <span className="text-red-500 dark:text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none text-gray-400 dark:text-gray-500">
                                    <IconMapPin className="w-5 h-5" />
                                </div>
                                <textarea
                                    name="cusAddress"
                                    value={formData.cusAddress}
                                    onChange={handleChange}
                                    placeholder={t('enter_complete_address')}
                                    rows={4}
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-[#0e1726] border ${
                                        errors.cusAddress ? 'border-red-500 focus:ring-red-500/40' : 'border-gray-300 dark:border-white/10 focus:ring-emerald-500/40'
                                    } text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition resize-none`}
                                />
                            </div>
                            {errors.cusAddress && (
                                <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.cusAddress}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                        <Link
                            to="/customerlist"
                            className="flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                        >
                            {t('cancel')}
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition ${
                                loading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5 inline-block"></span>
                                    {t('saving')}
                                </>
                            ) : (
                                <>
                                    <IconUser className="w-5 h-5" />
                                    {t('save_customer_btn')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddNewCustomer;
