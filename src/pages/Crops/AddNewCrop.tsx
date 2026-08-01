import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { Notification } from './../../helperComponents/Notification';
import { useAuthToken } from './../../Hooks/useAuthToken';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import { CROP_TYPE_SELECT_OPTIONS } from '../../constants/cropTypes';

const card =
    'rounded-[2rem] border border-white-light bg-white/95 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#0b1526]/85';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20';
const inputBase =
    'form-input w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-white/5 dark:text-white';
const inputOk = 'border-gray-300 focus:border-primary dark:border-white/10 dark:focus:border-primary';
const inputError = 'border-red-400 focus:border-red-500 dark:border-red-500/70';
const labelCls = 'mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200';
const errorCls = 'mt-1 block text-sm text-red-500';

interface FormData {
    cropName: string;
    cropType: string;
    cropImage: File | string;
    cropStatus: string;
}

interface FormErrors {
    cropName?: string;
    cropType?: string;
    cropImage?: string;
}

const AddNewCrop = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const [formData, setFormData] = useState<FormData>({
        cropName: "",
        cropType: "",
        cropImage: "",
        cropStatus: "",
    });
    const [previewImage, setPreviewImage] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleImageChange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prevData) => ({
                ...prevData,
                cropImage: file,
            }));

            const previewURL = URL.createObjectURL(file);
            setPreviewImage(previewURL);
        }
    };

    const handleSubmit = async () => {
        let newErrors: FormErrors = {};
        if (!formData.cropName.trim()) newErrors.cropName = "Crop name is required.";
        if (!formData.cropType.trim()) newErrors.cropType = "Crop type is required.";
        if (!formData.cropImage) newErrors.cropImage = "Crop image is required.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        const formDataApi = new FormData();
        formDataApi.append("cropName", formData.cropName);
        formDataApi.append("cropType", formData.cropType);
        formDataApi.append("cropImage", formData.cropImage);
        formDataApi.append("cropStatus", formData.cropStatus);

        try {
            const response = await axios.post(`${ServerSetting.serUrl}/api/addcrop`, formDataApi, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            Notification({ text: response.data.message, color: 'success' });
            navigate("/viewcrops");
            setFormData({
                cropName: "",
                cropType: "",
                cropImage: "",
                cropStatus: '0',
            });
            setPreviewImage("");
            setErrors({});
        } catch (error) {
            console.error("API Error:", error);
            alert("Failed to add crop. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
            <button
                type="button"
                onClick={() => navigate('/viewcrops')}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
            >
                <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('back_to_all_crops')}
            </button>
            </div>

            <div className={`${card} mx-auto max-w-md`}>
                <div className="space-y-5">
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-success sm:text-2xl">{t('add_new_crop_page')}</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('add_new_crop_desc')}</p>
                    </div>

                    {/* Crop Image */}
                    <div className="text-center">
                        <label htmlFor="cropImage" className="group inline-block cursor-pointer">
                            {previewImage ? (
                                <img
                                    src={previewImage}
                                    alt="Crop Preview"
                                    className="mx-auto h-28 w-28 rounded-full border-2 border-gray-300 object-cover shadow-sm transition-transform duration-300 group-hover:scale-105 dark:border-white/10 md:h-32 md:w-32"
                                />
                            ) : (
                                <div className="mx-auto flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-gray-300 bg-gray-100 text-xs font-medium text-gray-500 transition-colors group-hover:border-primary/50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 md:h-32 md:w-32">
                                    <span className="text-2xl">🌾</span>
                                    {t('form_upload_image')}
                                </div>
                            )}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            id="cropImage"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        {errors.cropImage && (
                            <span className={errorCls}>{errors.cropImage}</span>
                        )}
                    </div>

                    {/* Crop Name */}
                    <div className="flex flex-col">
                        <label htmlFor="cropName" className={labelCls}>
                            {t('form_crop_name')}
                        </label>
                        <input
                            id="cropName"
                            name="cropName"
                            type="text"
                            placeholder={t('form_enter_crop_name')}
                            className={`${inputBase} ${errors.cropName ? inputError : inputOk}`}
                            value={formData.cropName}
                            onChange={handleChange}
                        />
                        {errors.cropName && (
                            <span className={errorCls}>{errors.cropName}</span>
                        )}
                    </div>

                    {/* Crop Type */}
                    <div className="flex flex-col">
                        <label htmlFor="cropType" className={labelCls}>
                            {t('form_crop_type')}
                        </label>
                        <select
                            id="cropType"
                            name="cropType"
                            className={`form-select ${inputBase} ${errors.cropType ? inputError : inputOk}`}
                            value={formData.cropType}
                            onChange={handleChange}
                        >
                            <option value="">{t('form_select_type')}</option>
                            {CROP_TYPE_SELECT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {errors.cropType && (
                            <span className={errorCls}>{errors.cropType}</span>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 text-center">
                        <button
                            type="button"
                            className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-success px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-success/90 ${loading ? "cursor-not-allowed opacity-50" : ""
                                }`}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading && (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            )}
                            {loading ? t('btn_saving_crop') : t('btn_save_crop_details')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddNewCrop;