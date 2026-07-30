import { useState, useEffect } from "react";
import axios from "axios";
import { useAuthToken } from './/useAuthToken';
import { ServerSetting } from './../helperComponents/ServerSetting';

export function useShopId() {
    const { token, user } = useAuthToken();
    const [shopId, setShopId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?._id) return;

        async function fetchShopId() {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(
                    `${ServerSetting.serUrl}/api/getShopId/${user._id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        }
                    }
                );
                if (response.data && response.data.status === 200 && response.data.data) {
                    const shopData = response.data.data;
                    const fetchedShopId = shopData._id || shopData;
                    if (fetchedShopId) {
                        setShopId(fetchedShopId);
                        setError(null);
                    } else {
                        setShopId(null);
                        setError("Shop ID not found in response. Please contact admin.");
                    }
                } else {
                    setShopId(null);
                    setError("Shop not found for this user. Please contact admin to assign a shop.");
                }
            } catch (err: any) {
                setShopId(null);
                if (err.response?.status === 404) {
                    setError("No shop found for this user. Please contact admin to assign a shop.");
                } else {
                    setError(err.response?.data?.message || "Failed to fetch shop id");
                }
            } finally {
                setLoading(false);
            }
        }

        fetchShopId();
    }, [user?._id, token]);

    return { shopId, loading, error };
}
