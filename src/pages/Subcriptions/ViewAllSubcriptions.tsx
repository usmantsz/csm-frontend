import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom";
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { useAuthToken } from './../../Hooks/useAuthToken';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconArrowRight from "../../components/Icon/IconArrowRight";

const ViewAllSubscriptions = () => {
    const { t } = useTranslation();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true); // Loader state
    const navigate = useNavigate(); // React Router navigation hook
    const { token } = useAuthToken();
    useEffect(() => {
        // API call to fetch subscription data
        axios
            .get(`${ServerSetting.serUrl}/api/viewsub`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((response) => {
                if (response.data.status === 200) {
                    setSubscriptions(response.data.data); // Set the subscription data
                }
                setLoading(false); // Stop the loader
            })
            .catch((error) => {
                console.error("Error fetching subscription data:", error);
                setLoading(false); // Stop the loader even if there is an error
            });
    }, []);

    if (loading) {
        // Loader displayed while fetching data
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="loader w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const handleEdit = (id: string) => {
        // Navigate to the edit page with the subscription ID
        navigate(`/editsubcription/${id}`);
    };
    const handleView = (id: string) => {
        // Navigate to the edit page with the subscription ID
        navigate(`/viewHistoryspecifc/${id}`);
    };

    return (
        <div className="space-y-6">
        <div className="w-full flex justify-end">
        <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white">
            <IconArrowRight className="w-4 h-4 rtl:rotate-180"/>
            {t('back_to_dashboard')}
        </button>
            </div>
        

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subscriptions.length > 0 ? (
                subscriptions.map((sub: any) => (
                    <div
                        key={sub._id}
                        className="group flex flex-col h-full min-w-0 rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white dark:bg-black shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                        <div className="p-5 flex-1">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <h3 className="text-lg font-bold text-stone-900 dark:text-white truncate" title={sub.subName}>
                                    {sub.subName}
                                </h3>
                                <span className="shrink-0 whitespace-nowrap inline-flex items-center rounded-xl border-2 border-success bg-white dark:bg-black px-3 py-1.5 text-sm font-bold text-[#3b3f5c] dark:text-white-light">
                                    {sub.subPrice} PKR
                                </span>
                            </div>
                            <div
                                className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3 prose dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sub.subDescription) }}
                            />
                        </div>
                        <div className="px-5 py-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-stone-700 dark:text-stone-300 border-t border-white-light dark:border-[#1b2e4b]">
                            <span>{t('allow_crop')}: {sub.subCrop}</span>
                            {sub.timeDuration && <span>{t('duration_months')}: {sub.timeDuration} {t('months')}</span>}
                        </div>
                        <div className="p-5 pt-3 flex items-center gap-2">
                            <button
                                type="button"
                                className="btn btn-outline-success btn-sm flex-1"
                                onClick={() => handleEdit(sub._id)}
                            >
                                {t('edit_plan')}
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm flex-1"
                                onClick={() => handleView(sub._id)}
                            >
                                {t('view_history')}
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="col-span-full text-center py-12 rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white dark:bg-black">
                    <p className="text-lg font-semibold text-stone-600 dark:text-stone-400">{t('no_record_found')}</p>
                </div>
            )}
            </div>
        </div>
    );
};

export default ViewAllSubscriptions;
