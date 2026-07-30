import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Notification } from './../../helperComponents/Notification';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';

interface Crop {
    _id: string;
    cropName: string;
    cropImage?: string;
}

const GetAssginShopCrops = () => {
    const { t } = useTranslation();
    const [cropData, setCropData] = useState<Crop[]>([]);
    const [filteredData, setFilteredData] = useState<Crop[]>([]);
    const [searchText, setSearchText] = useState('');
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const storedUserRaw = localStorage.getItem('userInformation');

                if (!storedUserRaw) {
                    Notification({ text: t('user_not_found_login'), color: 'danger' });
                    navigate('/login');
                    return;
                }

                const storedUser = JSON.parse(storedUserRaw);
                const token = storedUser?.token || localStorage.getItem('token');

                if (!storedUser || !storedUser.data?._id) {
                    Notification({ text: t('invalid_user_data'), color: 'danger' });
                    navigate('/login');
                    return;
                }

                if (!token) {
                    Notification({ text: t('no_token_login'), color: 'warning' });
                    navigate('/login');
                    return;
                }

                const userId = storedUser.data._id;
                setUserId(userId);

                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };

                const subRes = await axios.post(
                    `${ServerSetting.serUrl}/api/getUserSubscriptionIds`,
                    { userId },
                    config
                );

                if (subRes.data.status === 200 && subRes.data.data[0]?._id) {
                    const subscriptionId = subRes.data.data[0]._id;

                    const cropRes = await axios.post(
                        `${ServerSetting.serUrl}/api/getAssignedCrops`,
                        { userId, subId: subscriptionId },
                        config
                    );

                    if (cropRes.data.status === 200) {
                        const crops: Crop[] = Array.isArray(cropRes.data.data?.cropIds) ? cropRes.data.data.cropIds : [];
                        setCropData(crops);
                        setFilteredData(crops);
                        Notification({ text: t('crops_loaded_success'), color: 'success' });
                    } else {
                        Notification({ text: `${t('failed_fetch_crops')}: ${cropRes.data.message}`, color: 'danger' });
                    }
                } else {
                    Notification({ text: `${t('failed_fetch_subscription')}: ${subRes.data.message}`, color: 'danger' });
                }
            } catch (error) {
                Notification({ text: t('error_fetching_data'), color: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, t]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase();
        setSearchText(value);

        const filtered = cropData.filter((crop) =>
            crop.cropName?.toLowerCase().includes(value)
        );

        setFilteredData(filtered);
    };

    const hasNoCropsAtAll = !loading && cropData.length === 0;
    const hasNoSearchResults = !loading && cropData.length > 0 && filteredData.length === 0;

    return (
        <div className="mb-5 space-y-4">
            {/* Back button - outside card, top of page */}
            <div className="flex justify-start">
                <a
                    href="/dashboard"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/dashboard');
                    }}
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-green-300 dark:hover:bg-emerald-500/20"
                >
                    <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    {t('back_to_dashboard')}
                </a>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#0e1726] border border-gray-300 dark:border-white/10 shadow-md p-6">
                {/* Top row: title (left) + search bar (right) */}
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                            <span className="text-base">🌾</span>
                        </span>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('my_crops')}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('my_crops_page_desc')}</p>
                        </div>
                    </div>

                    <input
                        type="text"
                        placeholder={t('search_crops_placeholder')}
                        value={searchText}
                        onChange={handleSearch}
                        className="form-input w-full rounded-xl sm:w-72"
                    />
                </div>

                {/* Loader */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <span className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
                        <p className="font-medium text-gray-600 dark:text-gray-400">{t('loading_crops')}</p>
                    </div>
                ) : hasNoCropsAtAll ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 text-6xl">🌱</div>
                        <h3 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-200">
                            {t('no_crops_assigned')}
                        </h3>
                        <p className="mx-auto max-w-md text-gray-600 dark:text-gray-400">
                            {t('no_crops_assigned_shop_desc')}
                        </p>
                    </div>
                ) : hasNoSearchResults ? (
                    <div className="py-12 text-center">
                        <div className="mb-3 text-5xl">🔍</div>
                        <p className="text-gray-600 dark:text-gray-400">
                            {t('no_crops_match_search') || 'No crops match your search.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchText('');
                                setFilteredData(cropData);
                            }}
                            className="mt-4 rounded-2xl border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30"
                        >
                            {t('clear_search') || 'Clear search'}
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 ml-12">{filteredData.length} {t('click_to_manage')}</p>

                        <div className="grid grid-cols-1 justify-center gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {filteredData.map((crop) => (
                            <div
                                key={crop._id}
                                onClick={() => navigate(`/cropmenu/${userId}/${crop._id}`)}
                                className="group flex transform cursor-pointer flex-col items-center overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-green-500 hover:shadow-md dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:hover:border-green-600"
                            >
                                <div className="relative mb-4 aspect-[3/2] w-full max-w-[200px] overflow-hidden rounded-xl shadow-lg transition-shadow group-hover:shadow-xl">
                                    <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/20" />
                                    <img
                                        src={`${ServerSetting.serUrl}/crop/${crop.cropImage}`}
                                        alt={crop.cropName}
                                        className="relative h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/assets/images/placeholder-crop.png';
                                        }}
                                    />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-800 transition-colors group-hover:text-green-700 dark:text-white dark:group-hover:text-green-300">
                                    {crop.cropName}
                                </h3>
                                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                                    {t('click_to_manage')}
                                </p>
                                <div className="flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                                    <span>{t('view_details')}</span>
                                    <svg
                                        className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default GetAssginShopCrops;