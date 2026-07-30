import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { ServerSetting } from "./../../helperComponents/ServerSetting";
import { useParams, useNavigate } from "react-router-dom";
import { Notification } from './../../helperComponents/Notification';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { normalizeCropType, CROP_TYPE_SELECT_OPTIONS } from '../../constants/cropTypes';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconTag from '../../components/Icon/IconTag';

// Shared style tokens so this page stays visually consistent with the rest
// of the app (see AdminOverview / Header / TableCard / ViewAllCrops).
const card =
    'rounded-[2rem] border border-success-200 bg-white/95 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-success-800 dark:bg-gray-900/85';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-success-light text-success dark:bg-success/20 dark:text-success-light';
const sectionHeading = 'text-lg font-semibold text-gray-900 dark:text-white';

interface CropFormData {
    _id: string;
    cropName: string;
    cropType: string;
    cropImage: string | File;
    cropStatus: string | number;
}

interface CropErrors {
    cropName?: string;
    cropType?: string;
    cropImage?: string;
}

const EditCrop = () => {
    const { t } = useTranslation();
    const { id } = useParams(); // Get crop ID from URL
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const [formData, setFormData] = useState<CropFormData>({
        _id: "",
        cropName: "",
        cropType: "",
        cropImage: "",
        cropStatus: "",
    });
    const [previewImage, setPreviewImage] = useState(""); // For previewing the image
    const [errors, setErrors] = useState<CropErrors>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCropDetails = async () => {
            setLoading(true); // Set loading to true when fetching starts
            try {
                const response = await axios.get(`${ServerSetting.serUrl}/api/viewcrop/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = response.data.data;
                const cropType = normalizeCropType(data.cropType) || '';

                setFormData({
                    ...data,
                    cropType,
                });
                setPreviewImage(`${ServerSetting.serUrl}/crop/${data.cropImage}`);
            } catch (error) {
                console.error("Error fetching crop details:", error);
            } finally {
                setLoading(false); // Set loading to false after data is fetched or error occurs
            }
        };

        fetchCropDetails();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prevData) => ({
                ...prevData,
                cropImage: file, // Store the file object
            }));

            // Generate a preview URL for the image
            const previewURL = URL.createObjectURL(file);
            setPreviewImage(previewURL);
        }
    };

    const handleSubmit = async () => {
        const newErrors: CropErrors = {};
        if (!formData.cropName.trim()) newErrors.cropName = "Crop name is required.";
        if (!formData.cropType.trim()) newErrors.cropType = "Crop type is required.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        setLoading(true);

        // Create a FormData object for sending the file and other data
        const formDataApi = new FormData();
        formDataApi.append("cropName", formData.cropName);
        formDataApi.append("cropType", formData.cropType);
        formDataApi.append("cropStatus", String(formData.cropStatus));
        formDataApi.append("cropId", formData._id);

        // Append image file only if a new file is selected
        if (formData.cropImage instanceof File) {
            formDataApi.append("cropImage", formData.cropImage);
        }

        try {
            const response = await axios.post(`${ServerSetting.serUrl}/api/editcrop`, formDataApi, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            Notification({ text: response.data.message, color: 'success' });
            navigate("/viewcrops");
        } catch (error) {
            console.error("API Error:", error);
            Notification({ text: 'Failed to update crop. Please try again.', color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className={card}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className={iconBadge}>
                            <IconTag className="w-5 h-5" />
                        </span>
                        <h2 className={sectionHeading}>{t('edit_crop_page')}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/viewcrops')}
                        className="flex items-center gap-2 rounded-2xl bg-success-light px-4 py-2 text-sm font-semibold text-success transition-colors hover:bg-success-light/70 dark:bg-success/20 dark:text-success-light dark:hover:bg-success/30"
                    >
                        <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        {t('back')}
                    </button>
                </div>
            </div>

            <div className="mx-auto w-full max-w-md">
                <div className={card}>
                    {loading ? (
                        <div className="py-10 text-center">
                            <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-success border-t-transparent dark:border-success-light"></div>
                            <p className="text-gray-500 dark:text-gray-400">{t('loading')}</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Crop Image */}
                            <div className="text-center">
                                <label htmlFor="cropImage" className="inline-block cursor-pointer">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Crop Preview"
                                            className="mx-auto h-24 w-24 rounded-full border-4 border-success-200 object-cover transition-colors hover:border-success dark:border-success-800 dark:hover:border-success-light md:h-32 md:w-32"
                                        />
                                    ) : (
                                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-dashed border-success-200 bg-success-50 text-sm text-gray-500 dark:border-success-800 dark:bg-white/5 dark:text-gray-400 md:h-32 md:w-32">
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
                                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Tap the image to change it</p>
                                {errors.cropImage && (
                                    <span className="text-sm text-red-500">{errors.cropImage}</span>
                                )}
                            </div>

                            {/* Crop Name */}
                            <div>
                                <label htmlFor="cropName" className="form-label">
                                    {t('form_crop_name')}
                                </label>
                                <input
                                    id="cropName"
                                    name="cropName"
                                    type="text"
                                    placeholder={t('form_enter_crop_name')}
                                    className={`form-input ${errors.cropName ? "border-red-500" : ""}`}
                                    value={formData.cropName}
                                    onChange={handleChange}
                                />
                                {errors.cropName && (
                                    <span className="text-sm text-red-500">{errors.cropName}</span>
                                )}
                            </div>

                            {/* Crop Type */}
                            <div>
                                <label htmlFor="cropType" className="form-label">
                                    {t('form_crop_type')}
                                </label>
                                <select
                                    id="cropType"
                                    name="cropType"
                                    className={`form-select ${errors.cropType ? "border-red-500" : ""}`}
                                    value={formData.cropType}
                                    onChange={handleChange}
                                >
                                    {CROP_TYPE_SELECT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {errors.cropType && (
                                    <span className="text-sm text-red-500">{errors.cropType}</span>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-success px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? t('updating') : t('update_crop_details')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditCrop;
