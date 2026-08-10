import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../store/themeConfigSlice';
import { useAuthToken } from '../Hooks/useAuthToken';
import { useShopId } from '../Hooks/useShopId';
import { ServerSetting } from '../helperComponents/ServerSetting';
import { Notification } from '../helperComponents/Notification';
import axios from 'axios';
import IconCashBanknotes from '../components/Icon/IconCashBanknotes';
import IconSearch from '../components/Icon/IconSearch';
import IconArrowLeft from '../components/Icon/IconArrowLeft';

interface Crop {
    _id: string;
    cropName: string;
    cropImage: string;
}

const Finance = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const { shopId } = useShopId();
    const [userId, setUserId] = useState('');
    const [cropData, setCropData] = useState<Crop[]>([]);
    const [filteredData, setFilteredData] = useState<Crop[]>([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle(t('finance_management')));
        fetchCrops();
    }, [dispatch, shopId, t]);

    const fetchCrops = async () => {
        try {
            const storedUserRaw = localStorage.getItem('userInformation');
            if (!storedUserRaw) {
                Notification({ text: t('user_not_found_login_finance'), color: 'danger' });
                navigate('/login');
                return;
            }

            const storedUser = JSON.parse(storedUserRaw);
            const userToken = storedUser?.token || localStorage.getItem('token');
            const currentUserId = storedUser.data._id;
            setUserId(currentUserId);

            if (!userToken) {
                Notification({ text: t('no_token_login_finance'), color: 'warning' });
                navigate('/login');
                return;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            };

            const subRes = await axios.post(
                `${ServerSetting.serUrl}/api/getUserSubscriptionIds`,
                { userId: currentUserId },
                config
            );

            if (subRes.data.status === 200 && subRes.data.data[0]?._id) {
                const subscriptionId = subRes.data.data[0]._id;

                const cropRes = await axios.post(
                    `${ServerSetting.serUrl}/api/getAssignedCrops`,
                    { userId: currentUserId, subId: subscriptionId },
                    config
                );

                if (cropRes.data.status === 200) {
                    setCropData(cropRes.data.data.cropIds);
                    setFilteredData(cropRes.data.data.cropIds);
                } else {
                    Notification({ text: `${t('failed_fetch_crops_finance')}: ${cropRes.data.message}`, color: 'danger' });
                }
            } else {
                Notification({ text: `${t('failed_fetch_subscription_finance')}: ${subRes.data.message}`, color: 'danger' });
            }
        } catch (error: any) {
            console.error('Error fetching crops:', error);
            Notification({ text: t('error_fetching_crops'), color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase();
        setSearchText(value);

        const filtered = cropData.filter(crop =>
            crop.cropName.toLowerCase().includes(value)
        );

        setFilteredData(filtered);
    };

    const handleCropClick = (cropId: string) => {
        navigate(`/finance/crop/${cropId}`);
    };

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <div className='flex justify-end'>
            <button
                type="button"
                onClick={() => navigate('/dashboard')}
                            className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
            >
                <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('back_to_dashboard')}
            </button>
            </div>
            

            {/* Search Bar */}
            <div className="rounded-2xl border border-gray-300 bg-white dark:bg-[#0b1526]/60 dark:border-white/10 p-6 shadow-sm">
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{t('finance_management')}</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('select_crop_finance')}</p>
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IconSearch className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={t('search_crops')}
                        value={searchText}
                        onChange={handleSearch}
                        className="form-input pl-10 w-full bg-white dark:bg-transparent text-gray-900 dark:text-gray-100 border-gray-300 dark:border-white/10 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">{t('loading_crops')}</p>
                </div>
            ) : (
                <>
                    {/* Crops Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredData.length > 0 ? (
                            filteredData.map((crop) => (
                                <div
                                    key={crop._id}
                                    onClick={() => handleCropClick(crop._id)}
                                    className="group cursor-pointer min-w-0 rounded-2xl border-2 border-gray-200 dark:border-white/10 p-6 transition-all duration-300 text-center flex flex-col items-center hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-[#0b1526]/60 hover:border-emerald-400/60 dark:hover:border-emerald-500/40"
                                >
                                    <div className="relative w-full max-w-[200px] aspect-[3/2] rounded-xl overflow-hidden mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                                        <div className="absolute inset-0 bg-emerald-50 dark:bg-emerald-500/10"></div>
                                        <img
                                            src={`${ServerSetting.serUrl}/crop/${crop.cropImage}`}
                                            alt={crop.cropName}
                                            className="relative w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/assets/images/placeholder-crop.png';
                                            }}
                                        />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate max-w-full group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                        {crop.cropName}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {t('view_finance_records')}
                                    </p>
                                    <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                        <IconCashBanknotes className="w-4 h-4 mr-2 shrink-0" />
                                        <span>{t('view_finance')}</span>
                                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center col-span-full rounded-2xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0b1526]/60 p-12 shadow-sm">
                                <div className="text-6xl mb-4">💰</div>
                                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('no_crops_available')}</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {searchText ? t('no_crops_match_search') : t('no_crops_assigned_finance')}
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Finance;
