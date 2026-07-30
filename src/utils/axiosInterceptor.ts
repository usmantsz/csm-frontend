import axios from 'axios';
import { Notification } from '../helperComponents/Notification';
import { showSubscriptionExpired } from '../utils/sweetAlert';

// Request interceptor - Add token to all requests
axios.interceptors.request.use(
    (config) => {
        // Get token from localStorage - check multiple locations
        let token = null;
        
        // First, try to get from userInformation
        const storedUserRaw = localStorage.getItem('userInformation');
        if (storedUserRaw) {
            try {
                const storedUser = JSON.parse(storedUserRaw);
                token = storedUser?.token;
            } catch (error) {
                console.error('Error parsing user information:', error);
            }
        }
        
        // Fallback to direct token storage
        if (!token) {
            token = localStorage.getItem('token');
        }
        
        // Add token to request if available
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized - No token or invalid token
        if (error.response?.status === 401) {
            const message = error.response?.data?.message || 'Authentication required';
            
            // Only clear and redirect if not already on login/forgot password pages
            const currentPath = window.location.pathname;
            const isAuthPage = currentPath.includes('/login') || 
                              currentPath.includes('/forgotpassword') || 
                              currentPath === '/' ||
                              currentPath === '';
            
            if (!isAuthPage) {
                const userRole = localStorage.getItem('userRole');
                const loginSource = localStorage.getItem('loginSource');
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userInformation');
                localStorage.removeItem('userRole');
                localStorage.removeItem('token');
                localStorage.removeItem('loginSource');
                Notification({
                    text: message === 'No token provided.' ? 'Please login to continue.' : message,
                    color: 'warning',
                });
                let loginPath = '/login';
                if (userRole === 'customer') loginPath = '/customer-login';
                else if (loginSource === 'pos') loginPath = '/pos-login';
                else if (userRole === '1') loginPath = '/shopowner-login';
                setTimeout(() => {
                    window.location.href = loginPath;
                }, 1500);
            }
        }

        if (error.response?.status === 403 && error.response?.data?.subscriptionExpired) {
            const userRole = localStorage.getItem('userRole');
            const loginSource = localStorage.getItem('loginSource');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userInformation');
            localStorage.removeItem('userRole');
            localStorage.removeItem('token');
            localStorage.removeItem('loginSource');
            showSubscriptionExpired(error.response?.data?.message);
            let loginPath = '/login';
            if (userRole === 'customer') loginPath = '/customer-login';
            else if (loginSource === 'pos') loginPath = '/pos-login';
            else if (userRole === '1') loginPath = '/shopowner-login';
            setTimeout(() => {
                window.location.href = loginPath;
            }, 500);
            return Promise.reject(error);
        }

        // Handle other 403 Forbidden
        if (error.response?.status === 403) {
            Notification({ 
                text: error.response?.data?.message || 'You do not have permission to access this resource.', 
                color: 'danger' 
            });
        }
        
        // Handle 429 Rate Limit
        if (error.response?.status === 429) {
            const retryAfter = error.response?.data?.retryAfter || 60;
            Notification({ 
                text: `Too many requests. Please wait ${retryAfter} seconds.`, 
                color: 'warning' 
            });
        }
        
        return Promise.reject(error);
    }
);

