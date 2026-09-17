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
                <div className="loader w-16 h-16 border-4 border-primary dark:border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
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
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-green-600 dark:text-emerald-500 uppercase tracking-widest mb-1">
                        <span>{t('billing_memberships')}</span>
                        <span>•</span>
                        <span className="text-gray-400 dark:text-slate-400 normal-case font-medium tracking-normal">{t('commission_shops')}</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('subscription_plans')}</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('subscription_plans_desc')}</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-emerald-500/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white shadow-sm dark:shadow-emerald-950/20"
                >
                    <IconArrowRight className="w-4 h-4 rtl:rotate-180" />
                    {t('back_to_dashboard')}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {subscriptions.length > 0 ? (
                    subscriptions.map((sub: any) => (
                        <div
                            key={sub._id}
                            className="relative flex flex-col h-full min-w-0 rounded-2xl border border-white-light dark:border-emerald-500/20 bg-white dark:bg-[#0A1727] shadow-sm dark:shadow-xl dark:shadow-black/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:border-emerald-500/40 group p-6"
                        >
                            {/* Subtle top glow accent (dark mode only) */}
                            <div className="hidden dark:block absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate" dir="ltr" title={sub.subName}>
                                        {sub.subName}
                                    </h3>
                                    <div className="shrink-0 px-3 py-1.5 rounded-lg border border-success dark:border-emerald-500/40 bg-white dark:bg-[#06241E]/60 text-success dark:text-emerald-400 font-bold text-sm shadow-sm whitespace-nowrap">
                                        {sub.subPrice} {t('currency_pkr')}
                                    </div>
                                </div>

                                <div
                                    className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed line-clamp-3 prose dark:prose-invert max-w-none mb-6"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sub.subDescription || '') }}
                                />

                                {/* Metrics panel */}
                                <div className="bg-gray-50 dark:bg-[#071220] rounded-xl p-4 border border-gray-100 dark:border-slate-800/80 mb-6 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center text-gray-700 dark:text-slate-300">
                                            <div className="w-7 h-7 rounded-md bg-green-50 dark:bg-emerald-950/80 text-success dark:text-emerald-400 flex items-center justify-center mr-2.5 shrink-0">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                </svg>
                                            </div>
                                            <span>{t('allow_crop')}</span>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white text-base">{sub.subCrop}</span>
                                    </div>
                                    {sub.timeDuration && (
                                        <>
                                            <div className="border-t border-gray-200 dark:border-slate-800"></div>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center text-gray-700 dark:text-slate-300">
                                                    <div className="w-7 h-7 rounded-md bg-green-50 dark:bg-emerald-950/80 text-success dark:text-emerald-400 flex items-center justify-center mr-2.5 shrink-0">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <span>{t('duration_months')}</span>
                                                </div>
                                                <span className="font-semibold text-success dark:text-emerald-400 text-sm">{sub.timeDuration} {t('months')}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Bottom action buttons */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleEdit(sub._id)}
                                    className="w-full py-2 px-3 rounded-lg border border-success dark:border-emerald-500/40 text-success dark:text-emerald-400 bg-white dark:bg-emerald-950/20 hover:bg-success hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white text-xs font-semibold tracking-wide transition shadow-sm"
                                >
                                    {t('edit_plan')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleView(sub._id)}
                                    className="w-full py-2 px-3 rounded-lg border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500 text-gray-700 dark:text-slate-300 bg-white dark:bg-[#071322] hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-semibold tracking-wide transition"
                                >
                                    {t('view_history')}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 rounded-2xl border border-white-light dark:border-emerald-500/20 bg-white dark:bg-[#0A1727]">
                        <p className="text-lg font-semibold text-gray-600 dark:text-slate-400">{t('no_record_found')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewAllSubscriptions;