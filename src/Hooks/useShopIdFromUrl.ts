import { useSearchParams } from 'react-router-dom';
import { useShopId } from './useShopId';
import { useAuthToken } from './useAuthToken';

/**
 * Hook to get shopId from URL query params (for admin view) or from logged-in user (for shop owner)
 * @returns shopId from URL if admin is viewing, otherwise from logged-in user
 */
export function useShopIdFromUrl() {
    const [searchParams] = useSearchParams();
    const { user } = useAuthToken();
    const { shopId: userShopId, loading: userShopIdLoading } = useShopId(); // Always call hook (React rules)
    
    const isAdmin = user?.userRole === 'Admin' || user?.userRole === 'admin' || user?.userRole === '0';
    const urlShopId = searchParams.get('shopId');
    
    // If admin is viewing and shopId is in URL, use that; otherwise use logged-in user's shopId
    // Also use URL shopId if it exists, even if not admin (for flexibility)
    // For admin, don't use userShopId (which would be null anyway) if urlShopId is missing
    const shopId = urlShopId || (!isAdmin ? userShopId : null);
    
    return { shopId, isAdmin, isViewingAsAdmin: isAdmin && !!urlShopId, loading: userShopIdLoading };
}

