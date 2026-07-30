export const useAuthToken = () => {
    const storedUserRaw = localStorage.getItem('userInformation');
    const tokenFromStorage = localStorage.getItem('token'); // Also check direct token storage

    if (!storedUserRaw && !tokenFromStorage) {
        return { token: null, user: null };
    }

    try {
        let token = null;
        let user = null;

        // Try to get token from userInformation first
        if (storedUserRaw) {
            const storedUser = JSON.parse(storedUserRaw);
            token = storedUser?.token || null;
            user = storedUser?.data || null;
        }

        // Fallback to direct token storage if not found
        if (!token && tokenFromStorage) {
            token = tokenFromStorage;
        }

        return { token, user };
    } catch (error) {
        console.error('Error parsing localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('userInformation');
        localStorage.removeItem('token');
        return { token: null, user: null };
    }
};
