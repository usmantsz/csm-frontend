import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { Notification } from './../../helperComponents/Notification';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconShop from '../../components/Icon/Menu/IconMenuShop';
import IconUser from '../../components/Icon/IconUser';
import IconCashBanknotes from '../../components/Icon/IconCashBanknotes';
import IconFile from '../../components/Icon/IconFile';
import IconPhone from '../../components/Icon/IconPhone';
import IconMapPin from '../../components/Icon/IconMapPin';
import { useTranslation } from 'react-i18next';

interface Shop {
    _id: string;
    shopName: string;
    shopUserId: string;
    shopNumber: string;
    shopAddress: string;
    shopProvince: string;
    shopCity: string;
    shopRegistrationNumber: string;
    shopBillImageTop: string;
    shopStatus: number | string; // Can be number (0/1) or string ('0'/'1')
    createdAt: string;
    updatedAt: string;
}

interface Crop {
    _id: string;
    cropName: string;
    cropImage: string;
}

const ShopView = () => {
    const { t } = useTranslation();
    const { shopId } = useParams<{ shopId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { token, user } = useAuthToken();
    const isAdmin = user?.userRole === 'Admin' || user?.userRole === 'admin' || user?.userRole === '0';

    const [shop, setShop] = useState<Shop | null>(null);
    const [crops, setCrops] = useState<Crop[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'crops' | 'customers' | 'finance' | 'expenses'>('overview');

    useEffect(() => {
        dispatch(setPageTitle(t('shop_details')));
    }, [dispatch, t]);

    useEffect(() => {
        if (shopId && token) {
            fetchShopDetails();
        }
    }, [shopId, token]);

    const fetchShopDetails = async () => {
        try {
            setLoading(true);
            
            // Fetch shop details
            const shopRes = await axios.get(`${ServerSetting.serUrl}/api/viewshop/${shopId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (shopRes.data.status === 200 && shopRes.data.data && shopRes.data.data.length > 0) {
                const shopData = shopRes.data.data[0]; // API returns an array
                console.log('Shop Data:', shopData);
                console.log('Shop Status:', shopData.shopStatus, 'Type:', typeof shopData.shopStatus);
                setShop(shopData);
                
                // Fetch shop owner's user ID to get crops
                const shopUserId = shopData.shopUserId;
                
                // Fetch assigned crops for this shop owner
                try {
                    const subRes = await axios.post(
                        `${ServerSetting.serUrl}/api/getUserSubscriptionIds`,
                        { userId: shopUserId },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (subRes.data.status === 200 && subRes.data.data[0]?._id) {
                        const subscriptionId = subRes.data.data[0]._id;
                        
                        const cropRes = await axios.post(
                            `${ServerSetting.serUrl}/api/getAssignedCrops`,
                            { userId: shopUserId, subId: subscriptionId },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );

                        if (cropRes.data.status === 200) {
                            setCrops(cropRes.data.data.cropIds || []);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching crops:', error);
                }
            } else {
                console.error('Shop not found or empty response:', shopRes.data);
                Notification({ text: shopRes.data.message || 'Shop not found', color: 'danger' });
            }
        } catch (error: any) {
            console.error('Error fetching shop details:', error);
            console.error('Error response:', error.response?.data);
            Notification({ 
                text: error.response?.data?.message || 'Error fetching shop details. Please try again.', 
                color: 'danger' 
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-lg font-semibold text-stone-600 dark:text-stone-400">{t('loading_shop_details')}</p>
                </div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-[#0b1526]/60 p-6 shadow-sm">
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold mb-2 text-stone-900 dark:text-white">{t('shop_not_found_heading')}</h3>
                    <p className="text-stone-600 dark:text-stone-400 mb-6">
                        {t('shop_not_found_desc')}
                    </p>
                    <button
                        onClick={() => navigate('/shop')}
                        className="btn btn-primary rounded-xl"
                    >
                        <IconArrowLeft className="w-4 h-4 mr-2" />
                        {t('back_to_shops')}
                    </button>
                </div>
            </div>
        );
    }

    const isActive = String(shop.shopStatus) === '0' || shop.shopStatus === 0;

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-green-200 bg-white dark:bg-[#0b1526]/60 dark:border-green-800 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0 flex items-center gap-4">
                    <span className="hidden sm:inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30 text-2xl">
                        🏪
                    </span>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-stone-900 dark:text-white truncate">{shop.shopName || t('shop_details')}</h1>
                        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 truncate">{t('shop_view_desc', { reg: shop.shopRegistrationNumber || '-' })}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/shop')}
                    className="flex items-center gap-2 rounded-2xl bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-900/50 shrink-0"
                >
                    <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    {t('back_to_all_shops')}
                </button>
            </div>

            {/* Shop Info Card */}
            <div className="rounded-2xl p-6 text-white shadow-sm bg-gradient-to-r from-green-600 to-green-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-6 min-w-0">
                            {shop.shopBillImageTop ? (
                                <img
                                    src={`${ServerSetting.serUrl}/shop/${shop.shopBillImageTop}`}
                                    className="h-24 w-24 shrink-0 rounded-full object-cover border-4 border-white/30"
                                    alt={shop.shopName}
                                />
                            ) : (
                                <div className="h-24 w-24 shrink-0 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center">
                                    <IconShop className="w-12 h-12 text-white" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <h1 className="text-3xl font-bold mb-2 truncate">{shop.shopName}</h1>
                                <p className="text-green-100 text-sm truncate">
                                    {t('registration_label')}: {shop.shopRegistrationNumber}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className={`badge bg-white/20 text-white border ${isActive ? 'border-white/50' : 'border-white/50'}`}>
                                {isActive ? t('active') : t('inactive')}
                            </span>
                        </div>
                    </div>
                </div>

            {/* Shop Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-[#0b1526]/60 p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 shrink-0 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <IconPhone className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-stone-700 dark:text-stone-300">{t('phone_number')}</h3>
                            <p className="text-stone-600 dark:text-stone-400 text-sm truncate">{shop.shopNumber || '-'}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-[#0b1526]/60 p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 shrink-0 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <IconMapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-stone-700 dark:text-stone-300">{t('location')}</h3>
                            <p className="text-stone-600 dark:text-stone-400 text-sm truncate">
                                {shop.shopCity}, {shop.shopProvince}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-[#0b1526]/60 p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 shrink-0 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <IconFile className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-stone-700 dark:text-stone-300">{t('created_date')}</h3>
                            <p className="text-stone-600 dark:text-stone-400 text-sm truncate">{formatDate(shop.createdAt)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-[#0b1526]/60 p-6 shadow-sm">
                <div className="border-b border-green-200 dark:border-green-800 mb-6 overflow-x-auto">
                    <nav className="-mb-px flex gap-6 min-w-max sm:min-w-0">
                        {[
                            { id: 'overview', label: t('overview'), icon: IconShop },
                            { id: 'crops', label: t('crops'), icon: IconFile },
                            { id: 'customers', label: t('customers_tab'), icon: IconUser },
                            { id: 'finance', label: t('finance_tab'), icon: IconCashBanknotes },
                            { id: 'expenses', label: t('expenses_tab'), icon: IconCashBanknotes },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                                        activeTab === tab.id
                                            ? 'border-green-600 text-green-700 dark:border-green-400 dark:text-green-400'
                                            : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300 dark:text-stone-400 dark:hover:text-stone-300'
                                    }`}
                                >
                                    <Icon className="w-5 h-5 shrink-0" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'overview' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-stone-900 dark:text-white">{t('shop_overview_tab')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="rounded-2xl border border-green-200 dark:border-green-800 p-5 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-900/10">
                                    <h4 className="font-semibold text-green-700 dark:text-green-200 mb-2">{t('total_crops_card')}</h4>
                                    <p className="text-3xl font-bold text-green-700 dark:text-green-400">{crops.length}</p>
                                </div>
                                <div className={`rounded-2xl border p-5 ${isActive ? 'border-success/30 bg-gradient-to-br from-success/10 to-success/5' : 'border-danger/30 bg-gradient-to-br from-danger/10 to-danger/5'}`}>
                                    <h4 className={`font-semibold mb-2 ${isActive ? 'text-success' : 'text-danger'}`}>{t('status')}</h4>
                                    <p className={`text-lg font-semibold ${isActive ? 'text-success' : 'text-danger'}`}>
                                        {isActive ? t('active') : t('inactive')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'crops' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-stone-900 dark:text-white">{t('assigned_crops')}</h3>
                            {crops.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {crops.map((crop) => {
                                        const handleCropClick = () => {
                                            if (!shop || !shop.shopUserId) {
                                                Notification({ text: t('shop_data_not_loaded'), color: 'warning' });
                                                return;
                                            }
                                            // Use shopId from URL params (from useParams) - this is the shop's _id
                                            // shopId from useParams is the shop's _id from /shop/view/:shopId route
                                            const currentShopId = shopId || shop._id;
                                            const route = `/cropmenu/${shop.shopUserId}/${crop._id}`;
                                            // Always pass shopId for admin view, use shop._id as fallback
                                            const finalRoute = (isAdmin && currentShopId) ? `${route}?shopId=${currentShopId}` : route;
                                            console.log('ShopView: shopId being passed:', currentShopId, 'from route param:', shopId, 'from shop._id:', shop._id);
                                            console.log('ShopView: Navigating to crop menu:', { 
                                                route: finalRoute, 
                                                shopId: currentShopId, 
                                                shopIdFromParams: shopId,
                                                shopIdFromShop: shop._id,
                                                isAdmin, 
                                                cropId: crop._id 
                                            });
                                            navigate(finalRoute);
                                        };
                                        
                                        return (
                                            <div
                                                key={crop._id}
                                                onClick={handleCropClick}
                                                className="min-w-0 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border-2 border-green-200 dark:border-green-800 rounded-2xl p-4 text-center bg-white dark:bg-[#0b1526]/40"
                                            >
                                                <div className="w-full aspect-[3/2] rounded-lg overflow-hidden mb-3 bg-green-50 dark:bg-white/5">
                                                    <img
                                                        src={`${ServerSetting.serUrl}/crop/${crop.cropImage}`}
                                                        alt={crop.cropName}
                                                        className="w-full h-full object-contain p-2"
                                                    />
                                                </div>
                                                <h4 className="font-semibold text-green-700 dark:text-green-400 truncate">
                                                    {crop.cropName}
                                                </h4>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🌱</div>
                                    <h4 className="text-lg font-semibold mb-2 text-stone-900 dark:text-white">{t('no_crops_assigned')}</h4>
                                    <p className="text-stone-600 dark:text-stone-400">
                                        {t('no_crops_assigned_desc')}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-stone-900 dark:text-white">{t('customers_tab')}</h3>
                            <p className="text-stone-600 dark:text-stone-400 mb-4">
                                {t('view_all_customers_desc')}
                            </p>
                            <button
                                onClick={() => navigate(`/shop/${shopId}/customers`)}
                                className="btn btn-primary rounded-xl mt-4"
                            >
                                <IconUser className="w-4 h-4 mr-2" />
                                {t('view_all_customers')}
                            </button>
                        </div>
                    )}

                    {activeTab === 'finance' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-stone-900 dark:text-white">{t('finance_tab')}</h3>
                            <p className="text-stone-600 dark:text-stone-400 mb-4">
                                {t('view_finance_records_desc')}
                            </p>
                            <button
                                onClick={() => navigate(`/shop/${shopId}/finance`)}
                                className="btn btn-primary rounded-xl mt-4"
                            >
                                <IconCashBanknotes className="w-4 h-4 mr-2" />
                                {t('view_finance_records')}
                            </button>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-stone-900 dark:text-white">{t('expenses_tab')}</h3>
                            <p className="text-stone-600 dark:text-stone-400 mb-4">
                                {t('view_expenses_desc')}
                            </p>
                            <button
                                onClick={() => navigate(`/shop/${shopId}/expenses`)}
                                className="btn btn-primary rounded-xl mt-4"
                            >
                                {t('view_expenses')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopView;
