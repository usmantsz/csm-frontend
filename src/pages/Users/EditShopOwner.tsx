import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { useUserPermissions } from '../../Hooks/useUserPermissions';
import { canPerformRestrictedActions } from '../../constants/permissions';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconHome from '../../components/Icon/IconHome';
import IconMenuShop from '../../components/Icon/Menu/IconMenuShop';
import IconUser from '../../components/Icon/IconUser';
import IconPhone from '../../components/Icon/IconPhone';
import { showSuccess, showError } from '../../utils/sweetAlert';
import DOMPurify from 'dompurify';
import IconSearch from '../../components/Icon/IconSearch';
import { CROP_TYPE_OPTIONS, normalizeCropType } from '../../constants/cropTypes';

interface UserForm {
    userNameF: string;
    userNameL: string;
    userPhone: string;
    userEmail: string;
    userCNIC: string;
    userProvince: string;
    userCity: string;
    userAdress: string;
    userStatus: string;
    userProfileImage: string | File;
}

interface ShopForm {
    shopId: string;
    shopName: string;
    shopNumber: string;
    shopAddress: string;
    shopProvince: string;
    shopCity: string;
    shopRegistrationNumber: string;
    shopBillImageTop: string | File;
}

const initialUserErrors = {
    userNameF: '', userNameL: '', userPhone: '', userEmail: '', userCNIC: '',
    userProvince: '', userCity: '', userAdress: '',
};

const initialShopErrors = {
    shopName: '', shopNumber: '', shopAddress: '', shopProvince: '', shopCity: '', shopRegistrationNumber: '',
};

