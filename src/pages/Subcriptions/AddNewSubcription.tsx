import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setPageTitle } from "../../store/themeConfigSlice";
import { Notification } from './../../helperComponents/Notification';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { useNavigate } from "react-router-dom";
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconArrowRight from "../../components/Icon/IconArrowRight";

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
    const dispatch = useDispatch();
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

    useEffect(() => {
        dispatch(setPageTitle(t('add_new_subscription_page')));
    }, [dispatch, t]);

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

    // Icon set matching the field types (name / calendar / price / crop)
    const FieldIcon = ({ path }: { path: string }) => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
        </svg>
    );

    const ICON_PATHS = {
        tag: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
        calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
        crop: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    };

    const renderInputField = (
        id: string,
        label: string,
        type: string,
        placeholder: string,
        icon?: string,
        suffix?: string
    ) => (
        <div className="space-y-2 min-w-0">
            <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300">
                {label} <span className="text-danger dark:text-emerald-400">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
                        <FieldIcon path={icon} />
                    </div>
                )}
                {id === 'subPrice' && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <span className="text-xs font-bold text-primary dark:text-emerald-400 bg-primary/10 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-primary/20 dark:border-emerald-500/20">PKR</span>
                    </div>
                )}
                <input
                    id={id}
                    name={id}
                    type={type}
                    placeholder={placeholder}
                    className={`form-input w-full rounded-xl ${icon ? 'pl-10' : id === 'subPrice' ? 'pl-14' : ''} ${suffix ? 'pr-16' : ''} dark:bg-[#071520]/90 dark:border-[#152d3d] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500 ${errors[id] ? "border-red-500" : ""}`}
                    value={formData[id as keyof SubscriptionForm]}
                    onChange={handleChange}
                />
                {suffix && (
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">{suffix}</span>
                    </div>
                )}
            </div>
            {errors[id] && <span className="text-red-500 text-sm">{errors[id]}</span>}
        </div>
    );

    return (
        <div className="space-y-6">
            <style>{`
                .dark .add-sub-quill .ql-toolbar {
                    background-color: rgba(8, 19, 28, 0.9);
                    border-color: #152d3d !important;
                    border-top-left-radius: 0.75rem;
                    border-top-right-radius: 0.75rem;
                }
                .dark .add-sub-quill .ql-container {
                    background-color: rgba(7, 21, 32, 0.7);
                    border-color: #152d3d !important;
                    border-bottom-left-radius: 0.75rem;
                    border-bottom-right-radius: 0.75rem;
                    color: #e2e8f0;
                }
                .dark .add-sub-quill .ql-stroke { stroke: #94a3b8; }
                .dark .add-sub-quill .ql-fill { fill: #94a3b8; }
                .dark .add-sub-quill .ql-picker { color: #94a3b8; }
                .dark .add-sub-quill.ql-container-focused,
                .dark .add-sub-quill:focus-within .ql-toolbar,
                .dark .add-sub-quill:focus-within .ql-container {
                    border-color: #10b981 !important;
                }
                .add-sub-quill-wrap {
                    border-radius: 0.75rem;
                    overflow: hidden;
                }
            `}</style>

            <div className="w-full flex justify-end">
                <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white"
                >
                    <IconArrowRight className="w-4 h-4 rtl:rotate-180" />
                    {t('back_to_dashboard')}
                </button>
            </div>

            <div className="rounded-2xl border border-[#ebedf2] dark:border-[#152d3d] bg-white dark:bg-[#0c1b26]/90 shadow-sm dark:shadow-2xl dark:shadow-black/60 overflow-hidden">
                {/* Card header */}
                <div className="px-6 sm:px-7 py-6 border-b border-[#ebedf2] dark:border-[#152d3d]/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 dark:bg-gradient-to-r dark:from-[#0c1b26] dark:via-[#0e2433]/40 dark:to-[#0c1b26]">
                    <div>
                        <h2 className="text-xl lg:text-2xl font-bold text-stone-800 dark:text-white tracking-tight flex items-center gap-2.5">
                            <span>{t('add_new_subscription_page')}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary dark:bg-emerald-500/15 dark:text-emerald-400 border border-primary/30 dark:border-emerald-500/30">
                                {t('active')}
                            </span>
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-slate-400">{t('add_new_subscription_desc')}</p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#04090e]/60 border border-gray-200 dark:border-[#152d3d] text-xs text-gray-500 dark:text-slate-400">
                        <FieldIcon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <span>{t('instant_plan_activation')}</span>
                    </div>
                </div>

                {/* Form body */}
                <div className="p-6 sm:p-7 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
                        {renderInputField("subName", t('form_subscription_name'), "text", t('form_subscription_name'), ICON_PATHS.tag)}
                        {renderInputField("timeDuration", t('form_duration_months'), "number", t('form_duration_placeholder'), ICON_PATHS.calendar, t('months'))}
                        {renderInputField("subPrice", t('form_price_pkr'), "number", t('form_price_placeholder'))}
                        {renderInputField("subCrop", t('form_crop'), "number", t('form_crop_name_placeholder'), ICON_PATHS.crop)}
                    </div>

                    <div className="space-y-2 pt-1">
                        <label htmlFor="subDescription" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300">
                            {t('form_description')}
                        </label>
                        <div className={`add-sub-quill-wrap border border-gray-200 dark:border-[#152d3d] ${errors.subDescription ? "border-red-500" : ""}`}>
                            <ReactQuill
                                id="subDescription"
                                value={formData.subDescription}
                                onChange={handleDescriptionChange}
                                className="quill-editor add-sub-quill"
                            />
                        </div>
                        {errors.subDescription && (
                            <span className="text-red-500 text-sm">{errors.subDescription}</span>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-[#152d3d]/70 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setFormData(filedsName); setErrors({}); }}
                            className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-[#152d3d] bg-white dark:bg-[#0c1b26] hover:bg-gray-50 dark:hover:bg-[#102534] text-gray-600 dark:text-slate-300 text-xs font-semibold tracking-wide transition-all shadow-sm"
                        >
                            {t('discard_changes')}
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-xs tracking-wide transition-all duration-200 !bg-[#16a34a] hover:!bg-[#15803d] dark:!bg-gradient-to-r dark:!from-emerald-500 dark:!to-emerald-600 dark:hover:!from-emerald-600 dark:hover:!to-emerald-700 shadow-lg dark:shadow-emerald-950/60"
                            onClick={handleSubmit}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>{t('btn_add_subscription')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddNewSubscription;