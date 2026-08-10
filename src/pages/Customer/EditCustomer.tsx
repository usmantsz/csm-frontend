import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { Notification } from './../../helperComponents/Notification';
import { useShopId } from "./../../Hooks/useShopId";
import { useNavigate, useParams } from "react-router-dom";
import { t } from "i18next";

interface CustomerFormData {
    _id?: string;
    shopId: string;
    cusNameF: string;
    cusNameL: string;
    cusNumber: string;
    cusCNIC: string;
    cusAddress: string;
    cusPassword: string;
    confirmPassword: string;
}

const EditCustomer: React.FC = () => {
    const { token } = useAuthToken();
    const navigate = useNavigate();
    const { shopId, error } = useShopId();
    const { id } = useParams<{ id: string }>();

    if (error) {
        Notification({ text: error, color: 'error' });
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

    const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchCustomer = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${ServerSetting.serUrl}/api/viewcus/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = res.data.data?.[0];
                if (!data) throw new Error(t('customer_not_found'));

                setFormData({
                    _id: data._id,
                    shopId: data.shopId || shopId || "",
                    cusNameF: data.cusNameF || "",
                    cusNameL: data.cusNameL || "",
                    cusNumber: data.cusNumber || "",
                    cusCNIC: data.cusCNIC || "",
                    cusAddress: data.cusAddress || "",
                    cusPassword: "",
                    confirmPassword: "",
                });
            } catch (err: any) {
                Notification({
                    text: err.response?.data?.message || err.message || t('failed_fetch_customer_data'),
                    color: "error",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchCustomer();
    }, [id, token, shopId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === "cusCNIC") {
            // Only allow digits for CNIC
            const onlyNumbers = value.replace(/\D/g, "");
            setFormData(prev => ({ ...prev, [name]: onlyNumbers }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const validate = () => {
        const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};
        Object.entries(formData).forEach(([key, value]) => {
            if (key === "shopId" || key === "cusPassword" || key === "confirmPassword") return;
            if (!value) {
                newErrors[key as keyof CustomerFormData] = t('this_field_required');
            }
        });

        if (formData.cusPassword || formData.confirmPassword) {
            if (formData.cusPassword !== formData.confirmPassword) {
                newErrors.confirmPassword = t('passwords_do_not_match');
            }
        }

        return newErrors;
    };

    useEffect(() => {
        const validationErrors = validate();
        setIsFormValid(Object.keys(validationErrors).length === 0);
    }, [formData]);

    const handleSubmit = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length === 0) {
            setLoading(true);
            setErrors({});

            const { confirmPassword, ...submitData } = formData;

            try {
                const response = await axios.post(`${ServerSetting.serUrl}/api/editcus`, submitData, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                Notification({
                    text: response.data.message || t('customer_updated_success'),
                    color: 'success',
                });

                setFormData({
                    shopId: shopId || "",
                    cusNameF: "",
                    cusNameL: "",
                    cusNumber: "",
                    cusCNIC: "",
                    cusAddress: "",
                    cusPassword: "",
                    confirmPassword: "",
                });
                navigate('/customerlist');
            } catch (error: any) {
                Notification({
                    text: error.response?.data?.message || t('failed_fetch_customer_data'),
                    color: 'error',
                });
            } finally {
                setLoading(false);
            }
        } else {
            setErrors(validationErrors);
        }
    };

    const inputField = (
        label: string,
        name: keyof CustomerFormData,
        type: string = "text",
        showToggle?: boolean,
        toggleFn?: () => void,
        show?: boolean
    ) => (
        <div className="space-y-2">
            <label htmlFor={name} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {label}
                <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
                <input
                    id={name}
                    name={name}
                    type={showToggle && show !== undefined ? (show ? "text" : "password") : type}
                    className={`form-input w-full transition-all duration-200 ${
                        errors[name] 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                            : "border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
                    } rounded-lg px-4 py-2.5 bg-white dark:bg-[#1b2e4b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    disabled={loading}
                    maxLength={name === "cusCNIC" ? 13 : undefined}
                />
                {showToggle && toggleFn && (
                    <button
                        type="button"
                        onClick={toggleFn}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                    >
                        {show ? "Hide" : "Show"}
                    </button>
                )}
            </div>
            {errors[name] && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors[name]}
                </span>
            )}
        </div>
    );

    return (
        <div className="panel">
            <div className="mb-6">
                <h5 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t('edit_customer_page')}
                </h5>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t('update_customer_details_hint')}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {inputField(t('form_first_name'), "cusNameF")}
                {inputField(t('form_last_name'), "cusNameL")}
                {inputField(t('phone_number'), "cusNumber")}
                {inputField("CNIC", "cusCNIC", "text")}
                {inputField(t('form_password'), "cusPassword", "password", true, () => setShowPassword(!showPassword), showPassword)}
                {inputField(t('confirm_password'), "confirmPassword", "password", true, () => setShowConfirm(!showConfirm), showConfirm)}

                <div className="sm:col-span-2 space-y-2">
                    <label htmlFor="cusAddress" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {t('address')}
                        <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                        id="cusAddress"
                        name="cusAddress"
                        rows={4}
                        className={`form-textarea w-full transition-all duration-200 ${
                            errors.cusAddress 
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                                : "border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
                        } rounded-lg px-4 py-2.5 bg-white dark:bg-[#1b2e4b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
                        placeholder={t('enter_address')}
                        value={formData.cusAddress}
                        onChange={handleChange}
                        disabled={loading}
                    />
                    {errors.cusAddress && (
                        <span className="text-red-500 text-sm flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.cusAddress}
                        </span>
                    )}
                </div>

                <div className="sm:col-span-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/customerlist')}
                        className="btn btn-outline-danger"
                        disabled={loading}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-primary ${!isFormValid || loading ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={handleSubmit}
                        disabled={!isFormValid || loading}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-[spin_2s_linear_infinite] border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                                {t('saving')}
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {t('update_customer')}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditCustomer;
