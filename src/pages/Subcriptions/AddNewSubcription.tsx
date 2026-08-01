import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { Notification } from './../../helperComponents/Notification';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { useNavigate } from "react-router-dom";
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
interface SubscriptionForm {
    subName: string;
    subDescription: string;
    subPrice: number | string;
    subCrop: number | string;
    subType: number | string;
    timeDuration: number | string;
}

interface FormErrors {
    [key: string]: string;
}

const AddNewSubscription = () => {
    const { t } = useTranslation();
    const { token } = useAuthToken();
    const navigate = useNavigate();
    const filedsName = {
        subName: "",
        subDescription: "",
        subPrice: "",
        subCrop: "",
        subType: 3,
        timeDuration: "",
    };
    const [formData, setFormData] = useState<SubscriptionForm>(filedsName);

    const [errors, setErrors] = useState<FormErrors>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleDescriptionChange = (value: string) => {
        setFormData((prevData) => ({
            ...prevData,
            subDescription: value,
        }));
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};

        if (!formData.subName.trim()) newErrors.subName = t('validation_sub_name_required');
        if (!formData.subDescription.trim()) newErrors.subDescription = t('validation_description_required');
        if (!formData.subPrice || +formData.subPrice <= 0)
            newErrors.subPrice = t('validation_price_positive');
        if (!formData.subCrop || +formData.subCrop <= 0)
            newErrors.subCrop = t('validation_crop_required');
        if (!formData.timeDuration || +formData.timeDuration <= 0)
            newErrors.timeDuration = t('validation_duration_positive');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const response = await axios.post(`${ServerSetting.serUrl}/api/addsub`, formData, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
            });

            if (response.status === 200) {
                // alert(response.data.message);
                Notification({ text: response.data.message, color: 'success' });
                // Clear form after successful submission
                setFormData(filedsName);
                setErrors({});
            } else {
                console.error("Error submitting form:", response.data);
                alert("Failed to submit the form. Please try again.");
            }
        } catch (error) {
            console.error("An error occurred:", error);
            Notification({ text: "An error occurred while submitting the form. Please try again.", color: 'success' });
            // alert("An error occurred while submitting the form. Please try again.");
        }
    };

    const renderInputField = (
        id: string,
        label: string,
        type: string,
        placeholder: string
    ) => (
        <div className="min-w-0">
            <label htmlFor={id} className="form-label">{label}</label>
            <input
                id={id}
                name={id}
                type={type}
                placeholder={placeholder}
                className={`form-input w-full ${errors[id] ? "border-red-500" : ""}`}
                value={formData[id as keyof SubscriptionForm]}
                onChange={handleChange}
            />
            {errors[id] && <span className="text-red-500 text-sm">{errors[id]}</span>}
        </div>
    );

    return (
        <div className="space-y-6">
          <div className="w-full flex justify-end">
        <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
        >
            <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t('back_to_dashboard')}
        </button>
            </div>

            <div className="rounded-2xl border border-[#ebedf2] bg-white dark:bg-black dark:border-[#191e3a] p-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {renderInputField("subName", t('form_subscription_name'), "text", t('form_subscription_name'))}
                {renderInputField("timeDuration", t('form_duration_months'), "number", t('form_duration_placeholder'))}
                {renderInputField("subPrice", t('form_price_pkr'), "number", t('form_price_placeholder'))}
                {renderInputField("subCrop", t('form_crop'), "number", t('form_crop_name_placeholder'))}
                <div className="sm:col-span-2 min-w-0">
                    <label htmlFor="subDescription" className="form-label">{t('form_description')}</label>
                    <div className="overflow-hidden rounded-lg">
                        <ReactQuill
                            id="subDescription"
                            value={formData.subDescription}
                            onChange={handleDescriptionChange}
                            className={`quill-editor ${errors.subDescription ? "border-red-500" : ""
                                }`}
                        />
                    </div>
                    {errors.subDescription && (
                        <span className="text-red-500 text-sm">{errors.subDescription}</span>
                    )}
                </div>
            </div>
            <div className="mt-5 flex justify-end">
                <button
                    type="button"
                    className="btn btn-primary rounded-xl transition-transform duration-200 hover:-translate-y-0.5"
                    onClick={handleSubmit}
                >
                    {t('btn_add_subscription')}
                </button>
            </div>
            </div>
        </div>
    );
};

export default AddNewSubscription;
