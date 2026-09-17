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
                tag: t('crop_menu_tag_mandi_pos', 'Mandi POS'),
            },
        {
            title: t('receipt_list'),
            description: t('view_all_orders_crop'),
            image: receiptIcon,
            route: `/crop-receipt-list/${userId}/${cropId}`,
            icon: <IconMenuCalendar className="w-8 h-8" />,
            color: 'info',
            tag: t('crop_menu_tag_orders_log', 'Orders Log'),
        },
        {
            title: t('buyer_list'),
            description: t('buyer_list_full_desc'),
            image: receiptIcon,
            route: `/crop-buyer-list/${userId}/${cropId}`,
            icon: <IconMenuUsers className="w-8 h-8" />,
            color: 'success',
            tag: t('crop_menu_tag_payments', 'Payments'),
        },
        {
            title: t('malakhta'),
            description: t('malakhta_desc'),
            image: receiptIcon,
            route: `/crop-malakhta-list/${userId}/${cropId}`,
            icon: <IconCashBanknotes className="w-8 h-8" />,
            color: 'harvest',
            tag: t('crop_menu_tag_payouts', 'Payouts'),
        },
        {
            title: t('customer_list'),
            description: t('view_customers_crop'),
            image: receiptIcon,
            route: `/crop-customer-list/${userId}/${cropId}`,
            icon: <IconUsers className="w-8 h-8" />,
            color: 'success',
            tag: t('crop_menu_tag_farmers', 'Farmers & Growers'),
        },
        {
            title: t('give_loan'),
            description: t('provide_loan_desc'),
            image: loanIcon,
            route: `/finance-form/${userId}/${cropId}`,
            icon: <IconCashBanknotes className="w-8 h-8" />,
            color: 'harvest',
            tag: t('crop_menu_tag_disbursement', 'Disbursement'),
        },
        {
            title: t('loan_list'),
            description: t('view_loans_crop'),
            image: loanIcon,
            route: `/loan/${userId}/${cropId}`,
            icon: <IconMenuCalendar className="w-8 h-8" />,
            color: 'warning',
            tag: t('crop_menu_tag_recovery', 'Recovery Record'),
        },
        {
            title: t('pos_user_record'),
            description: t('pos_requests_payments_crop'),
            image: loanIcon,
            route: getRouteWithShopId(`/crop-pos-record/${userId}/${cropId}`),
            icon: <IconCashBanknotes className="w-8 h-8" />,
            color: 'info',
            tag: t('crop_menu_tag_terminal', 'Terminal Logs'),
        },
        {
            title: t('history_label'),
            description: t('view_transaction_history'),
            image: historyIcon,
            route: `/history/${userId}/${cropId}`,
            icon: <IconNotes className="w-8 h-8" />,
            color: 'crop',
            tag: t('crop_menu_tag_audit', 'Audit Trail'),
        },
    ];
    }, [getReceiptDescription, getReceiptRoute, getRouteWithShopId, userId, cropId, t]);

    // Card shell — dark mode is a uniform obsidian/emerald tile (matched to
    // the Stitch "Crop Dashboard" design); light mode keeps the per-category
    // tint so the existing look outside dark mode doesn't change.
    const colorClasses = {
        primary: 'bg-primary-50 hover:bg-primary-100 border-primary-200 dark:bg-[#0b1725] dark:hover:bg-[#0b1725] dark:border-[#14283f] dark:hover:border-emerald-500/50',
        success: 'bg-success-50 hover:bg-success-100 border-success-200 dark:bg-[#0b1725] dark:hover:bg-[#0b1725] dark:border-[#14283f] dark:hover:border-emerald-500/50',
        info: 'bg-info-50 hover:bg-info-100 border-info-200 dark:bg-[#0b1725] dark:hover:bg-[#0b1725] dark:border-[#14283f] dark:hover:border-emerald-500/50',
        harvest: 'bg-harvest-50 hover:bg-harvest-100 border-harvest-200 dark:bg-[#0b1725] dark:hover:bg-[#0b1725] dark:border-[#14283f] dark:hover:border-emerald-500/50',
        warning: 'bg-warning-50 hover:bg-warning-100 border-warning-200 dark:bg-[#0b1725] dark:hover:bg-[#0b1725] dark:border-[#14283f] dark:hover:border-emerald-500/50',
        crop: 'bg-crop-50 hover:bg-crop-100 border-crop-200 dark:bg-[#0b1725] dark:hover:bg-[#0b1725] dark:border-[#14283f] dark:hover:border-emerald-500/50',
    };

    // Icon tile: light mode keeps the category tint, dark mode always shows
    // the emerald icon-on-dark tile look from the Stitch cards.
    const iconColorClasses = {
        primary: 'bg-primary-100 text-primary-600 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:text-emerald-400',
        success: 'bg-success-100 text-success-600 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:text-emerald-400',
        info: 'bg-info-100 text-info-600 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:text-emerald-400',
        harvest: 'bg-harvest-100 text-harvest-600 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:text-emerald-400',
        warning: 'bg-warning-100 text-warning-600 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:text-emerald-400',
        crop: 'bg-crop-100 text-crop-600 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:text-emerald-400',
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

            {/* Action banner: title + description + Back to Crops */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-stone-900 dark:text-white tracking-tight">{t('crop_management')}</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{t('crop_management_desc')}</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border dark:border-emerald-500/40 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:border-emerald-500 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 shrink-0"
                >
                    <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    {t('back_to_crops')}
                </button>
            </div>

            {/* Crop header banner */}
            <div className="relative overflow-hidden rounded-2xl border border-green-200 dark:border-[#172d47] bg-white dark:bg-gradient-to-r dark:from-[#0d1d2e] dark:via-[#0c1a29] dark:to-[#0a1523] p-6 shadow-sm dark:shadow-md mb-6">
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-13 h-13 shrink-0 rounded-2xl bg-green-100 dark:bg-emerald-500/10 border border-green-200 dark:border-emerald-500/30 flex items-center justify-center p-3 text-xl">
                        🌾
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-stone-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
                            <span>{t('crop_management')}</span>
                            <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                                {t('crop_menu_active_season', 'Active Season')}
                            </span>
                        </h3>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">{t('crop_management_desc')}</p>
                    </div>
                </div>
                <div className="pointer-events-none absolute -right-10 -bottom-10 hidden h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl dark:block" />
            </div>

            {loadingCrop ? (
                <div className="text-center py-12">
                    <div className="animate-spin border-4 border-green-600 border-t-transparent rounded-full w-12 h-12 mx-auto mb-4 dark:border-emerald-500 dark:border-t-transparent"></div>
                    <p className="text-gray-600 dark:text-slate-400">{t('loading_crop_details')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item) => (
                        <div
                            key={item.title}
                            onClick={() => navigate(getRouteWithShopId(item.route))}
                            className={`group cursor-pointer border-2 ${colorClasses[item.color as keyof typeof colorClasses]} rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 transform flex flex-col justify-between`}
                        >
                            <div>
                                <div className="flex items-start space-x-4 rtl:space-x-reverse sm:space-x-6">
                                    <div className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center ${iconColorClasses[item.color as keyof typeof iconColorClasses]} shadow-md dark:shadow-none group-hover:shadow-lg dark:group-hover:shadow-md group-hover:scale-105 transition-all duration-200`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-gray-800 dark:text-white dark:group-hover:text-emerald-300 transition truncate">{item.title}</h3>
                                        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#132439] flex items-center justify-between text-sm font-medium text-gray-500 dark:text-emerald-400/90 group-hover:text-green-600 dark:group-hover:text-emerald-300 transition-colors">
                                <span className="inline-flex items-center gap-1">
                                    <span>{t('click_to_open')}</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                                <span className="hidden text-xs text-slate-500 dark:inline">{item.tag}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CropMenuCards;
