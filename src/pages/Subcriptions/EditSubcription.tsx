import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { Notification } from "./../../helperComponents/Notification";
import { useParams, useNavigate } from "react-router-dom";
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { useAuthToken } from './../../Hooks/useAuthToken';
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
const EditSubscription = () => {
    const { id } = useParams(); // Get subscription ID from URL
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const initialFormData = {
        subName: "",
        subDescription: "",
        subPrice: "",
        subCrop: "",
        subType: 3,
        timeDuration: "",
    };
    const [formData, setFormData] = useState<SubscriptionForm>(initialFormData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setIsLoading(false);
            return;
        }
        if (!token) {
            // Wait for the auth token to be ready before calling the API,
            // otherwise this fires with "Authorization: Bearer undefined".
            return;
        }
        setIsLoading(true);
        axios
            .get(`${ServerSetting.serUrl}/api/viewsub/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((response) => {
                if (response.data.status === 200) {
                    setFormData(response.data.data);
                }
            })
            .catch((error) => {
                console.error("Error fetching subscription data:", error);
            })
            .finally(() => setIsLoading(false));
    }, [id, token]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleDescriptionChange = (value: any) => {
        setFormData((prevData) => ({
            ...prevData,
            subDescription: value,
        }));
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};

        if (!formData.subName.trim()) newErrors.subName = "Subscription name is required.";
        if (!formData.subDescription.trim()) newErrors.subDescription = "Description is required.";
        if (!formData.subPrice || +formData.subPrice <= 0)
            newErrors.subPrice = "Price must be a positive number.";
        if (!formData.subCrop || +formData.subCrop <= 0)
            newErrors.subCrop = "Crop field is required.";
        if (!formData.timeDuration || +formData.timeDuration <= 0)
            newErrors.timeDuration = "Duration must be a positive number.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const apiUrl = `${ServerSetting.serUrl}/api/editsub/${id}`;
            const response = await axios.patch(apiUrl, formData, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 200) {
                Notification({ text: response.data.message, color: "success" });
                setFormData(initialFormData);
                setErrors({});
                navigate("/subcriptions"); // Navigate to subscriptions list
            } else {
                console.error("Error submitting form:", response.data);
                alert("Failed to submit the form. Please try again.");
            }
        } catch (error) {
            console.error("An error occurred:", error);
            Notification({
                text: "An error occurred while submitting the form. Please try again.",
                color: "error",
            });
        }
    };

    const renderInputField = (id: any, label: any, type: any, placeholder: any) => (
        <div className="min-w-0">
            <label htmlFor={id} className="form-label">{label}</label>
            <input
                id={id}
                name={id}
                type={type}
                placeholder={placeholder}
                className={`form-input w-full ${errors[id] ? "border-red-500" : ""}`}
                value={formData[id]}
                onChange={handleChange}
            />
            {errors[id] && <span className="text-red-500 text-sm">{errors[id]}</span>}
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <span className="animate-[spin_2s_linear_infinite] border-4 border-[#f1f2f3] border-l-primary dark:border-l-primary-light rounded-full w-12 h-12 inline-block" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-primary-200 bg-white dark:bg-gray-900 dark:border-primary-800 p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">Edit Subscription</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update the plan's price, crop limit, duration, and description.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/subcriptions')}
                        className="flex items-center gap-2 rounded-2xl bg-primary-light px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-light/70 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30 shrink-0 sm:ml-auto"
                    >
                        <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        Back to Subscriptions
                    </button>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {renderInputField("subName", "Subscription Name", "text", "Subscription Name")}
                    {renderInputField("timeDuration", "Duration (Months)", "number", "Duration in Months")}
                    {renderInputField("subPrice", "Price (PKR)", "number", "Price")}
                    {renderInputField("subCrop", "Crop", "number", "Crop Name")}
                    <div className="sm:col-span-2 min-w-0">
                        <label htmlFor="subDescription" className="form-label">Description</label>
                        <div className="overflow-hidden rounded-lg">
                            <ReactQuill
                                id="subDescription"
                                value={formData.subDescription}
                                onChange={handleDescriptionChange}
                                className={`quill-editor ${errors.subDescription ? "border-red-500" : ""}`}
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
                        className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90"
                        onClick={handleSubmit}
                    >
                        Update Subscription
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditSubscription;
