import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useAuthToken } from '../../Hooks/useAuthToken';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';

// ✅ Import images directly
import receiptIcon from '../../assets/images/cropmenuicon/receipt.svg';
import loanIcon from '../../assets/images/cropmenuicon/loan.svg';
import historyIcon from '../../assets/images/cropmenuicon/history.svg';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import PageHeader from '../../components/Agricultural/PageHeader';
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
            return 'Create new Sabzi Mandi order';
        }
        return 'Create new Dana Mandi order';
    }, [isSabziMandi]);

    const menuItems = React.useMemo(() => {
        const receiptDescription = getReceiptDescription();
        const receiptRoute = getReceiptRoute();
        console.log('CropMenuCards - Menu Items - Description:', receiptDescription, 'Route:', receiptRoute);
        
        return [
            {
                title: 'Create Receipt',
                description: receiptDescription,
                image: receiptIcon,
                route: receiptRoute,
                icon: <IconFile className="w-8 h-8" />,
                color: 'primary',
            },
        {
            title: 'Receipt List',
            description: 'View all orders for this crop',
            image: receiptIcon,
            route: `/crop-receipt-list/${userId}/${cropId}`,
            icon: <IconMenuCalendar className="w-8 h-8" />,
            color: 'info',
        },
        {
            title: 'Buyer List',
            description: 'Order list with buyer name, amount, status & payment received',
            image: receiptIcon,
            route: `/crop-buyer-list/${userId}/${cropId}`,
            icon: <IconMenuUsers className="w-8 h-8" />,
            color: 'success',
        },
        {
            title: 'Malakhta',
            description: 'Malakhta orders – pay to Malakhta owner & history',
            image: receiptIcon,
            route: `/crop-malakhta-list/${userId}/${cropId}`,
            icon: <IconCashBanknotes className="w-8 h-8" />,
            color: 'harvest',
        },
        {
            title: 'Customer List',
            description: 'View customers for this crop',
            image: receiptIcon,
            route: `/crop-customer-list/${userId}/${cropId}`,
            icon: <IconUsers className="w-8 h-8" />,
            color: 'success',
        },
        {
            title: 'Give Loan',
            description: 'Provide loan to customer',
            image: loanIcon,
            route: `/finance-form/${userId}/${cropId}`,
            icon: <IconCashBanknotes className="w-8 h-8" />,
            color: 'harvest',
        },
        {
            title: 'Loan List',
            description: 'View all loans for this crop',
            image: loanIcon,
            route: `/loan/${userId}/${cropId}`,
            icon: <IconMenuCalendar className="w-8 h-8" />,
            color: 'warning',
        },
        {
            title: 'POS User Record',
            description: 'POS requests & payments for this crop',
            image: loanIcon,
            route: getRouteWithShopId(`/crop-pos-record/${userId}/${cropId}`),
            icon: <IconCashBanknotes className="w-8 h-8" />,
            color: 'info',
        },
        {
            title: 'History',
            description: 'View transaction history',
            image: historyIcon,
            route: `/history/${userId}/${cropId}`,
            icon: <IconNotes className="w-8 h-8" />,
            color: 'crop',
        },
    ];
    }, [getReceiptDescription, getReceiptRoute, getRouteWithShopId, userId, cropId]);

    const colorClasses = {
        primary: 'bg-primary-50 hover:bg-primary-100 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-400',
        success: 'bg-success-50 hover:bg-success-100 border-success-200 text-success-700 dark:bg-success-900/20 dark:border-success-800 dark:text-success-400',
        info: 'bg-info-50 hover:bg-info-100 border-info-200 text-info-700 dark:bg-info-900/20 dark:border-info-800 dark:text-info-400',
        harvest: 'bg-harvest-50 hover:bg-harvest-100 border-harvest-200 text-harvest-700 dark:bg-harvest-900/20 dark:border-harvest-800 dark:text-harvest-400',
        warning: 'bg-warning-50 hover:bg-warning-100 border-warning-200 text-warning-700 dark:bg-warning-900/20 dark:border-warning-800 dark:text-warning-400',
        crop: 'bg-crop-50 hover:bg-crop-100 border-crop-200 text-crop-700 dark:bg-crop-900/20 dark:border-crop-800 dark:text-crop-400',
    };

    return (
        <div>
            {/* Breadcrumb */}
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li>
                    <Link to="/dashboard" className="text-primary hover:underline">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link to="/getassginshopcrops" className="text-primary hover:underline">
                        My Crops
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Crop Management</span>
                </li>
            </ul>

            {/* Header */}
            <PageHeader
                title="Crop Management"
                description="Manage orders, customers, and loans for this crop"
                onBack={() => navigate(-1)}
                backLabel="Back to Crops"
                icon="🌾"
            />

            {/* Loading State */}
            {loadingCrop ? (
                <div className="panel text-center py-12">
                    <div className="animate-spin border-4 border-primary-600 border-t-transparent rounded-full w-12 h-12 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading crop details...</p>
                </div>
            ) : (
                <>
                    {/* Menu Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item) => (
                        <div
                            key={item.title}
                            onClick={() => navigate(getRouteWithShopId(item.route))}
                            className={`group cursor-pointer panel border-2 ${colorClasses[item.color as keyof typeof colorClasses]} rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 transform`}
                        >
                            <div className="flex items-start space-x-4">
                                <div className={`flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center bg-white dark:bg-gray-800 shadow-md group-hover:shadow-lg transition-shadow`}>
                                    {item.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                    <p className="text-sm opacity-80">{item.description}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                                <span>Click to open</span>
                                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default CropMenuCards;
