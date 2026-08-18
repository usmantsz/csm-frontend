import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useAuthToken } from '../../Hooks/useAuthToken';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';

// ✅ Import images directly
import receiptIcon from '../../assets/images/cropmenuicon/receipt.svg';
import loanIcon from '../../assets/images/cropmenuicon/loan.svg';
import historyIcon from '../../assets/images/cropmenuicon/history.svg';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconMenuInvoice from '../../components/Icon/Menu/IconMenuInvoice';
import IconMenuUsers from '../../components/Icon/Menu/IconMenuUsers';
import IconMenuCalendar from '../../components/Icon/Menu/IconMenuCalendar';
import IconFile from '../../components/Icon/IconFile';
import IconUsers from '../../components/Icon/IconUsers';
import IconCashBanknotes from '../../components/Icon/IconCashBanknotes';
import IconNotes from '../../components/Icon/IconNotes';

const CropMenuCards = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { userId, cropId } = useParams();
    const [searchParams] = useSearchParams();
    const { user, token } = useAuthToken();

    // Get shopId from URL query params (for admin view)
    const shopId = searchParams.get('shopId');
    const isAdmin = user?.userRole === 'Admin' || user?.userRole === 'admin' || user?.userRole === '0';

    // State for crop details
    const [cropDetails, setCropDetails] = useState<any>(null);
    const [loadingCrop, setLoadingCrop] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle('Crop Management'));
    }, [dispatch]);

    // Fetch crop details to check cropType
    useEffect(() => {
        const fetchCropDetails = async () => {
            if (!cropId || !token) {
                setLoadingCrop(false);
                return;
            }
            try {
                const response = await axios.get(`${ServerSetting.serUrl}/api/viewcrop/${cropId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.status === 200 && response.data.data) {
                    setCropDetails(response.data.data);
                    console.log('CropMenuCards - Crop Details:', response.data.data);
                    console.log('CropMenuCards - Crop Type:', response.data.data.cropType);
                }
            } catch (error) {
                console.error('Error fetching crop details:', error);
            } finally {
                setLoadingCrop(false);
            }
        };
        fetchCropDetails();
    }, [cropId, token]);

    useEffect(() => {
        console.log('CropMenuCards: shopId from URL:', shopId, 'isAdmin:', isAdmin, 'current URL:', window.location.href);
    }, [shopId, isAdmin]);

    // Helper function to append shopId to route if admin is viewing
    const getRouteWithShopId = React.useCallback((route: string) => {
        if (shopId) {
            // Always append shopId if it exists in URL (for admin view)
            const separator = route.includes('?') ? '&' : '?';
            return `${route}${separator}shopId=${shopId}`;
        }
        return route;
    }, [shopId]);

    // Helper function to check if crop is Sabzi Mandi type
    const isSabziMandi = React.useCallback(() => {
        if (!cropDetails || !cropDetails.cropType) {
            console.log('CropMenuCards - No cropDetails or cropType found');
            return false;
        }
        const cropType = String(cropDetails.cropType).toLowerCase().trim();
        console.log('CropMenuCards - Checking cropType:', cropType);
        // Check for various possible formats: "sabzi mandi", "sabzimandi", "1" (if stored as number)
        const isSabzi = cropType === 'sabzi mandi' ||
               cropType === 'sabzimandi' ||
               cropType === '1' ||
               cropType.includes('sabzi');
        console.log('CropMenuCards - Is Sabzi Mandi?', isSabzi);
        return isSabzi;
    }, [cropDetails]);

    // Determine receipt route based on cropType
    const getReceiptRoute = React.useCallback(() => {
        let baseRoute;
        if (isSabziMandi()) {
            baseRoute = `/new-vegetable-receipt/${userId}/${cropId}`;
        } else {
            // Default to Dana Mandi for "Mandi" or any other type
            baseRoute = `/new-dana-receipt/${userId}/${cropId}`;
        }
        // Append shopId if admin is viewing
        return getRouteWithShopId(baseRoute);
    }, [isSabziMandi, userId, cropId, getRouteWithShopId]);

    // Get description based on crop type
    const getReceiptDescription = React.useCallback(() => {
        if (isSabziMandi()) {
            return t('create_new_sabzi_mandi_order');
        }
        return t('create_new_dana_mandi_order');
    }, [isSabziMandi, t]);

    const menuItems = React.useMemo(() => {
        const receiptDescription = getReceiptDescription();
        const receiptRoute = getReceiptRoute();
        console.log('CropMenuCards - Menu Items - Description:', receiptDescription, 'Route:', receiptRoute);

        return [
            {
                title: t('create_receipt'),
                description: receiptDescription,
                image: receiptIcon,
                route: receiptRoute,
                icon: <IconFile className="w-8 h-8" />,
                color: 'primary',
            },
        {
            title: t('receipt_list'),
            description: t('view_all_orders_crop'),
            image: receiptIcon,
            route: `/crop-receipt-list/${userId}/${cropId}`,
            icon: <IconMenuCalendar className="w-8 h-8" />,
            color: 'info',
        },
        {
            title: t('buyer_list'),
            description: t('buyer_list_full_desc'),
            image: receiptIcon,
            route: `/crop-buyer-list/${userId}/${cropId}`,
            icon: <IconMenuUsers className="w-8 h-8" />,
            color: 'success',
        },
        {
            title: t('malakhta'),
            description: t('malakhta_desc'),
            image: receiptIcon,
            route: `/crop-malakhta-list/${userId}/${cropId}`,
            icon: <IconCashBanknotes className="w-8 h-8" />,
            color: 'harvest',
        },
        {
            title: t('customer_list'),
            description: t('view_customers_crop'),
            image: receiptIcon,
            route: `/crop-customer-list/${userId}/${cropId}`,
            icon: <IconUsers className="w-8 h-8" />,
            color: 'success',
        },
        {
            title: t('give_loan'),
            description: t('provide_loan_desc'),
            image: loanIcon,
            route: `/finance-form/${userId}/${cropId}`,
            icon: <IconCashBanknotes className="w-8 h-8" />,
            color: 'harvest',
        },
        {
            title: t('loan_list'),
            description: t('view_loans_crop'),
            image: loanIcon,
            route: `/loan/${userId}/${cropId}`,
            icon: <IconMenuCalendar className="w-8 h-8" />,
            color: 'warning',
        },
        {
            title: t('pos_user_record'),
            description: t('pos_requests_payments_crop'),
            image: loanIcon,
            route: getRouteWithShopId(`/crop-pos-record/${userId}/${cropId}`),
            icon: <IconCashBanknotes className="w-8 h-8" />,
            color: 'info',
        },
        {
            title: t('history_label'),
            description: t('view_transaction_history'),
            image: historyIcon,
            route: `/history/${userId}/${cropId}`,
            icon: <IconNotes className="w-8 h-8" />,
            color: 'crop',
        },
    ];
    }, [getReceiptDescription, getReceiptRoute, getRouteWithShopId, userId, cropId, t]);

    // Sub-card shell: matches the Admin Overview stat-card look — dark navy
    // bg with a green border in dark mode, light tint + border in light mode.
    const colorClasses = {
        primary: 'bg-primary-50 hover:bg-primary-100 border-primary-200 dark:bg-[#0e1726] dark:hover:bg-[#0e1726] dark:border-green-800/40 dark:hover:border-green-600/60',
        success: 'bg-success-50 hover:bg-success-100 border-success-200 dark:bg-[#0e1726] dark:hover:bg-[#0e1726] dark:border-green-800/40 dark:hover:border-green-600/60',
        info: 'bg-info-50 hover:bg-info-100 border-info-200 dark:bg-[#0e1726] dark:hover:bg-[#0e1726] dark:border-green-800/40 dark:hover:border-green-600/60',
        harvest: 'bg-harvest-50 hover:bg-harvest-100 border-harvest-200 dark:bg-[#0e1726] dark:hover:bg-[#0e1726] dark:border-green-800/40 dark:hover:border-green-600/60',
        warning: 'bg-warning-50 hover:bg-warning-100 border-warning-200 dark:bg-[#0e1726] dark:hover:bg-[#0e1726] dark:border-green-800/40 dark:hover:border-green-600/60',
        crop: 'bg-crop-50 hover:bg-crop-100 border-crop-200 dark:bg-[#0e1726] dark:hover:bg-[#0e1726] dark:border-green-800/40 dark:hover:border-green-600/60',
    };

    // Icon tile: light mode keeps the category tint, dark mode always shows
    // the green icon-on-dark-green-tile look from the dashboard cards.
    const iconColorClasses = {
        primary: 'bg-primary-100 text-primary-600 dark:bg-green-900/30 dark:text-green-400',
        success: 'bg-success-100 text-success-600 dark:bg-green-900/30 dark:text-green-400',
        info: 'bg-info-100 text-info-600 dark:bg-green-900/30 dark:text-green-400',
        harvest: 'bg-harvest-100 text-harvest-600 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-warning-100 text-warning-600 dark:bg-green-900/30 dark:text-green-400',
        crop: 'bg-crop-100 text-crop-600 dark:bg-green-900/30 dark:text-green-400',
    };

    return (
        <div>
            {/* Breadcrumb */}
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li>
                    <Link to="/dashboard" className="text-primary hover:underline">
                        {t('dashboard')}
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link to="/getassginshopcrops" className="text-primary hover:underline">
                        {t('my_crops')}
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>{t('crop_management')}</span>
                </li>
            </ul>

            {/* Back button - top right, outside card */}
            <div className="flex justify-end mb-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                >
                    <span>←</span> {t('back_to_crops')}
                </button>
            </div>

            {/* Single main panel — title + description + all sub-cards inside,
                same shell as the Admin Overview dashboard panel */}
            <div className="panel shadow-md dark:shadow-none rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xl">
                        🌾
                    </div>
                    <div>
                        <h5 className="font-semibold text-lg dark:text-white-light">{t('crop_management')}</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('crop_management_desc')}</p>
                    </div>
                </div>

                {loadingCrop ? (
                    <div className="text-center py-12">
                        <div className="animate-spin border-4 border-green-600 border-t-transparent rounded-full w-12 h-12 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">{t('loading_crop_details')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menuItems.map((item) => (
                            <div
                                key={item.title}
                                onClick={() => navigate(getRouteWithShopId(item.route))}
                                className={`group cursor-pointer border-2 ${colorClasses[item.color as keyof typeof colorClasses]} rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 transform`}
                            >
                                <div className="flex items-start space-x-6 rtl:space-x-reverse">
                                    <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center ${iconColorClasses[item.color as keyof typeof iconColorClasses]} shadow-md dark:shadow-none group-hover:shadow-lg dark:group-hover:shadow-md transition-shadow`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">{item.title}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                    <span>{t('click_to_open')}</span>
                                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CropMenuCards;