const EditShopOwner = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const { userRole } = useUserPermissions();
    
    // Only Admin (0) and Sub Admin (2) can change user status (Block/Delete)
    const canChangeStatus = canPerformRestrictedActions(userRole);

    const [loading, setLoading] = useState(true);
    const [savingUser, setSavingUser] = useState(false);
    const [savingShop, setSavingShop] = useState(false);
    const [activeTab, setActiveTab] = useState<'user' | 'shop' | 'subscription' | 'crops'>('user');
    
    // Subscription state
    const [activeSubscription, setActiveSubscription] = useState<any>(null);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loadingSubscription, setLoadingSubscription] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentModalType, setPaymentModalType] = useState<'renew' | 'subscribe'>('renew');
    const [paymentForm, setPaymentForm] = useState({ paymentMethod: 'bank', remarks: '', transactionId: '' });
    const [pendingSubscribe, setPendingSubscribe] = useState<{ subId: string; months: number } | null>(null);
    
    // Crops state
    const [allCrops, setAllCrops] = useState<any[]>([]);
    const [assignedCrops, setAssignedCrops] = useState<any[]>([]);
    const [selectedCropsToAdd, setSelectedCropsToAdd] = useState<string[]>([]);
    const [loadingCrops, setLoadingCrops] = useState(false);
    const [cropSearchQuery, setCropSearchQuery] = useState('');
    const [cropTypeFilter, setCropTypeFilter] = useState('');

    const [userForm, setUserForm] = useState<UserForm>({
        userNameF: '', userNameL: '', userPhone: '', userEmail: '', userCNIC: '',
        userProvince: '', userCity: '', userAdress: '', userStatus: '1',
        userProfileImage: '',
    });
    const [shopForm, setShopForm] = useState<ShopForm>({
        shopId: '', shopName: '', shopNumber: '', shopAddress: '', shopProvince: '', shopCity: '',
        shopRegistrationNumber: '', shopBillImageTop: '',
    });

    const [userErrors, setUserErrors] = useState(initialUserErrors);
    const [shopErrors, setShopErrors] = useState(initialShopErrors);
    const [userProfilePreview, setUserProfilePreview] = useState<string>('');
    const [shopImagePreview, setShopImagePreview] = useState<string>('');
    const [hasShop, setHasShop] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Edit Shop Owner'));
    }, [dispatch]);

    useEffect(() => {
        console.log('[EditShopOwner] Mounted with userId:', userId, 'token:', !!token);
        if (userId && token) {
            fetchUserAndShop();
            fetchSubscriptions();
            fetchAllCrops();
        } else {
            setLoading(false);
            if (!userId) {
                console.error('[EditShopOwner] Missing userId');
                Notification({ text: 'User ID is missing.', color: 'danger' });
            }
            if (!token) {
                console.error('[EditShopOwner] Missing token');
            }
        }
    }, [userId, token]);
    
    useEffect(() => {
        if (activeTab === 'subscription' && userId && token) {
            fetchActiveSubscription();
        }
    }, [activeTab, userId, token]);

    useEffect(() => {
        if (activeTab === 'crops' && userId && token) {
            // Fetch crops when crops tab is opened, even if no subscription yet
            if (activeSubscription) {
                fetchAssignedCrops();
            } else {
                // Try to fetch crops anyway (API can work without subId)
                fetchAssignedCrops();
            }
        }
    }, [activeTab, userId, token, activeSubscription]);

    const fetchUserAndShop = async () => {
        if (!userId || !token) {
            console.warn('[EditShopOwner] Cannot fetch - missing userId or token', { userId, hasToken: !!token });
            return;
        }
        setLoading(true);
        console.log('[EditShopOwner] Fetching user and shop for userId:', userId);
        try {
            const [userRes, shopRes] = await Promise.all([
                axios.get(`${ServerSetting.serUrl}/api/user/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).catch((err) => {
                    console.error('[EditShopOwner] Error fetching user:', err.response?.data || err.message);
                    throw err;
                }),
                axios.get(`${ServerSetting.serUrl}/api/getShopId/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).catch((err) => {
                    console.warn('[EditShopOwner] Shop not found (this is OK):', err.response?.data || err.message);
                    return { data: { status: 404 } };
                }),
            ]);

            console.log('[EditShopOwner] User response:', userRes.data);
            console.log('[EditShopOwner] Shop response:', shopRes.data);

            if (userRes.data.status === 200 && userRes.data.data) {
                const u = userRes.data.data;
                setUserForm({
                    userNameF: u.userNameF || '',
                    userNameL: u.userNameL || '',
                    userPhone: String(u.userPhone || ''),
                    userEmail: u.userEmail || '',
                    userCNIC: String(u.userCNIC || ''),
                    userProvince: u.userProvince || '',
                    userCity: u.userCity || '',
                    userAdress: u.userAdress || '',
                    userStatus: String(u.userStatus ?? '1'),
                    userProfileImage: u.userProfileImage || '',
                });
                if (u.userProfileImage) {
                    setUserProfilePreview(`${ServerSetting.serUrl}/profile/${u.userProfileImage}`);
                }
            } else {
                Notification({ text: userRes.data.message || 'User not found.', color: 'danger' });
                navigate('/shopowner');
                return;
            }

            if (shopRes.data.status === 200 && shopRes.data.data) {
                const s = shopRes.data.data;
                setHasShop(true);
                setShopForm({
                    shopId: s._id,
                    shopName: s.shopName || '',
                    shopNumber: s.shopNumber || '',
                    shopAddress: s.shopAddress || '',
                    shopProvince: s.shopProvince || '',
                    shopCity: s.shopCity || '',
                    shopRegistrationNumber: s.shopRegistrationNumber || '',
                    shopBillImageTop: s.shopBillImageTop || '',
                });
                if (s.shopBillImageTop) {
                    setShopImagePreview(`${ServerSetting.serUrl}/shop/${s.shopBillImageTop}`);
                }
            } else {
                setHasShop(false);
            }
        } catch (err: any) {
            console.error('Fetch error:', err);
            Notification({ text: err.response?.data?.message || 'Failed to load data.', color: 'danger' });
            navigate('/shopowner');
        } finally {
            setLoading(false);
        }
    };

    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'userProfileImage' && e.target instanceof HTMLInputElement && e.target.files?.[0]) {
            const file = e.target.files[0];
            setUserForm((prev) => ({ ...prev, userProfileImage: file }));
            setUserProfilePreview(URL.createObjectURL(file));
            setUserErrors((prev) => ({ ...prev, userProfileImage: '' }));
        } else {
            setUserForm((prev) => ({ ...prev, [name]: value }));
            setUserErrors((prev) => ({ ...prev, [name]: value.trim() ? '' : 'This field is required' }));
        }
    };

    const handleShopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, files } = e.target;
        if (type === 'file' && files?.[0]) {
            const file = files[0];
            setShopForm((prev) => ({ ...prev, [name]: file }));
            setShopImagePreview(URL.createObjectURL(file));
            setShopErrors((prev) => ({ ...prev, [name]: '' }));
        } else {
            setShopForm((prev) => ({ ...prev, [name]: value }));
            setShopErrors((prev) => ({ ...prev, [name]: value.trim() ? '' : 'This field is required' }));
        }
    };

    const validateUser = () => {
        const e = { ...initialUserErrors };
        if (!userForm.userNameF.trim()) e.userNameF = 'This field is required';
        if (!userForm.userNameL.trim()) e.userNameL = 'This field is required';
        if (!userForm.userPhone.trim()) e.userPhone = 'This field is required';
        if (!userForm.userEmail.trim()) e.userEmail = 'This field is required';
        if (!userForm.userCNIC.trim()) e.userCNIC = 'This field is required';
        if (!userForm.userProvince.trim()) e.userProvince = 'This field is required';
        if (!userForm.userCity.trim()) e.userCity = 'This field is required';
        if (!userForm.userAdress.trim()) e.userAdress = 'This field is required';
        setUserErrors(e);
        return !Object.values(e).some((v) => v);
    };

    const validateShop = () => {
        const e = { ...initialShopErrors };
        if (!shopForm.shopName.trim()) e.shopName = 'This field is required';
        if (!shopForm.shopNumber.trim()) e.shopNumber = 'This field is required';
        if (!shopForm.shopAddress.trim()) e.shopAddress = 'This field is required';
        if (!shopForm.shopProvince.trim()) e.shopProvince = 'This field is required';
        if (!shopForm.shopCity.trim()) e.shopCity = 'This field is required';
        if (!shopForm.shopRegistrationNumber.trim()) e.shopRegistrationNumber = 'This field is required';
        setShopErrors(e);
        return !Object.values(e).some((v) => v);
    };

    const saveUser = async () => {
        if (!validateUser() || !userId || !token) return;
        setSavingUser(true);
        try {
            const formData = new FormData();
            formData.append('userId', userId);
            formData.append('userNameF', userForm.userNameF);
            formData.append('userNameL', userForm.userNameL);
            formData.append('userPhone', userForm.userPhone);
            formData.append('userEmail', userForm.userEmail);
            formData.append('userCNIC', userForm.userCNIC);
            formData.append('userProvince', userForm.userProvince);
            formData.append('userCity', userForm.userCity);
            formData.append('userAdress', userForm.userAdress);
            if (canChangeStatus) formData.append('userStatus', userForm.userStatus);
            if (userForm.userProfileImage && typeof userForm.userProfileImage !== 'string') {
                formData.append('userProfileImage', userForm.userProfileImage);
            }

            const res = await axios.patch(`${ServerSetting.serUrl}/api/updateUserAdmin`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.status === 200) {
                showSuccess('User details updated successfully.');
            } else {
                showError(res.data.message || 'Failed to update user.');
            }
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error updating user.');
        } finally {
            setSavingUser(false);
        }
    };

    const saveShop = async () => {
        if (!validateShop() || !shopForm.shopId || !token) return;
        setSavingShop(true);
        try {
            const formData = new FormData();
            formData.append('shopId', shopForm.shopId);
            formData.append('shopName', shopForm.shopName);
            formData.append('shopNumber', shopForm.shopNumber);
            formData.append('shopAddress', shopForm.shopAddress);
            formData.append('shopProvince', shopForm.shopProvince);
            formData.append('shopCity', shopForm.shopCity);
            formData.append('shopRegistrationNumber', shopForm.shopRegistrationNumber);
            if (shopForm.shopBillImageTop && typeof shopForm.shopBillImageTop !== 'string') {
                formData.append('shopBillImageTop', shopForm.shopBillImageTop);
            }

            const res = await axios.patch(`${ServerSetting.serUrl}/api/editshop`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.status === 200) {
                showSuccess('Shop details updated successfully.');
                fetchUserAndShop();
            } else {
                showError(res.data.message || 'Failed to update shop.');
            }
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error updating shop.');
        } finally {
            setSavingShop(false);
        }
    };

    const fetchSubscriptions = async () => {
        try {
            const res = await axios.get(`${ServerSetting.serUrl}/api/viewsub`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.status === 200) {
                setSubscriptions(res.data.data || []);
            }
        } catch (err: any) {
            console.error('Error fetching subscriptions:', err);
        }
    };

    const fetchActiveSubscription = async () => {
        if (!userId || !token) {
            console.log('[EditShopOwner] Missing userId or token:', { userId: !!userId, token: !!token });
            return;
        }
        setLoadingSubscription(true);
        try {
            console.log('[EditShopOwner] Fetching active subscription for userId:', userId, 'Type:', typeof userId);
            const res = await axios.post(`${ServerSetting.serUrl}/api/getActiveSubscription`, { userId }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('[EditShopOwner] Subscription response status:', res.data.status);
            console.log('[EditShopOwner] Subscription response data:', res.data.data);
            console.log('[EditShopOwner] Full response:', res.data);
            
            if (res.data.status === 200 && res.data.data) {
                const subData = res.data.data;
                // Handle both formats: from subscriptions collection or from history
                console.log('[EditShopOwner] Setting subscription data:', {
                    hasSubId: !!subData.subId,
                    subIdType: typeof subData.subId,
                    subIdValue: subData.subId?._id || subData.subId,
                    status: subData.status,
                    isExpired: subData.isExpired
                });
                setActiveSubscription(subData);
            } else if (res.data.status === 404) {
                console.log('[EditShopOwner] No subscription found (404)');
                setActiveSubscription(null);
            } else {
                console.log('[EditShopOwner] Unexpected response:', res.data);
                setActiveSubscription(null);
            }
        } catch (err: any) {
            console.error('[EditShopOwner] Error fetching active subscription:', err);
            console.error('[EditShopOwner] Error response:', err.response?.data);
            console.error('[EditShopOwner] Error status:', err.response?.status);
            // Don't set to null on error, keep previous value if any
            if (err.response?.status === 404) {
                setActiveSubscription(null);
            }
        } finally {
            setLoadingSubscription(false);
        }
    };

    const fetchAllCrops = async () => {
        try {
            const res = await axios.get(`${ServerSetting.serUrl}/api/allviewcrop`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.status === 200) {
                setAllCrops(res.data.data || []);
            }
        } catch (err: any) {
            console.error('Error fetching crops:', err);
        }
    };

    const fetchAssignedCrops = async () => {
        if (!userId || !token) return;
        setLoadingCrops(true);
        try {
            // Get subId from activeSubscription (could be subId or subIdHistory)
            const subId = activeSubscription?.subId?._id || activeSubscription?.subId || null;
            console.log('[EditShopOwner] Fetching assigned crops for userId:', userId, 'subId:', subId);
            
            const res = await axios.post(`${ServerSetting.serUrl}/api/getAssignedCrops`, {
                userId,
                ...(subId && { subId }), // Only include subId if it exists
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('[EditShopOwner] Assigned crops response:', res.data);
            if (res.data.status === 200 && res.data.data) {
                const crops = res.data.data.cropIds || [];
                console.log('[EditShopOwner] Found', crops.length, 'assigned crops');
                setAssignedCrops(crops);
            } else {
                console.log('[EditShopOwner] No crops found');
                setAssignedCrops([]);
            }
        } catch (err: any) {
            console.error('[EditShopOwner] Error fetching assigned crops:', err);
            console.error('[EditShopOwner] Error response:', err.response?.data);
            setAssignedCrops([]);
        } finally {
            setLoadingCrops(false);
        }
    };

    const openSubscribePaymentModal = (subId: string, months: number) => {
        setPaymentModalType('subscribe');
        setPendingSubscribe({ subId, months });
        setPaymentForm({ paymentMethod: 'bank', remarks: '', transactionId: '' });
        setShowPaymentModal(true);
    };

    const changeSubscription = async (subId: string, months: number) => {
        openSubscribePaymentModal(subId, months);
    };

    const submitPaymentAndSubscribe = async () => {
        if (!userId || !token || !pendingSubscribe) return;
        setLoadingSubscription(true);
        setShowPaymentModal(false);
        try {
            const res = await axios.post(`${ServerSetting.serUrl}/api/subscribe`, {
                subId: pendingSubscribe.subId,
                months: pendingSubscribe.months,
                userId,
                paymentMethod: paymentForm.paymentMethod,
                remarks: paymentForm.remarks,
                transactionId: paymentForm.transactionId,
            }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.status === 200 || res.data.status === 201) {
                showSuccess('Subscription added successfully. Payment details recorded.');
                await fetchActiveSubscription();
                if (activeTab === 'crops') setTimeout(() => fetchAssignedCrops(), 1000);
            } else {
                showError(res.data.message || 'Failed to add subscription.');
            }
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error adding subscription.');
        } finally {
            setLoadingSubscription(false);
            setPendingSubscribe(null);
        }
    };

    const openRenewPaymentModal = () => {
        setPaymentModalType('renew');
        setPendingSubscribe(null);
        setPaymentForm({ paymentMethod: 'bank', remarks: '', transactionId: '' });
        setShowPaymentModal(true);
    };

    const submitPaymentAndRenew = async () => {
        if (!userId || !token || !activeSubscription) return;
        const subId = activeSubscription.subId?._id || activeSubscription.subId;
        if (!subId) {
            showError('Subscription ID not found. Cannot renew.');
            return;
        }
        const months = activeSubscription.subId?.timeDuration || activeSubscription.timeDuration || 1;
        setLoadingSubscription(true);
        setShowPaymentModal(false);
        try {
            const res = await axios.post(`${ServerSetting.serUrl}/api/renew`, {
                userId,
                subId,
                months,
                paymentMethod: paymentForm.paymentMethod,
                remarks: paymentForm.remarks,
                transactionId: paymentForm.transactionId,
            }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.status === 200) {
                showSuccess('Subscription renewed successfully. Payment details recorded.');
                await fetchActiveSubscription();
                if (activeTab === 'crops') setTimeout(() => fetchAssignedCrops(), 1000);
            } else {
                showError(res.data.message || 'Failed to renew subscription.');
            }
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error renewing subscription.');
        } finally {
            setLoadingSubscription(false);
        }
    };

    const handlePaymentModalConfirm = () => {
        if (paymentModalType === 'renew') submitPaymentAndRenew();
        else if (pendingSubscribe) submitPaymentAndSubscribe();
    };

    const removeCrops = async (cropIdsToRemove: string[]) => {
        if (!userId || !token) return;
        setLoadingCrops(true);
        try {
            // Get subId from activeSubscription (could be subId or subIdHistory)
            const subId = activeSubscription?.subId?._id || activeSubscription?.subId;
            if (!subId) {
                showError('Subscription ID not found. Please ensure user has an active subscription.');
                setLoadingCrops(false);
                return;
            }
            console.log('[EditShopOwner] Removing crops:', { userId, subId, cropIdsToRemove });
            const res = await axios.post(`${ServerSetting.serUrl}/api/removeCrops`, {
                userId,
                subId,
                cropIds: cropIdsToRemove,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('[EditShopOwner] Remove crops response:', res.data);
            if (res.data.status === 200) {
                showSuccess('Crops removed successfully.');
                await fetchAssignedCrops();
            } else {
                showError(res.data.message || 'Failed to remove crops.');
            }
        } catch (err: any) {
            console.error('[EditShopOwner] Error removing crops:', err);
            showError(err.response?.data?.message || 'Error removing crops.');
        } finally {
            setLoadingCrops(false);
        }
    };

    const addCrops = async () => {
        if (!userId || !token || selectedCropsToAdd.length === 0) {
            Notification({ text: 'Please select crops to add.', color: 'warning' });
            return;
        }
        // Get subId from activeSubscription (could be subId or subIdHistory)
        const subId = activeSubscription?.subId?._id || activeSubscription?.subId;
        if (!subId) {
            showError('Subscription ID not found. Please ensure user has an active subscription.');
            return;
        }
        setLoadingCrops(true);
        try {
            console.log('[EditShopOwner] Adding crops:', { userId, subId, cropIds: selectedCropsToAdd });
            const res = await axios.post(`${ServerSetting.serUrl}/api/assigncrop`, {
                userId,
                subId,
                cropIds: selectedCropsToAdd,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('[EditShopOwner] Add crops response:', res.data);
            if (res.data.status === 200) {
                showSuccess('Crops added successfully.');
                setSelectedCropsToAdd([]);
                await fetchAssignedCrops();
            } else {
                showError(res.data.message || 'Failed to add crops.');
            }
        } catch (err: any) {
            console.error('[EditShopOwner] Error adding crops:', err);
            showError(err.response?.data?.message || 'Error adding crops.');
        } finally {
            setLoadingCrops(false);
        }
    };

    const toggleCropSelection = (cropId: string) => {
        setSelectedCropsToAdd((prev) =>
            prev.includes(cropId) ? prev.filter((id) => id !== cropId) : [...prev, cropId]
        );
    };

    const availableCrops = useMemo(
        () => allCrops.filter((crop: any) => !assignedCrops.some((ac: any) => ac._id === crop._id)),
        [allCrops, assignedCrops]
    );

    const filteredAvailableCrops = useMemo(() => {
        const q = cropSearchQuery.trim().toLowerCase();
        const typeFilter = cropTypeFilter.trim();
        return availableCrops.filter((crop: any) => {
            const type = normalizeCropType(crop.cropType);
            if (typeFilter && type !== typeFilter) return false;
            if (q && !crop.cropName?.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [availableCrops, cropSearchQuery, cropTypeFilter]);

    // ---- Shared style tokens (primary/green — matches the header/footer) ----
    const cardWrapClass = 'border border-primary-200 dark:border-primary-800 rounded-2xl p-5 sm:p-6 bg-white dark:bg-gray-900/60';
    const btnPrimary = 'btn rounded-xl !bg-primary !border-primary !text-white hover:!bg-primary/90 dark:!bg-primary dark:!border-primary dark:!text-white dark:hover:!bg-primary/90';
    const btnOutlinePrimary = 'btn rounded-xl !border-primary !text-primary hover:!bg-primary/90 hover:!text-white dark:!border-primary-light dark:!text-primary-light dark:hover:!bg-primary-light dark:hover:!text-white';
    const btnOutlineSecondary = 'btn rounded-xl !border-primary-200 !text-gray-600 hover:!bg-primary-50 hover:!text-gray-900 dark:!border-primary-800 dark:!text-gray-300 dark:hover:!bg-white/5';
    const inputFocus = 'focus:!border-primary dark:focus:!border-primary-light';

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <span className="animate-[spin_2s_linear_infinite] border-4 border-[#f1f2f3] border-l-primary dark:border-l-primary-light rounded-full w-12 h-12 inline-block" />
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-primary-200 dark:border-primary-800 bg-white dark:bg-gray-900/85 p-5 sm:p-6 relative overflow-hidden shadow-sm">
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-light to-primary" />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h5 className="font-bold text-lg text-gray-900 dark:text-white truncate">Edit Shop Owner</h5>
                <Link to="/shopowner" className={`${btnOutlineSecondary} btn-sm shrink-0`}>
                    Back to List
                </Link>
            </div>

            <ul className="flex font-semibold gap-1 border-b border-primary-200 dark:border-primary-800 mb-5 overflow-x-auto">
                <li>
                    <button
                        type="button"
                        onClick={() => setActiveTab('user')}
                        className={`p-4 border-b-2 whitespace-nowrap transition-colors hover:text-primary dark:hover:text-primary-light ${activeTab === 'user' ? 'border-primary text-primary dark:border-primary-light dark:text-primary-light' : 'border-transparent text-gray-600 dark:text-gray-400'}`}
                    >
                        <span className="flex items-center gap-2">
                            <IconHome className="w-5 h-5 shrink-0" />
                            User Details
                        </span>
                    </button>
                </li>
                <li>
                    <button
                        type="button"
                        onClick={() => setActiveTab('shop')}
                        className={`p-4 border-b-2 whitespace-nowrap transition-colors hover:text-primary dark:hover:text-primary-light ${activeTab === 'shop' ? 'border-primary text-primary dark:border-primary-light dark:text-primary-light' : 'border-transparent text-gray-600 dark:text-gray-400'}`}
                    >
                        <span className="flex items-center gap-2">
                            <IconMenuShop className="w-5 h-5 shrink-0" />
                            Shop Details
                        </span>
                    </button>
                </li>
                <li>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('subscription');
                            if (!activeSubscription) fetchActiveSubscription();
                        }}
                        className={`p-4 border-b-2 whitespace-nowrap transition-colors hover:text-primary dark:hover:text-primary-light ${activeTab === 'subscription' ? 'border-primary text-primary dark:border-primary-light dark:text-primary-light' : 'border-transparent text-gray-600 dark:text-gray-400'}`}
                    >
                        <span className="flex items-center gap-2">
                            <IconUser className="w-5 h-5 shrink-0" />
                            Subscription
                        </span>
                    </button>
                </li>
                <li>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('crops');
                            if (activeSubscription && assignedCrops.length === 0) fetchAssignedCrops();
                        }}
                        className={`p-4 border-b-2 whitespace-nowrap transition-colors hover:text-primary dark:hover:text-primary-light ${activeTab === 'crops' ? 'border-primary text-primary dark:border-primary-light dark:text-primary-light' : 'border-transparent text-gray-600 dark:text-gray-400'}`}
                    >
                        <span className="flex items-center gap-2">
                            <IconPhone className="w-5 h-5 shrink-0" />
                            Crops
                        </span>
                    </button>
                </li>
            </ul>

            {activeTab === 'user' && (
                <div className={cardWrapClass}>
                    <h6 className="text-lg font-bold mb-5 text-gray-900 dark:text-white">General Information</h6>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="w-full sm:w-32 shrink-0 mx-auto sm:mx-0">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 text-center sm:text-left">Profile Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleUserChange}
                                name="userProfileImage"
                                className="hidden"
                                id="userProfileInput"
                            />
                            <label htmlFor="userProfileInput" className="cursor-pointer block text-center">
                                <img
                                    src={userProfilePreview || 'https://static-00.iconduck.com/assets.00/user-2-account-icon-1024x1022-juiy5a5b.png'}
                                    alt="Profile"
                                    className="w-24 h-24 mx-auto rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                                />
                                <span className="text-xs text-primary dark:text-primary-light mt-1 block">Change photo</span>
                            </label>
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">First Name</label>
                                <input
                                    name="userNameF"
                                    value={userForm.userNameF}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userNameF ? 'border-danger' : ''}`}
                                    placeholder="First Name"
                                />
                                {userErrors.userNameF && <p className="text-danger text-xs mt-1">{userErrors.userNameF}</p>}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Last Name</label>
                                <input
                                    name="userNameL"
                                    value={userForm.userNameL}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userNameL ? 'border-danger' : ''}`}
                                    placeholder="Last Name"
                                />
                                {userErrors.userNameL && <p className="text-danger text-xs mt-1">{userErrors.userNameL}</p>}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
                                <input
                                    name="userEmail"
                                    type="email"
                                    value={userForm.userEmail}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userEmail ? 'border-danger' : ''}`}
                                    placeholder="email@example.com"
                                />
                                {userErrors.userEmail && <p className="text-danger text-xs mt-1">{userErrors.userEmail}</p>}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
                                <input
                                    name="userPhone"
                                    value={userForm.userPhone}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userPhone ? 'border-danger' : ''}`}
                                    placeholder="3000000000"
                                />
                                {userErrors.userPhone && <p className="text-danger text-xs mt-1">{userErrors.userPhone}</p>}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">CNIC</label>
                                <input
                                    name="userCNIC"
                                    value={userForm.userCNIC}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userCNIC ? 'border-danger' : ''}`}
                                    placeholder="353200000000"
                                />
                                {userErrors.userCNIC && <p className="text-danger text-xs mt-1">{userErrors.userCNIC}</p>}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Status</label>
                                {canChangeStatus ? (
                                    <select
                                        name="userStatus"
                                        value={userForm.userStatus}
                                        onChange={handleUserChange}
                                        className={`form-select w-full ${inputFocus}`}
                                    >
                                        <option value="1">Active</option>
                                        <option value="0">Blocked</option>
                                        <option value="2">Deleted</option>
                                    </select>
                                ) : (
                                    <div className="form-input bg-primary-50 dark:bg-white/5 cursor-not-allowed">
                                        {userForm.userStatus === '1' ? 'Active' : userForm.userStatus === '0' ? 'Blocked' : 'Deleted'}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Province</label>
                                <input
                                    name="userProvince"
                                    value={userForm.userProvince}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userProvince ? 'border-danger' : ''}`}
                                    placeholder="Province"
                                />
                                {userErrors.userProvince && <p className="text-danger text-xs mt-1">{userErrors.userProvince}</p>}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">City</label>
                                <input
                                    name="userCity"
                                    value={userForm.userCity}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userCity ? 'border-danger' : ''}`}
                                    placeholder="City"
                                />
                                {userErrors.userCity && <p className="text-danger text-xs mt-1">{userErrors.userCity}</p>}
                            </div>
                            <div className="sm:col-span-2 min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Address</label>
                                <input
                                    name="userAdress"
                                    value={userForm.userAdress}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userAdress ? 'border-danger' : ''}`}
                                    placeholder="Full address"
                                />
                                {userErrors.userAdress && <p className="text-danger text-xs mt-1">{userErrors.userAdress}</p>}
                            </div>
                            <div className="sm:col-span-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={saveUser}
                                    disabled={savingUser}
                                    className={btnPrimary}
                                >
                                    {savingUser ? 'Saving...' : 'Save User Details'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'shop' && (
                <div className={cardWrapClass}>
                    <h6 className="text-lg font-bold mb-5 text-gray-900 dark:text-white">Shop Information</h6>
                    {!hasShop ? (
                        <p className="text-gray-500 dark:text-gray-400">No shop linked to this user. Shop is created during initial registration.</p>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="w-full sm:w-32 shrink-0 mx-auto sm:mx-0">
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 text-center sm:text-left">Shop Bill / Logo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleShopChange}
                                        name="shopBillImageTop"
                                        className="hidden"
                                        id="shopImageInput"
                                    />
                                    <label htmlFor="shopImageInput" className="cursor-pointer block text-center">
                                        <img
                                            src={shopImagePreview || 'https://cdn.iconscout.com/icon/free/png-256/free-logo-icon-download-in-svg-png-gif-file-formats--emblem-label-round-arrows-elements-pack-sign-symbols-icons-2882300.png'}
                                            alt="Shop"
                                            className="w-24 h-24 mx-auto rounded-lg object-cover border-2 border-primary-200 dark:border-primary-800"
                                        />
                                        <span className="text-xs text-primary dark:text-primary-light mt-1 block">Change image</span>
                                    </label>
                                </div>
                                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Shop Name</label>
                                        <input
                                            name="shopName"
                                            value={shopForm.shopName}
                                            onChange={handleShopChange}
                                            className={`form-input w-full ${inputFocus} ${shopErrors.shopName ? 'border-danger' : ''}`}
                                            placeholder="Shop Name"
                                        />
                                        {shopErrors.shopName && <p className="text-danger text-xs mt-1">{shopErrors.shopName}</p>}
                                    </div>
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Registration (License) No.</label>
                                        <input
                                            name="shopRegistrationNumber"
                                            value={shopForm.shopRegistrationNumber}
                                            onChange={handleShopChange}
                                            className={`form-input w-full ${inputFocus} ${shopErrors.shopRegistrationNumber ? 'border-danger' : ''}`}
                                            placeholder="0000000"
                                        />
                                        {shopErrors.shopRegistrationNumber && <p className="text-danger text-xs mt-1">{shopErrors.shopRegistrationNumber}</p>}
                                    </div>
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
                                        <input
                                            name="shopNumber"
                                            value={shopForm.shopNumber}
                                            onChange={handleShopChange}
                                            className={`form-input w-full ${inputFocus} ${shopErrors.shopNumber ? 'border-danger' : ''}`}
                                            placeholder="3000000000"
                                        />
                                        {shopErrors.shopNumber && <p className="text-danger text-xs mt-1">{shopErrors.shopNumber}</p>}
                                    </div>
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Province</label>
                                        <input
                                            name="shopProvince"
                                            value={shopForm.shopProvince}
                                            onChange={handleShopChange}
                                            className={`form-input w-full ${inputFocus} ${shopErrors.shopProvince ? 'border-danger' : ''}`}
                                            placeholder="Province"
                                        />
                                        {shopErrors.shopProvince && <p className="text-danger text-xs mt-1">{shopErrors.shopProvince}</p>}
                                    </div>
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">City</label>
                                        <input
                                            name="shopCity"
                                            value={shopForm.shopCity}
                                            onChange={handleShopChange}
                                            className={`form-input w-full ${inputFocus} ${shopErrors.shopCity ? 'border-danger' : ''}`}
                                            placeholder="City"
                                        />
                                        {shopErrors.shopCity && <p className="text-danger text-xs mt-1">{shopErrors.shopCity}</p>}
                                    </div>
                                    <div className="sm:col-span-2 min-w-0">
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Address</label>
                                        <input
                                            name="shopAddress"
                                            value={shopForm.shopAddress}
                                            onChange={handleShopChange}
                                            className={`form-input w-full ${inputFocus} ${shopErrors.shopAddress ? 'border-danger' : ''}`}
                                            placeholder="Shop address"
                                        />
                                        {shopErrors.shopAddress && <p className="text-danger text-xs mt-1">{shopErrors.shopAddress}</p>}
                                    </div>
                                    <div className="sm:col-span-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveShop}
                                            disabled={savingShop}
                                            className={btnPrimary}
                                        >
                                            {savingShop ? 'Saving...' : 'Save Shop Details'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'subscription' && (
                <div className={cardWrapClass}>
                    <h6 className="text-lg font-bold mb-5 text-gray-900 dark:text-white">Subscription Management</h6>
                    {loadingSubscription ? (
                        <div className="flex justify-center py-8">
                            <span className="animate-[spin_2s_linear_infinite] border-4 border-[#f1f2f3] border-l-primary dark:border-l-primary-light rounded-full w-8 h-8 inline-block" />
                        </div>
                    ) : activeSubscription ? (
                        <div className="mb-6 p-4 border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-white/[0.03] rounded-2xl">
                            <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Current Subscription</h4>
                                {(activeSubscription.status === 'expired' || activeSubscription.isExpired) && (
                                    <button
                                        type="button"
                                        onClick={openRenewPaymentModal}
                                        disabled={loadingSubscription}
                                        className="btn btn-success btn-sm rounded-xl"
                                    >
                                        {loadingSubscription ? 'Renewing...' : 'Renew & Activate'}
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700 dark:text-gray-300">
                                <p className="break-words"><strong>Plan:</strong> {activeSubscription.subId?.subName || activeSubscription.subNameHistory || 'N/A'}</p>
                                <p className="break-words"><strong>Price:</strong> {activeSubscription.subId?.subPrice || activeSubscription.subPriceHistory || 'N/A'} PKR</p>
                                <p className="break-words"><strong>Crop Limit:</strong> {activeSubscription.subId?.subCrop || 'N/A'}</p>
                                <p><strong>Status:</strong> 
                                    <span className={`badge ml-2 ${activeSubscription.status === 'active' && !activeSubscription.isExpired ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                        {activeSubscription.status === 'active' && !activeSubscription.isExpired ? 'Active' : 'Expired'}
                                    </span>
                                </p>
                                <p><strong>Start Date:</strong> {activeSubscription.startDate ? new Date(activeSubscription.startDate).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>Expire Date:</strong> {activeSubscription.expireDate ? new Date(activeSubscription.expireDate).toLocaleDateString() : 'N/A'}</p>
                                {activeSubscription.timeDuration && <p><strong>Duration:</strong> {activeSubscription.timeDuration} months</p>}
                            </div>
                            {(activeSubscription.status === 'expired' || activeSubscription.isExpired) && (
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        <strong>⚠️ Subscription Expired:</strong> This subscription has expired. Click "Renew & Activate" to reactivate it.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No subscription found for this user.</p>
                    )}
                    <div className="mt-6">
                        <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Change Subscription</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subscriptions.map((sub: any) => (
                                <div key={sub._id} className="flex flex-col min-w-0 border border-primary-200 dark:border-primary-800 rounded-2xl p-4 bg-white dark:bg-gray-900/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <h5 className="font-semibold text-gray-900 dark:text-white truncate" title={sub.subName}>{sub.subName}</h5>
                                        <span className="shrink-0 whitespace-nowrap inline-flex items-center rounded-lg bg-primary-light dark:bg-primary/20 px-2.5 py-1 text-sm font-bold text-primary dark:text-primary-light">
                                            {sub.subPrice} PKR
                                        </span>
                                    </div>
                                    <div className="text-sm mb-3 text-gray-600 dark:text-gray-400 line-clamp-3" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sub.subDescription || '') }} />
                                    <p className="text-sm mb-2 text-gray-600 dark:text-gray-400">Crops: {sub.subCrop}</p>
                                    {sub.timeDuration && <p className="text-sm mb-3 text-gray-600 dark:text-gray-400">Duration: {sub.timeDuration} months</p>}
                                    <button
                                        type="button"
                                        onClick={() => changeSubscription(sub._id, sub.timeDuration || 1)}
                                        disabled={loadingSubscription || (activeSubscription?.subId?._id === sub._id || activeSubscription?.subId === sub._id)}
                                        className={`${btnOutlinePrimary} w-full btn-sm mt-auto`}
                                    >
                                        {loadingSubscription ? 'Processing...' : (activeSubscription?.subId?._id === sub._id || activeSubscription?.subId === sub._id) ? 'Current Plan' : 'Select Plan'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'crops' && (
                <div className={cardWrapClass}>
                    <h6 className="text-lg font-bold mb-5 text-gray-900 dark:text-white">Crops Management</h6>
                    {!activeSubscription ? (
                        <div className="mb-4">
                            <p className="text-gray-500 dark:text-gray-400 mb-2">No subscription found. Please activate a subscription first to manage crops.</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('subscription');
                                    fetchActiveSubscription();
                                }}
                                className={`${btnPrimary} btn-sm`}
                            >
                                Go to Subscription Tab
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Currently Assigned Crops ({assignedCrops.length})</h4>
                                {loadingCrops ? (
                                    <div className="flex justify-center py-4">
                                        <span className="animate-[spin_2s_linear_infinite] border-4 border-[#f1f2f3] border-l-primary dark:border-l-primary-light rounded-full w-8 h-8 inline-block" />
                                    </div>
                                ) : assignedCrops.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {assignedCrops.map((crop: any) => (
                                            <div key={crop._id} className="min-w-0 border border-primary-200 dark:border-primary-800 rounded-2xl p-3 text-center relative bg-white dark:bg-gray-900/40">
                                                <img
                                                    src={`${ServerSetting.serUrl}/crop/${crop.cropImage}`}
                                                    alt={crop.cropName}
                                                    className="w-full h-24 object-contain mb-2"
                                                />
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{crop.cropName}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => removeCrops([crop._id])}
                                                    disabled={loadingCrops}
                                                    className="btn btn-outline-danger btn-sm rounded-xl mt-2 w-full"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">No crops assigned yet.</p>
                                )}
                            </div>
                            <div className="mt-6">
                                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Add New Crops</h4>
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <div className="flex-1 min-w-[200px] relative">
                                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Search crops by name..."
                                            value={cropSearchQuery}
                                            onChange={(e) => setCropSearchQuery(e.target.value)}
                                            className={`form-input pl-10 w-full ${inputFocus}`}
                                        />
                                    </div>
                                    <div className="w-full sm:w-auto sm:min-w-[180px]">
                                        <select
                                            value={cropTypeFilter}
                                            onChange={(e) => setCropTypeFilter(e.target.value)}
                                            className={`form-select w-full ${inputFocus}`}
                                        >
                                            {CROP_TYPE_OPTIONS.map((opt) => (
                                                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{filteredAvailableCrops.length} of {availableCrops.length} available</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {filteredAvailableCrops.map((crop: any) => (
                                            <div
                                                key={crop._id}
                                                onClick={() => toggleCropSelection(crop._id)}
                                                className={`min-w-0 border rounded-2xl p-3 text-center cursor-pointer transition-all duration-200 bg-white dark:bg-gray-900/40 ${
                                                    selectedCropsToAdd.includes(crop._id)
                                                        ? 'border-primary dark:border-primary-light shadow-lg scale-105'
                                                        : 'border-primary-200 dark:border-primary-800'
                                                }`}
                                            >
                                                <img
                                                    src={`${ServerSetting.serUrl}/crop/${crop.cropImage}`}
                                                    alt={crop.cropName}
                                                    className="w-full h-24 object-contain mb-2"
                                                />
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{crop.cropName}</p>
                                                {selectedCropsToAdd.includes(crop._id) && (
                                                    <span className="badge badge-success mt-1">Selected</span>
                                                )}
                                            </div>
                                    ))}
                                </div>
                                {selectedCropsToAdd.length > 0 && (
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={addCrops}
                                            disabled={loadingCrops}
                                            className={btnPrimary}
                                        >
                                            {loadingCrops ? 'Adding...' : `Add ${selectedCropsToAdd.length} Crop(s)`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Payment details popup for Renew / Subscribe */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-primary-200 dark:border-primary-800 shadow-xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
                        <h5 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            {paymentModalType === 'renew' ? 'Renew Subscription – Payment Details' : 'New Subscription – Payment Details'}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Payment method, remarks aur transaction ID enter karein. Ye history mein record hoga.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="form-label text-gray-700 dark:text-gray-300">Payment Method</label>
                                <select
                                    className={`form-select w-full ${inputFocus}`}
                                    value={paymentForm.paymentMethod}
                                    onChange={e => setPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))}
                                >
                                    <option value="bank">Bank</option>
                                    <option value="cash">Cash</option>
                                    <option value="mobile_wallet">Mobile Wallet</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label text-gray-700 dark:text-gray-300">Remarks</label>
                                <input
                                    type="text"
                                    className={`form-input w-full ${inputFocus}`}
                                    placeholder="Remarks (optional)"
                                    value={paymentForm.remarks}
                                    onChange={e => setPaymentForm(f => ({ ...f, remarks: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="form-label text-gray-700 dark:text-gray-300">Transaction ID</label>
                                <input
                                    type="text"
                                    className={`form-input w-full ${inputFocus}`}
                                    placeholder="Transaction ID (optional)"
                                    value={paymentForm.transactionId}
                                    onChange={e => setPaymentForm(f => ({ ...f, transactionId: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-6 justify-end">
                            <button type="button" className={`${btnOutlineSecondary} flex-1 sm:flex-none`} onClick={() => { setShowPaymentModal(false); setPendingSubscribe(null); }}>
                                Cancel
                            </button>
                            <button type="button" className={`${btnPrimary} flex-1 sm:flex-none`} onClick={handlePaymentModalConfirm}>
                                {paymentModalType === 'renew' ? 'Renew & Save' : 'Subscribe & Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditShopOwner;
