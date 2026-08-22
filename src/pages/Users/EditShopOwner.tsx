import { useEffect, useState, useMemo, useRef, FC } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
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
import IconArrowRight from '../../components/Icon/IconArrowRight';

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

/* =========================================================
   Reusable Image Crop Modal (no external library required)
   - Drag to reposition
   - Slider to zoom IN and OUT (minimize)
   - Outputs a square-cropped JPEG Blob
   ========================================================= */

const CROP_SIZE = 280;   // px, size of the crop viewport shown to the user
const OUTPUT_SIZE = 500; // px, size of the final cropped image
const MIN_ZOOM = 0.5;    // allows shrinking the image below "cover" fit
const MAX_ZOOM = 3;

interface ImageCropModalProps {
    imageSrc: string;
    round?: boolean;
    title?: string;
    onCancel: () => void;
    onConfirm: (blob: Blob) => void;
}

const ImageCropModal: FC<ImageCropModalProps> = ({ imageSrc, round = false, title, onCancel, onConfirm }) => {
    const { t } = useTranslation();
    const imgRef = useRef<HTMLImageElement>(null);
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

    // baseScale = the scale at which the image fully COVERS the crop viewport (zoom = 1 reference point)
    const baseScale = useMemo(() => {
        if (!naturalSize.width || !naturalSize.height) return 1;
        return Math.max(CROP_SIZE / naturalSize.width, CROP_SIZE / naturalSize.height);
    }, [naturalSize]);

    const scale = baseScale * zoom;

    // Clamps drag position. When the image is LARGER than the viewport it behaves as before
    // (can't reveal empty edges). When the image is SMALLER than the viewport (minimized/zoomed out),
    // it gets centered instead of being pinned to a corner.
    const clampPosition = (pos: { x: number; y: number }, currentScale: number) => {
        const displayedWidth = naturalSize.width * currentScale;
        const displayedHeight = naturalSize.height * currentScale;

        let x: number;
        if (displayedWidth <= CROP_SIZE) {
            x = (CROP_SIZE - displayedWidth) / 2;
        } else {
            const minX = CROP_SIZE - displayedWidth;
            x = Math.min(0, Math.max(pos.x, minX));
        }

        let y: number;
        if (displayedHeight <= CROP_SIZE) {
            y = (CROP_SIZE - displayedHeight) / 2;
        } else {
            const minY = CROP_SIZE - displayedHeight;
            y = Math.min(0, Math.max(pos.y, minY));
        }

        return { x, y };
    };

    const onImgLoad = () => {
        if (!imgRef.current) return;
        const { naturalWidth, naturalHeight } = imgRef.current;
        setNaturalSize({ width: naturalWidth, height: naturalHeight });
        const initialScale = Math.max(CROP_SIZE / naturalWidth, CROP_SIZE / naturalHeight);
        const displayedWidth = naturalWidth * initialScale;
        const displayedHeight = naturalHeight * initialScale;
        setPosition({
            x: (CROP_SIZE - displayedWidth) / 2,
            y: (CROP_SIZE - displayedHeight) / 2,
        });
        setZoom(1);
    };

    const startDrag = (clientX: number, clientY: number) => {
        setIsDragging(true);
        dragRef.current = { startX: clientX, startY: clientY, startPosX: position.x, startPosY: position.y };
    };

    const moveDrag = (clientX: number, clientY: number) => {
        if (!isDragging) return;
        const dx = clientX - dragRef.current.startX;
        const dy = clientY - dragRef.current.startY;
        setPosition(clampPosition({ x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy }, scale));
    };

    const endDrag = () => setIsDragging(false);

    const handleZoomChange = (newZoom: number) => {
        setZoom(newZoom);
        setPosition((prev) => clampPosition(prev, baseScale * newZoom));
    };

    const handleConfirm = () => {
        if (!naturalSize.width || !naturalSize.height || !imgRef.current) return;

        // Source rectangle (in ORIGINAL image pixel coordinates) that corresponds to the crop viewport
        const cropX = -position.x / scale;
        const cropY = -position.y / scale;
        const cropSizeOnImage = CROP_SIZE / scale;

        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill background first (matters when image is minimized and doesn't cover the whole crop area)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        // Clip the source rect against the actual image bounds so we never pass
        // negative/oversized values into drawImage (which breaks on some browsers).
        const sxClipped = Math.max(cropX, 0);
        const syClipped = Math.max(cropY, 0);
        const sxEnd = Math.min(cropX + cropSizeOnImage, naturalSize.width);
        const syEnd = Math.min(cropY + cropSizeOnImage, naturalSize.height);
        const swClipped = sxEnd - sxClipped;
        const shClipped = syEnd - syClipped;

        if (swClipped > 0 && shClipped > 0) {
            const outScale = OUTPUT_SIZE / cropSizeOnImage;
            const dx = (sxClipped - cropX) * outScale;
            const dy = (syClipped - cropY) * outScale;
            const dw = swClipped * outScale;
            const dh = shClipped * outScale;

            ctx.drawImage(
                imgRef.current,
                sxClipped, syClipped, swClipped, shClipped,
                dx, dy, dw, dh
            );
        }

        canvas.toBlob((blob) => {
            if (blob) onConfirm(blob);
        }, 'image/jpeg', 0.92);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border border-[#ebedf2] dark:border-[#191e3a] shadow-xl p-5 sm:p-6">
                <h5 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white text-center">
                    {title || t('crop_image')}
                </h5>

                <div
                    className="relative mx-auto overflow-hidden bg-gray-100 dark:bg-white/5 select-none touch-none"
                    style={{
                        width: CROP_SIZE,
                        height: CROP_SIZE,
                        borderRadius: round ? '50%' : '12px',
                        cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
                    onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                    onTouchStart={(e) => { const t0 = e.touches[0]; startDrag(t0.clientX, t0.clientY); }}
                    onTouchMove={(e) => { const t0 = e.touches[0]; moveDrag(t0.clientX, t0.clientY); }}
                    onTouchEnd={endDrag}
                >
                    <img
                        ref={imgRef}
                        src={imageSrc}
                        onLoad={onImgLoad}
                        alt="Crop preview"
                        draggable={false}
                        style={{
                            position: 'absolute',
                            left: position.x,
                            top: position.y,
                            width: naturalSize.width * scale,
                            height: naturalSize.height * scale,
                            maxWidth: 'none',
                        }}
                    />
                    {!round && <div className="pointer-events-none absolute inset-0 border-2 border-white/70 rounded-xl" />}
                </div>

                <div className="flex items-center gap-3 mt-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">−</span>
                    <input
                        type="range"
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                        className="w-full accent-green-600"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">+</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                    {t('drag_to_reposition_zoom_to_resize')}
                </p>

                <div className="flex gap-2 mt-6 justify-end">
                    <button type="button" onClick={onCancel} className="btn btn-outline-secondary rounded-xl flex-1 sm:flex-none">
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="btn shadow-none !bg-[#16a34a] !text-white !border-[#16a34a] hover:!bg-[#15803d] rounded-xl flex-1 sm:flex-none"
                    >
                        {t('save_crop')}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ========================================================= */

const EditShopOwner = () => {
    const { t } = useTranslation();
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const { userRole } = useUserPermissions();

    const canChangeStatus = canPerformRestrictedActions(userRole);

    const [loading, setLoading] = useState(true);
    const [savingUser, setSavingUser] = useState(false);
    const [savingShop, setSavingShop] = useState(false);
    const [activeTab, setActiveTab] = useState<'user' | 'shop' | 'subscription' | 'crops'>('user');

    const [activeSubscription, setActiveSubscription] = useState<any>(null);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loadingSubscription, setLoadingSubscription] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentModalType, setPaymentModalType] = useState<'renew' | 'subscribe'>('renew');
    const [paymentForm, setPaymentForm] = useState({ paymentMethod: 'bank', remarks: '', transactionId: '' });
    const [pendingSubscribe, setPendingSubscribe] = useState<{ subId: string; months: number } | null>(null);

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

    // ---- Crop modal state (shared by both profile image & shop logo) ----
    const [cropState, setCropState] = useState<{
        open: boolean;
        imageSrc: string;
        target: 'user' | 'shop';
        fileName: string;
        fileType: string;
    } | null>(null);

    useEffect(() => {
        dispatch(setPageTitle(t('edit_shop_owner')));
    }, [dispatch, t]);

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
                Notification({ text: t('user_id_missing'), color: 'danger' });
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
            if (activeSubscription) {
                fetchAssignedCrops();
            } else {
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
                Notification({ text: userRes.data.message || t('user_not_found'), color: 'danger' });
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
            Notification({ text: err.response?.data?.message || t('failed_load_data'), color: 'danger' });
            navigate('/shopowner');
        } finally {
            setLoading(false);
        }
    };

    // Text/select fields only now — file selection is routed through the crop modal handlers below
    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUserForm((prev) => ({ ...prev, [name]: value }));
        setUserErrors((prev) => ({ ...prev, [name]: value.trim() ? '' : t('field_required') }));
    };

    const handleShopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setShopForm((prev) => ({ ...prev, [name]: value }));
        setShopErrors((prev) => ({ ...prev, [name]: value.trim() ? '' : t('field_required') }));
    };

    // ---- New: file select handlers open the crop modal instead of setting the file directly ----
    const handleUserFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setCropState({
                open: true,
                imageSrc: reader.result as string,
                target: 'user',
                fileName: file.name.replace(/\.[^.]+$/, '') + '.jpg',
                fileType: 'image/jpeg',
            });
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // reset so re-selecting the same file re-triggers onChange
    };

    const handleShopFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setCropState({
                open: true,
                imageSrc: reader.result as string,
                target: 'shop',
                fileName: file.name.replace(/\.[^.]+$/, '') + '.jpg',
                fileType: 'image/jpeg',
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCropCancel = () => setCropState(null);

    const handleCropConfirm = (blob: Blob) => {
        if (!cropState) return;
        const croppedFile = new File([blob], cropState.fileName, { type: cropState.fileType });
        const previewUrl = URL.createObjectURL(blob);

        if (cropState.target === 'user') {
            setUserForm((prev) => ({ ...prev, userProfileImage: croppedFile }));
            setUserProfilePreview(previewUrl);
        } else {
            setShopForm((prev) => ({ ...prev, shopBillImageTop: croppedFile }));
            setShopImagePreview(previewUrl);
        }
        setCropState(null);
    };

    const validateUser = () => {
        const e = { ...initialUserErrors };
        if (!userForm.userNameF.trim()) e.userNameF = t('field_required');
        if (!userForm.userNameL.trim()) e.userNameL = t('field_required');
        if (!userForm.userPhone.trim()) e.userPhone = t('field_required');
        if (!userForm.userEmail.trim()) e.userEmail = t('field_required');
        if (!userForm.userCNIC.trim()) e.userCNIC = t('field_required');
        if (!userForm.userProvince.trim()) e.userProvince = t('field_required');
        if (!userForm.userCity.trim()) e.userCity = t('field_required');
        if (!userForm.userAdress.trim()) e.userAdress = t('field_required');
        setUserErrors(e);
        return !Object.values(e).some((v) => v);
    };

    const validateShop = () => {
        const e = { ...initialShopErrors };
        if (!shopForm.shopName.trim()) e.shopName = t('field_required');
        if (!shopForm.shopNumber.trim()) e.shopNumber = t('field_required');
        if (!shopForm.shopAddress.trim()) e.shopAddress = t('field_required');
        if (!shopForm.shopProvince.trim()) e.shopProvince = t('field_required');
        if (!shopForm.shopCity.trim()) e.shopCity = t('field_required');
        if (!shopForm.shopRegistrationNumber.trim()) e.shopRegistrationNumber = t('field_required');
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
                showSuccess(t('user_updated_success'));
            } else {
                showError(res.data.message || t('user_update_failed'));
            }
        } catch (err: any) {
            showError(err.response?.data?.message || t('user_update_error'));
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
                showSuccess(t('shop_updated_success'));
                fetchUserAndShop();
            } else {
                showError(res.data.message || t('shop_update_failed'));
            }
        } catch (err: any) {
            showError(err.response?.data?.message || t('shop_update_error'));
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
        if (!userId || !token) return;
        setLoadingSubscription(true);
        try {
            const res = await axios.post(`${ServerSetting.serUrl}/api/getActiveSubscription`, { userId }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.status === 200 && res.data.data) {
                setActiveSubscription(res.data.data);
            } else {
                setActiveSubscription(null);
            }
        } catch (err: any) {
            console.error('[EditShopOwner] Error fetching active subscription:', err);
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
            const subId = activeSubscription?.subId?._id || activeSubscription?.subId || null;
            const res = await axios.post(`${ServerSetting.serUrl}/api/getAssignedCrops`, {
                userId,
                ...(subId && { subId }),
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.status === 200 && res.data.data) {
                setAssignedCrops(res.data.data.cropIds || []);
            } else {
                setAssignedCrops([]);
            }
        } catch (err: any) {
            console.error('[EditShopOwner] Error fetching assigned crops:', err);
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
                showSuccess(t('subscription_added_success'));
                await fetchActiveSubscription();
                if (activeTab === 'crops') setTimeout(() => fetchAssignedCrops(), 1000);
            } else {
                showError(res.data.message || t('subscription_add_failed'));
            }
        } catch (err: any) {
            showError(err.response?.data?.message || t('subscription_add_error'));
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
            showError(t('subscription_id_not_found_renew'));
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
                showSuccess(t('subscription_renewed_success'));
                await fetchActiveSubscription();
                if (activeTab === 'crops') setTimeout(() => fetchAssignedCrops(), 1000);
            } else {
                showError(res.data.message || t('subscription_renew_failed'));
            }
        } catch (err: any) {
            showError(err.response?.data?.message || t('subscription_renew_error'));
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
            const subId = activeSubscription?.subId?._id || activeSubscription?.subId;
            if (!subId) {
                showError(t('subscription_id_not_found_crops'));
                setLoadingCrops(false);
                return;
            }
            const res = await axios.post(`${ServerSetting.serUrl}/api/removeCrops`, {
                userId,
                subId,
                cropIds: cropIdsToRemove,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.status === 200) {
                showSuccess(t('crops_removed_success'));
                await fetchAssignedCrops();
            } else {
                showError(res.data.message || t('crops_remove_failed'));
            }
        } catch (err: any) {
            console.error('[EditShopOwner] Error removing crops:', err);
            showError(err.response?.data?.message || t('crops_remove_error'));
        } finally {
            setLoadingCrops(false);
        }
    };

    const addCrops = async () => {
        if (!userId || !token || selectedCropsToAdd.length === 0) {
            Notification({ text: t('select_crops_to_add'), color: 'warning' });
            return;
        }
        const subId = activeSubscription?.subId?._id || activeSubscription?.subId;
        if (!subId) {
            showError(t('subscription_id_not_found_crops'));
            return;
        }
        setLoadingCrops(true);
        try {
            const res = await axios.post(`${ServerSetting.serUrl}/api/assigncrop`, {
                userId,
                subId,
                cropIds: selectedCropsToAdd,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.status === 200) {
                showSuccess(t('crops_added_success'));
                setSelectedCropsToAdd([]);
                await fetchAssignedCrops();
            } else {
                showError(res.data.message || t('crops_add_failed'));
            }
        } catch (err: any) {
            console.error('[EditShopOwner] Error adding crops:', err);
            showError(err.response?.data?.message || t('crops_add_error'));
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

    const btnPrimary = 'btn btn-primary rounded-xl';
    const cardWrapClass = 'border border-[#ebedf2] dark:border-[#191e3a] rounded-2xl p-5 sm:p-6 bg-white dark:bg-black shadow-md';
    const btnOutlinePrimary = 'btn btn-outline-primary rounded-xl';
    const btnOutlineSecondary = 'btn btn-outline-secondary rounded-xl';
    const btnSaveGreen = 'btn shadow-none flex items-center gap-2 !bg-[#16a34a] !text-white !border-[#16a34a] hover:!bg-[#15803d] rounded-xl';
    const inputFocus = '';

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <span className="animate-[spin_2s_linear_infinite] border-4 border-[#f1f2f3] border-l-primary dark:border-l-primary-light rounded-full w-12 h-12 inline-block" />
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-[#ebedf2] dark:border-[#191e3a] bg-white dark:bg-black p-5 sm:p-6 relative overflow-hidden shadow-sm">

            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h5 className="font-bold text-2xl text-gray-900 dark:text-white truncate">{t('edit_shop_owner')}</h5>
                <Link to="/shopowner" className={`${btnOutlineSecondary} btn-sm flex gap-1 shrink-0`}>
                    <IconArrowRight/>
                    {t('back_to_list')}
                </Link>
            </div>

            <ul className="flex font-semibold gap-1 border-b border-[#ebedf2] dark:border-[#191e3a] mb-5 overflow-x-auto">
                <li>
                    <button
                        type="button"
                        onClick={() => setActiveTab('user')}
                        className={`p-4 border-b-2 whitespace-nowrap transition-colors hover:text-primary dark:hover:text-primary-light ${activeTab === 'user' ? 'border-primary text-primary dark:border-primary-light dark:text-primary-light' : 'border-transparent text-gray-600 dark:text-gray-400'}`}
                    >
                        <span className="flex items-center gap-2">
                            <IconHome className="w-5 h-5 shrink-0" />
                            {t('user_details')}
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
                            {t('shop_details')}
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
                            {t('subscription')}
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
                            {t('crops')}
                        </span>
                    </button>
                </li>
            </ul>

            {activeTab === 'user' && (
                <div className={cardWrapClass}>
                    <h6 className="text-lg font-bold mb-5 text-gray-900 dark:text-white">{t('general_information')}</h6>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="w-full sm:w-32 shrink-0 mx-auto sm:mx-0">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 text-center sm:text-left">{t('profile_image')}</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleUserFileSelect}
                                name="userProfileImage"
                                className="hidden"
                                id="userProfileInput"
                            />
                            <label htmlFor="userProfileInput" className="cursor-pointer block text-center">
                                <img
                                    src={userProfilePreview || 'https://static-00.iconduck.com/assets.00/user-2-account-icon-1024x1022-juiy5a5b.png'}
                                    alt="Profile"
                                    className="w-24 h-24 mx-auto rounded-full object-cover border-2 border-[#ebedf2] dark:border-[#191e3a]"
                                />
                                <span className="text-xs text-primary dark:text-primary-light mt-1 block">{t('change_photo')}</span>
                            </label>
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('first_name')}</label>
                                <input
                                    name="userNameF"
                                    value={userForm.userNameF}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userNameF ? 'border-danger' : ''}`}
                                    placeholder={t('first_name')}
                                />
                                {userErrors.userNameF && <p className="text-danger text-xs mt-1">{userErrors.userNameF}</p>}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('last_name')}</label>
                                <input
                                    name="userNameL"
                                    value={userForm.userNameL}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userNameL ? 'border-danger' : ''}`}
                                    placeholder={t('last_name')}
                                />
                                {userErrors.userNameL && <p className="text-danger text-xs mt-1">{userErrors.userNameL}</p>}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('email')}</label>
                                <input
                                    name="userEmail"
                                    type="email"
                                    value={userForm.userEmail}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userEmail ? 'border-danger' : ''}`}
                                    placeholder={t('email_placeholder')}
                                />
                                {userErrors.userEmail && <p className="text-danger text-xs mt-1">{userErrors.userEmail}</p>}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('phone')}</label>
                                <input
                                    name="userPhone"
                                    value={userForm.userPhone}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userPhone ? 'border-danger' : ''}`}
                                    placeholder={t('phone_placeholder')}
                                />
                                {userErrors.userPhone && <p className="text-danger text-xs mt-1">{userErrors.userPhone}</p>}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('cnic')}</label>
                                <input
                                    name="userCNIC"
                                    value={userForm.userCNIC}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userCNIC ? 'border-danger' : ''}`}
                                    placeholder={t('cnic_placeholder')}
                                />
                                {userErrors.userCNIC && <p className="text-danger text-xs mt-1">{userErrors.userCNIC}</p>}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('status')}</label>
                                {canChangeStatus ? (
                                    <select
                                        name="userStatus"
                                        value={userForm.userStatus}
                                        onChange={handleUserChange}
                                        className={`form-select w-full ${inputFocus}`}
                                    >
                                        <option value="1">{t('active')}</option>
                                        <option value="0">{t('blocked')}</option>
                                        <option value="2">{t('deleted')}</option>
                                    </select>
                                ) : (
                                    <div className="form-input bg-gray-50 dark:bg-white/5 cursor-not-allowed">
                                        {userForm.userStatus === '1' ? t('active') : userForm.userStatus === '0' ? t('blocked') : t('deleted')}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('province')}</label>
                                <input
                                    name="userProvince"
                                    value={userForm.userProvince}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userProvince ? 'border-danger' : ''}`}
                                    placeholder={t('province')}
                                />
                                {userErrors.userProvince && <p className="text-danger text-xs mt-1">{userErrors.userProvince}</p>}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('city')}</label>
                                <input
                                    name="userCity"
                                    value={userForm.userCity}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userCity ? 'border-danger' : ''}`}
                                    placeholder={t('city')}
                                />
                                {userErrors.userCity && <p className="text-danger text-xs mt-1">{userErrors.userCity}</p>}
                            </div>
                            <div className="sm:col-span-2 min-w-0">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('address')}</label>
                                <input
                                    name="userAdress"
                                    value={userForm.userAdress}
                                    onChange={handleUserChange}
                                    className={`form-input w-full ${inputFocus} ${userErrors.userAdress ? 'border-danger' : ''}`}
                                    placeholder={t('full_address_placeholder')}
                                />
                                {userErrors.userAdress && <p className="text-danger text-xs mt-1">{userErrors.userAdress}</p>}
                            </div>
                            <div className="sm:col-span-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={saveUser}
                                    disabled={savingUser}
                                    className={btnSaveGreen}
                                >
                                    {savingUser ? t('saving') : t('save_user_details')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'shop' && (
                <div className={cardWrapClass}>
                    <h6 className="text-lg font-bold mb-5 text-gray-900 dark:text-white">{t('shop_information')}</h6>
                    {!hasShop ? (
                        <p className="text-gray-500 dark:text-gray-400">{t('no_shop_linked')}</p>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="w-full sm:w-32 shrink-0 mx-auto sm:mx-0">
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 text-center sm:text-left">{t('shop_bill_logo')}</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleShopFileSelect}
                                        name="shopBillImageTop"
                                        className="hidden"
                                        id="shopImageInput"
                                    />
                                    <label htmlFor="shopImageInput" className="cursor-pointer block text-center">
                                        <img
                                            src={shopImagePreview || 'https://cdn.iconscout.com/icon/free/png-256/free-logo-icon-download-in-svg-png-gif-file-formats--emblem-label-round-arrows-elements-pack-sign-symbols-icons-2882300.png'}
                                            alt="Shop"
                                            className="w-24 h-24 mx-auto rounded-lg object-cover border-2 border-[#ebedf2] dark:border-[#191e3a]"
                                        />
                                        <span className="text-xs text-primary dark:text-primary-light mt-1 block">{t('change_image')}</span>
                                    </label>
                                </div>
                                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('shop_name')}</label>
                                        <input
                                            name="shopName"
                                            value={shopForm.shopName}
                                            onChange={handleShopChange}
                                            className={`form-input w-full ${inputFocus} ${shopErrors.shopName ? 'border-danger' : ''}`}
                                            placeholder={t('shop_name')}
                                        />
                                        {shopErrors.shopName && <p className="text-danger text-xs mt-1">{shopErrors.shopName}</p>}
                                    </div>
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('registration_license_no')}</label>
                                        <input
                                            name="shopRegistrationNumber"
                                            value={shopForm.shopRegistrationNumber}
                                            onChange={handleShopChange}
                                            className={`form-input w-full ${inputFocus} ${shopErrors.shopRegistrationNumber ? 'border-danger' : ''}`}
                                            placeholder={t('registration_placeholder')}
                                        />
                                        {shopErrors.shopRegistrationNumber && <p className="text-danger text-xs mt-1">{shopErrors.shopRegistrationNumber}</p>}
                                    </div>
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('phone')}</label>
                                        <input
                                            name="shopNumber"
                                            value={shopForm.shopNumber}
                                            onChange={handleShopChange}
                                            className={`form-input w-full ${inputFocus} ${shopErrors.shopNumber ? 'border-danger' : ''}`}
                                            placeholder={t('phone_placeholder')}
                                        />
                                        {shopErrors.shopNumber && <p className="text-danger text-xs mt-1">{shopErrors.shopNumber}</p>}
                                    </div>
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('province')}</label>
                                        <input
                                            name="shopProvince"
                                            value={shopForm.shopProvince}
                                            onChange={handleShopChange}
                                            className={`form-input w-full ${inputFocus} ${shopErrors.shopProvince ? 'border-danger' : ''}`}
                                            placeholder={t('province')}
                                        />
                                        {shopErrors.shopProvince && <p className="text-danger text-xs mt-1">{shopErrors.shopProvince}</p>}
                                    </div>
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('city')}</label>
                                        <input
                                            name="shopCity"
                                            value={shopForm.shopCity}
                                            onChange={handleShopChange}
                                            className={`form-input w-full ${inputFocus} ${shopErrors.shopCity ? 'border-danger' : ''}`}
                                            placeholder={t('city')}
                                        />
                                        {shopErrors.shopCity && <p className="text-danger text-xs mt-1">{shopErrors.shopCity}</p>}
                                    </div>
                                    <div className="sm:col-span-2 min-w-0">
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('address')}</label>
                                        <input
                                            name="shopAddress"
                                            value={shopForm.shopAddress}
                                            onChange={handleShopChange}
                                            className={`form-input w-full ${inputFocus} ${shopErrors.shopAddress ? 'border-danger' : ''}`}
                                            placeholder={t('shop_address_placeholder')}
                                        />
                                        {shopErrors.shopAddress && <p className="text-danger text-xs mt-1">{shopErrors.shopAddress}</p>}
                                    </div>
                                    <div className="sm:col-span-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveShop}
                                            disabled={savingShop}
                                            className={btnSaveGreen}
                                        >
                                            {savingShop ? t('saving') : t('save_shop_details')}
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
                    <h6 className="text-lg font-bold mb-5 text-gray-900 dark:text-white">{t('subscription_management')}</h6>
                    {loadingSubscription ? (
                        <div className="flex justify-center py-8">
                            <span className="animate-[spin_2s_linear_infinite] border-4 border-[#f1f2f3] border-l-primary dark:border-l-primary-light rounded-full w-8 h-8 inline-block" />
                        </div>
                    ) : activeSubscription ? (
                        <div className="mb-6 p-4 border border-[#ebedf2] dark:border-[#191e3a] bg-gray-50 dark:bg-white/[0.03] rounded-2xl shadow-sm">
                            <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                                <h4 className="font-semibold text-gray-900 dark:text-white">{t('current_subscription')}</h4>
                                {(activeSubscription.status === 'expired' || activeSubscription.isExpired) && (
                                    <button
                                        type="button"
                                        onClick={openRenewPaymentModal}
                                        disabled={loadingSubscription}
                                        className="btn btn-success btn-sm rounded-xl"
                                    >
                                        {loadingSubscription ? t('renewing') : t('renew_activate')}
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700 dark:text-gray-300">
                                <p className="break-words"><strong>{t('plan')}:</strong> {activeSubscription.subId?.subName || activeSubscription.subNameHistory || t('not_available')}</p>
                                <p className="break-words"><strong>{t('price')}:</strong> {activeSubscription.subId?.subPrice || activeSubscription.subPriceHistory || t('not_available')} {t('pkr')}</p>
                                <p className="break-words"><strong>{t('crop_limit')}:</strong> {activeSubscription.subId?.subCrop || t('not_available')}</p>
                                <p><strong>{t('status')}:</strong>
                                    <span className={`badge ml-2 ${activeSubscription.status === 'active' && !activeSubscription.isExpired ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                        {activeSubscription.status === 'active' && !activeSubscription.isExpired ? t('active') : t('expired')}
                                    </span>
                                </p>
                                <p><strong>{t('start_date')}:</strong> {activeSubscription.startDate ? new Date(activeSubscription.startDate).toLocaleDateString() : t('not_available')}</p>
                                <p><strong>{t('expire_date')}:</strong> {activeSubscription.expireDate ? new Date(activeSubscription.expireDate).toLocaleDateString() : t('not_available')}</p>
                                {activeSubscription.timeDuration && <p><strong>{t('duration')}:</strong> {activeSubscription.timeDuration} {t('months')}</p>}
                            </div>
                            {(activeSubscription.status === 'expired' || activeSubscription.isExpired) && (
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        <strong>⚠️ {t('subscription_expired_title')}:</strong> {t('subscription_expired_text')}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 mb-4">{t('no_subscription_found')}</p>
                    )}
                    <div className="mt-6">
                        <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">{t('change_subscription')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subscriptions.map((sub: any) => (
                                <div key={sub._id} className="flex flex-col min-w-0 border border-[#ebedf2] dark:border-[#191e3a] rounded-2xl p-4 bg-white dark:bg-black shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <h5 className="font-semibold text-gray-900 dark:text-white truncate" title={sub.subName}>{sub.subName}</h5>
                                        <span className="shrink-0 whitespace-nowrap inline-flex items-center rounded-lg bg-primary-light dark:bg-primary/20 px-2.5 py-1 text-sm font-bold text-primary dark:text-primary-light">
                                            {sub.subPrice} {t('pkr')}
                                        </span>
                                    </div>
                                    <div className="text-sm mb-3 text-gray-600 dark:text-gray-400 line-clamp-3" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sub.subDescription || '') }} />
                                    <p className="text-sm mb-2 text-gray-600 dark:text-gray-400">{t('crops')}: {sub.subCrop}</p>
                                    {sub.timeDuration && <p className="text-sm mb-3 text-gray-600 dark:text-gray-400">{t('duration')}: {sub.timeDuration} {t('months')}</p>}
                                    <button
                                        type="button"
                                        onClick={() => changeSubscription(sub._id, sub.timeDuration || 1)}
                                        disabled={loadingSubscription || (activeSubscription?.subId?._id === sub._id || activeSubscription?.subId === sub._id)}
                                        className={`${btnOutlinePrimary} w-full btn-sm mt-auto`}
                                    >
                                        {loadingSubscription ? t('processing') : (activeSubscription?.subId?._id === sub._id || activeSubscription?.subId === sub._id) ? t('current_plan') : t('select_plan')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'crops' && (
                <div className={cardWrapClass}>
                    <h6 className="text-lg font-bold mb-5 text-gray-900 dark:text-white">{t('crops_management')}</h6>
                    {!activeSubscription ? (
                        <div className="mb-4">
                            <p className="text-gray-500 dark:text-gray-400 mb-2">{t('no_subscription_for_crops')}</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('subscription');
                                    fetchActiveSubscription();
                                }}
                                className={`${btnPrimary} btn-sm`}
                            >
                                {t('go_to_subscription_tab')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">{t('currently_assigned_crops')} ({assignedCrops.length})</h4>
                                {loadingCrops ? (
                                    <div className="flex justify-center py-4">
                                        <span className="animate-[spin_2s_linear_infinite] border-4 border-[#f1f2f3] border-l-primary dark:border-l-primary-light rounded-full w-8 h-8 inline-block" />
                                    </div>
                                ) : assignedCrops.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {assignedCrops.map((crop: any) => (
                                            <div key={crop._id} className="min-w-0 border border-[#ebedf2] dark:border-[#191e3a] rounded-2xl p-3 text-center relative bg-white dark:bg-black shadow-sm">
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
                                                    {t('remove')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">{t('no_crops_assigned')}</p>
                                )}
                            </div>
                            <div className="mt-6">
                                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">{t('add_new_crops')}</h4>
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <div className="flex-1 min-w-[200px] relative">
                                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder={t('search_crops_placeholder')}
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
                                    <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{filteredAvailableCrops.length} {t('of')} {availableCrops.length} {t('available')}</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {filteredAvailableCrops.map((crop: any) => (
                                            <div
                                                key={crop._id}
                                                onClick={() => toggleCropSelection(crop._id)}
                                                className={`min-w-0 border rounded-2xl p-3 text-center cursor-pointer transition-all duration-200 bg-white dark:bg-black ${
                                                    selectedCropsToAdd.includes(crop._id)
                                                        ? 'border-primary dark:border-primary-light shadow-lg scale-105'
                                                        : 'border-[#ebedf2] dark:border-[#191e3a] shadow-sm'
                                                }`}
                                            >
                                                <img
                                                    src={`${ServerSetting.serUrl}/crop/${crop.cropImage}`}
                                                    alt={crop.cropName}
                                                    className="w-full h-24 object-contain mb-2"
                                                />
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{crop.cropName}</p>
                                                {selectedCropsToAdd.includes(crop._id) && (
                                                    <span className="badge badge-success mt-1">{t('selected')}</span>
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
                                            {loadingCrops ? t('adding') : `${t('add_crops_button')} ${selectedCropsToAdd.length} ${t('crop_unit')}`}
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
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-[#ebedf2] dark:border-[#191e3a] shadow-xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
                        <h5 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            {paymentModalType === 'renew' ? t('renew_subscription_payment_details') : t('new_subscription_payment_details')}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {t('payment_details_instructions')}
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="form-label text-gray-700 dark:text-gray-300">{t('payment_method')}</label>
                                <select
                                    className={`form-select w-full ${inputFocus}`}
                                    value={paymentForm.paymentMethod}
                                    onChange={e => setPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))}
                                >
                                    <option value="bank">{t('bank')}</option>
                                    <option value="cash">{t('cash')}</option>
                                    <option value="mobile_wallet">{t('mobile_wallet')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label text-gray-700 dark:text-gray-300">{t('remarks')}</label>
                                <input
                                    type="text"
                                    className={`form-input w-full ${inputFocus}`}
                                    placeholder={t('remarks_placeholder')}
                                    value={paymentForm.remarks}
                                    onChange={e => setPaymentForm(f => ({ ...f, remarks: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="form-label text-gray-700 dark:text-gray-300">{t('transaction_id')}</label>
                                <input
                                    type="text"
                                    className={`form-input w-full ${inputFocus}`}
                                    placeholder={t('transaction_id_placeholder')}
                                    value={paymentForm.transactionId}
                                    onChange={e => setPaymentForm(f => ({ ...f, transactionId: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-6 justify-end">
                            <button type="button" className={`${btnOutlineSecondary} flex-1 sm:flex-none`} onClick={() => { setShowPaymentModal(false); setPendingSubscribe(null); }}>
                                {t('cancel')}
                            </button>
                            <button type="button" className={`${btnPrimary} flex-1 sm:flex-none`} onClick={handlePaymentModalConfirm}>
                                {paymentModalType === 'renew' ? t('renew_save') : t('subscribe_save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image crop modal — opens for both profile image and shop logo uploads */}
            {cropState?.open && (
                <ImageCropModal
                    imageSrc={cropState.imageSrc}
                    round={cropState.target === 'user'}
                    title={cropState.target === 'user' ? t('crop_profile_image') : t('crop_shop_logo')}
                    onCancel={handleCropCancel}
                    onConfirm={handleCropConfirm}
                />
            )}
        </div>
    );
};

export default EditShopOwner;