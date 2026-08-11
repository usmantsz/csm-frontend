import { Link } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconHome from '../../components/Icon/IconHome';
import IconMenuShop from '../../components/Icon/Menu/IconMenuShop';
// import IconMenuShop from '.../Components/Icon/Menu/IconMenuShop';
import IconUser from '../../components/Icon/IconUser';
import IconPhone from '../../components/Icon/IconPhone';
import DOMPurify from "dompurify";
import axios from 'axios';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { Notification } from './../../helperComponents/Notification';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import IconSearch from '../../components/Icon/IconSearch';
import IconEye from '../../components/Icon/IconEye';
import { CROP_TYPE_OPTIONS, normalizeCropType } from '../../constants/cropTypes';

const CreateUserShopOwner = () => {
    const { t } = useTranslation();
    const initialData = {
        userNameF: '',
        userNameL: '',
        userPhone: '',
        userEmail: '',
        userCNIC: '',
        userProvince: '',
        userCity: '',
        userAdress: '',
        userStatus: '1',
        userRole: '1',
        userDocStatus: '0',
        userProfileImage: '',
        userPassword: '',
    };
    const initialErrors = {
        userNameF: '',
        userNameL: '',
        userPhone: '',
        userEmail: '',
        userCNIC: '',
        userProvince: '',
        userCity: '',
        userAdress: '',
        userProfileImage: '',
        userPassword: '',
    };

    const initailShopDataError = {
        shopName: '',
        shopNumber: '',
        shopAddress: '',
        shopProvince: '',
        shopRegistrationNumber: '',
        shopCity: ''
    }
    const initailShopData = {
        shopName: '',
        shopUserId: '67912a8f1ff66cbcbc814f2f',
        shopNumber: '',
        shopAddress: '',
        shopProvince: '',
        shopRegistrationNumber: '',
        shopBillImageTop: '',
        shopCity: ''
    }
    const { token } = useAuthToken();
    const navigate = useNavigate();
    const [subcriptionSubcribe, setSubscriptionSubcribe] = useState({ userId: '', subId: '', months: '' })
    const [subscriptions, setSubscriptions] = useState([]);

    const [formData, setFormData] = useState(initialData);
    const [formDataShop, setFormDataShop] = useState(initailShopData);
    const [errors, setErrors] = useState(initialErrors);
    const [errorsShop, setErrorsShop] = useState(initailShopDataError);
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Create New Shop Owner'));
    }, [dispatch]);
    const [tabs, setTabs] = useState<string>('home');
    const toggleTabs = (name: string) => {
        setTabs(name);
    };
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [image, setImage] = useState([])
    const [upload, setUpload] = useState(false)
    const [perImage, setPerImage] = useState('')
    const [perImageShop, setPerImageShop] = useState('')
    // const [formData, setFormData] = useState(initialData);
    // const [errors, setErrors] = useState(initail);
    function uploadFile() {
        setIsLoading(true)



    }

    useEffect(() => {
        // API call to fetch subscription data
        axios
            .get(`${ServerSetting.serUrl}/api/viewsub`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((response) => {
                if (response.data.status === 200) {
                    setSubscriptions(response.data.data); // Set the subscription data
                }
            })
            .catch((error) => {
                console.error("Error fetching subscription data:", error);
            });
    }, []);
    const MAX_PROFILE_IMAGE_MB = 5;
    const handelImage = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > MAX_PROFILE_IMAGE_MB * 1024 * 1024) {
                Notification({ text: `Profile image must be under ${MAX_PROFILE_IMAGE_MB}MB.`, color: 'danger' });
                e.target.value = '';
                return;
            }
            setFormData((prev) => ({
                ...prev,
                userProfileImage: file,
            }));
            setPerImage(URL.createObjectURL(file))
            setErrors((prev: any) => ({ ...prev, userProfileImage: false }));
        }
    };

    const handelImageShop = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            setFormDataShop((prev) => ({
                ...prev,
                shopBillImageTop: file,
            }));
            setPerImageShop(URL.createObjectURL(file))
            setErrorsShop((prev: any) => ({ ...prev, shopBillImageTop: false }));
        }
    };
    // const [errors, setErrors] = useState({});

    const handleChange = (e: any) => {
        const { name, value } = e.target;

        // Update form data
        setFormData({ ...formData, [name]: value });

        // Clear the error for the specific field if it has a valid value
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: value.trim() ? "" : "This field is required",
        }));
    };


    const handleChangeShop = (e: any) => {
        const { name, value, type, files } = e.target;

        // Handle file input
        if (type === "file") {
            setFormDataShop({ ...formDataShop, [name]: files[0] });
        } else {
            // Update text or other inputs
            setFormDataShop({ ...formDataShop, [name]: value });

            // Clear the error for the specific field if it has a valid value
            setErrorsShop((prevErrors) => ({
                ...prevErrors,
                [name]: value.trim() ? "" : "This field is required",
            }));
        }
    };


    const handleSubmitShop = async () => {
        // Clone initial error object to avoid mutating state directly
        const newErrors = { ...initailShopDataError };

        // Manually check each field
        if (!formDataShop.shopName.trim()) {
            newErrors.shopName = "This field is required";
        }
        if (!formDataShop.shopNumber.trim()) {
            newErrors.shopNumber = "This field is required";
        }
        if (!formDataShop.shopProvince.trim()) {
            newErrors.shopProvince = "This field is required";
        }
        if (!formDataShop.shopCity.trim()) {
            newErrors.shopCity = "This field is required";
        }
        if (!formDataShop.shopRegistrationNumber.trim()) {
            newErrors.shopRegistrationNumber = "This field is required";
        }
        if (!formDataShop.shopAddress.trim()) {
            newErrors.shopAddress = "This field is required";
        }

        // Update the errors state
        setErrorsShop(newErrors);

        // Check if there are any errors
        const hasErrors = Object.values(newErrors).some((error) => error !== "");

        if (!hasErrors) {
            // Prepare FormData for API submission
            const dataToSendShop = new FormData();
            dataToSendShop.append("shopName", formDataShop.shopName);
            dataToSendShop.append("shopUserId", formDataShop.shopUserId);
            dataToSendShop.append("shopNumber", formDataShop.shopNumber);

            // Add the file only if it exists
            if (formDataShop.shopBillImageTop) {
                dataToSendShop.append("shopBillImageTop", formDataShop.shopBillImageTop);
            }

            dataToSendShop.append("shopRegistrationNumber", formDataShop.shopRegistrationNumber);
            dataToSendShop.append("shopAddress", formDataShop.shopAddress);
            dataToSendShop.append("shopCity", formDataShop.shopCity);
            dataToSendShop.append("shopProvince", formDataShop.shopProvince);

            // API call with Axios
            try {
                const response = await axios.post(`${ServerSetting.serUrl}/api/addshop`, dataToSendShop, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (response && response.data) {
                    Notification({
                        text: response.data.message || "Shop added successfully!",
                        color: 'success',
                    });
                    console.log("Form submitted successfully:", response.data);
                    toggleTabs('subcription')
                } else {
                    console.error("Unexpected response format:", response);
                }
            } catch (error: any) {
                Notification({
                    text: error.response.data.message || "Error",
                    color: 'danger',
                });
                // console.error("Error submitting form:", error.message);
            }
        } else {
            console.log("Form submission failed with errors:", newErrors);
        }
    };




    // shopDeatilsSubmit
    const handleSubmit = async () => {
        const newErrors = initialErrors;

        // Manually check each field
        if (!formData.userNameF.trim()) {
            newErrors.userNameF = "This field is required";
        }

        if (!formData.userNameL.trim()) {
            newErrors.userNameL = "This field is required";
        }

        if (!formData.userPhone.trim()) {
            newErrors.userPhone = "This field is required";
        }

        if (!formData.userEmail.trim()) {
            newErrors.userEmail = "This field is required";
        }

        if (!formData.userCNIC.trim()) {
            newErrors.userCNIC = "This field is required";
        }

        if (!formData.userProvince.trim()) {
            newErrors.userProvince = "This field is required";
        }

        if (!formData.userCity.trim()) {
            newErrors.userCity = "This field is required";
        }

        if (!formData.userAdress.trim()) {
            newErrors.userAdress = "This field is required";
        }

        // Password: min 6 chars, at least one uppercase, one lowercase, one number (matches backend)
        const pwd = (formData.userPassword || '').trim();
        if (!pwd) {
            newErrors.userPassword = "Password is required";
        } else if (pwd.length < 6) {
            newErrors.userPassword = "Password must be at least 6 characters";
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(pwd)) {
            newErrors.userPassword = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
        }

        setErrors(newErrors);

        // Check if there are any errors
        const hasErrors = Object.values(newErrors).some((error) => error !== "");

        if (!hasErrors) {
            // Prepare FormData for API submission
            const dataToSend = new FormData();
            Object.keys(formData).forEach((key) => {
                const k = key as keyof typeof formData;
                if (k === "userProfileImage") {
                    if (formData[k]) {
                        dataToSend.append(key, formData[k] as string | Blob);
                    }
                } else {
                    dataToSend.append(key, String(formData[k] ?? ''));
                }
            });

            // API call with Axios
            try {
                const response = await axios.post(`${ServerSetting.serUrl}/api/signup`, dataToSend, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const ok = response.status === 200 || response.status === 201;
                const userId = response.data?.data?.userId ?? response.data?.userId;
                if (ok && userId) {
                    Notification({ text: response.data?.message || 'User registered successfully.', color: 'success' });
                    docUpload(userId);
                    setFormDataShop({ ...formDataShop, 'shopUserId': userId });
                    setSubscriptionSubcribe({ ...subcriptionSubcribe, 'userId': userId });
                } else if (!ok && response.data?.message) {
                    Notification({ text: response.data.message, color: 'danger' });
                } else if (!userId) {
                    Notification({ text: response.data?.message || 'Registration failed. No user ID returned.', color: 'danger' });
                }
            } catch (error: any) {
                console.error("Error submitting form:", error);
                const res = error?.response?.data;
                if (res?.errors && Array.isArray(res.errors)) {
                    const apiErrors = { ...initialErrors };
                    res.errors.forEach((e: { path?: string; msg?: string }) => {
                        if (e.path && e.path in apiErrors) (apiErrors as any)[e.path] = e.msg || '';
                    });
                    setErrors(apiErrors);
                } else if (res?.message) {
                    Notification({ text: res.message, color: 'danger' });
                }
            }
        } else {
            console.log("Form submission failed with errors:", newErrors);
        }
    };

    const [images, setImages] = useState<any>([]);
    const [images2, setImages2] = useState<any>([]);
    const maxNumber = 69;

    const onChangeImageFront = (imageLists: ImageListType, addUpdateIndex: number[] | undefined) => {
        // console.log(imageLists[0].file)
        setImages(imageLists as never[]);
    };
    const onChangeImageBack = (imageList: ImageListType, addUpdateIndex: number[] | undefined) => {
        setImages2(imageList as never[]);
    };

    const [cropData, setCropData] = useState<any[]>([]); // State to store crop data
    const [selectedCards, setSelectedCards] = useState<string[]>([]); // State to track selected cards
    const [cropSearchQuery, setCropSearchQuery] = useState('');
    const [cropTypeFilter, setCropTypeFilter] = useState('');

    // Fetch data from the API
    useEffect(() => {
        const fetchCropData = async () => {
            try {
                const response = await axios.get(`${ServerSetting.serUrl}/api/allviewcrop`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (response.status === 200) {
                    setCropData(response.data.data); // Update crop data
                }
            } catch (error) {
                console.error("Error fetching crop data:", error);
            }
        };

        fetchCropData();
    }, []);

    const filteredCrops = useMemo(() => {
        const q = cropSearchQuery.trim().toLowerCase();
        const typeFilter = cropTypeFilter.trim();
        return cropData.filter((crop: any) => {
            const type = normalizeCropType(crop.cropType);
            if (typeFilter && type !== typeFilter) return false;
            if (q && !crop.cropName?.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [cropData, cropSearchQuery, cropTypeFilter]);

    // Toggle card selection
    const toggleSelection = (id: string) => {
        if (selectedCards.includes(id)) {
            // If already selected, remove it
            setSelectedCards(selectedCards.filter((cardId) => cardId !== id));
        } else {
            // Otherwise, add it
            setSelectedCards([...selectedCards, id]);
        }
        // console.log(selectedCards)
    };



    const docUpload = async (userId: string) => {
        const formDataApi = new FormData();
        formDataApi.append("imageFront", images[0].file);
        formDataApi.append("ImageBack", images2[0].file);
        formDataApi.append("userId", userId); // Add the file object

        try {
            const response = await axios.post(`${ServerSetting.serUrl}/api/uploaddocimage`, formDataApi, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            Notification({ text: response.data.message, color: 'success' });
            toggleTabs('shop-details');
            // console.log("Form submitted successfully:", response.data);
        } catch (err: unknown) {
            console.error("Error submitting form:", err);
        }
    };

    const selectSubcription = async (subId: string, duration: number) => {

        setSubscriptionSubcribe({ ...subcriptionSubcribe, 'subId': subId })
        try {
            const response = await axios.post(`${ServerSetting.serUrl}/api/subscribe`, {
                'subId': subId, 'months': duration, 'userId': subcriptionSubcribe.userId
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            Notification({ text: response.data.message, color: 'success' });
            toggleTabs('cropselect');
            // console.log("Form submitted successfully:", response.data);
        } catch (err: unknown) {
            console.error("Error submitting form:", err);
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Something went wrong.";
            Notification({ text: message, color: 'danger' });
        }

    }

    const handleSubmitCrop = async () => {
        try {
            const response = await axios.post(`${ServerSetting.serUrl}/api/assigncrop`, {
                'subId': subcriptionSubcribe.subId, 'cropIds': selectedCards, 'userId': subcriptionSubcribe.userId
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            Notification({ text: response.data.message, color: 'success' });
            navigate('/shopowner');
        } catch (err: unknown) {
            console.error("Error submitting form:", err);
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Something went wrong.";
            Notification({ text: message, color: 'danger' });
        }
    }

    const stepIndex = ['home', 'shop-details', 'subcription', 'cropselect'].indexOf(tabs);

    // Fixed-size wrapper for step icons — forces a consistent, non-distorted
    // render regardless of each Icon component's internal viewBox/size.
    const IconWrap = ({ children }: { children: React.ReactNode }) => (
        <span className="cs-step-icon">{children}</span>
    );

    return (
        <div className="space-y-6">
            <style>{`
                .cs-step-icon {
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: 18px !important;
                    height: 18px !important;
                    min-width: 18px !important;
                    flex-shrink: 0 !important;
                    line-height: 0 !important;
                }
                .cs-step-icon svg {
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 18px !important;
                    max-height: 18px !important;
                    display: block !important;
                    margin: 0 !important;
                    flex-shrink: 0 !important;
                }
            `}</style>
            {/* Step indicator */}
            <div className="rounded-2xl border border-white-light bg-white dark:bg-[#0b1526]/60 dark:border-white/10 p-6 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('complete_all_steps')}</p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    {[
                        { id: 'home', label: t('step_user_details'), icon: IconHome },
                        { id: 'shop-details', label: t('step_shop_details'), icon: IconMenuShop },
                        { id: 'subcription', label: t('step_subscription'), icon: IconUser },
                        { id: 'cropselect', label: t('step_assign_crops'), icon: IconPhone },
                    ].map((step, idx) => (
                        <button
                            key={step.id}
                            type="button"
                            onClick={() => toggleTabs(step.id)}
                            className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${tabs === step.id
                                ? '!bg-[#16a34a] text-white shadow-md shadow-green-600/30'
                                : idx < stepIndex
                                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/30'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                                }`}
                        >
                            <IconWrap><step.icon className="w-full h-full" /></IconWrap>
                            <span className="truncate">{step.label}</span>
                        </button>
                    ))}
                </div>
            </div>
                {tabs === 'home' ? (
                    <div className="rounded-2xl border border-white-light bg-white dark:bg-[#0b1526]/60 dark:border-white/10 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                <IconUser className="w-5 h-5 text-primary shrink-0" />
                                {t('user_general_info')}
                            </h2>
                            <div className="flex flex-col lg:flex-row gap-8">
                                <div className="shrink-0 flex flex-col items-center mx-auto lg:mx-0">
                                    <input
                                        type="file"
                                        onChange={(e) => handelImage(e)}
                                        accept="image/*"
                                        className="hidden"
                                        id="profileFileInput"
                                    />
                                    <label htmlFor="profileFileInput" className="cursor-pointer block">
                                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary-200 dark:border-primary-700 bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:border-primary transition-colors duration-200">
                                            {perImage ? (
                                                <img
                                                    src={perImage}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <IconUser className="w-14 h-14 text-primary" />
                                            )}
                                        </div>
                                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">{t('click_to_change_photo')}</p>
                                    </label>
                                </div>
                                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="min-w-0">
                                        <label htmlFor="userNameF" className="form-label">{t('form_first_name')} <span className="text-danger">*</span></label>
                                        <input
                                            id="userNameF"
                                            name="userNameF"
                                            type="text"
                                            placeholder={t('form_placeholder_first_name')}
                                            className={`form-input w-full ${errors.userNameF ? "border-red-500" : ""}`}
                                            value={formData.userNameF}
                                            onChange={handleChange}
                                        />
                                        {errors.userNameF && (
                                            <span className="text-red-500 text-sm">{errors.userNameF}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <label htmlFor="userNameL" className="form-label">{t('form_last_name')} <span className="text-danger">*</span></label>
                                        <input
                                            id="userNameL"
                                            name="userNameL"
                                            type="text"
                                            placeholder={t('form_placeholder_last_name')}
                                            className={`form-input w-full ${errors.userNameL ? "border-red-500" : ""}`}
                                            value={formData.userNameL}
                                            onChange={handleChange}
                                        />
                                        {errors.userNameL && (
                                            <span className="text-red-500 text-sm">{errors.userNameL}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <label htmlFor="userEmail" className="form-label">{t('form_email')} <span className="text-danger">*</span></label>
                                        <input
                                            id="userEmail"
                                            name="userEmail"
                                            type="email"
                                            placeholder={t('form_placeholder_email')}
                                            className={`form-input w-full ${errors.userEmail ? "border-red-500" : ""}`}
                                            value={formData.userEmail}
                                            onChange={handleChange}
                                        />
                                        {errors.userEmail && (
                                            <span className="text-red-500 text-sm">{errors.userEmail}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <label htmlFor="userPhone" className="form-label">{t('form_phone')} <span className="text-danger">*</span></label>
                                        <input
                                            id="userPhone"
                                            name="userPhone"
                                            type="text"
                                            placeholder={t('form_placeholder_phone')}
                                            className={`form-input w-full ${errors.userPhone ? "border-red-500" : ""}`}
                                            value={formData.userPhone}
                                            onChange={handleChange}
                                        />
                                        {errors.userPhone && (
                                            <span className="text-red-500 text-sm">{errors.userPhone}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <label htmlFor="userCNIC" className="form-label">{t('form_cnic')} <span className="text-danger">*</span></label>
                                        <input
                                            id="userCNIC"
                                            name="userCNIC"
                                            type="number"
                                            placeholder="353200000000"
                                            className={`form-input w-full ${errors.userCNIC ? "border-red-500" : ""}`}
                                            value={formData.userCNIC}
                                            onChange={handleChange}
                                        />
                                        {errors.userCNIC && (
                                            <span className="text-red-500 text-sm">{errors.userCNIC}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <label htmlFor="userProvince" className="form-label">{t('province')} <span className="text-danger">*</span></label>
                                        <input
                                            id="userProvince"
                                            name="userProvince"
                                            type="text"
                                            placeholder={t('form_placeholder_province')}
                                            className={`form-input w-full ${errors.userProvince ? "border-red-500" : ""}`}
                                            value={formData.userProvince}
                                            onChange={handleChange}
                                        />
                                        {errors.userProvince && (
                                            <span className="text-red-500 text-sm">{errors.userProvince}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <label htmlFor="userCity" className="form-label">{t('city')} <span className="text-danger">*</span></label>
                                        <input
                                            id="userCity"
                                            name="userCity"
                                            type="text"
                                            placeholder={t('form_placeholder_city')}
                                            className={`form-input w-full ${errors.userCity ? "border-red-500" : ""}`}
                                            value={formData.userCity}
                                            onChange={handleChange}
                                        />
                                        {errors.userCity && (
                                            <span className="text-red-500 text-sm">{errors.userCity}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <label htmlFor="userPassword" className="form-label">{t('form_password')} <span className="text-danger">*</span></label>
                                        <div className="relative">
                                            <input
                                                id="userPassword"
                                                name="userPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder={t('form_enter_password')}
                                                className={`form-input w-full pr-10 ${errors.userPassword ? "border-red-500" : ""}`}
                                                value={formData.userPassword}
                                                onChange={handleChange}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors duration-200"
                                                title={showPassword ? t('hide_password') : t('show_password')}
                                                aria-label={showPassword ? t('hide_password') : t('show_password')}
                                            >
                                                <IconEye className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {t('form_password_hint_strong')}
                                        </p>
                                        {errors.userPassword && (
                                            <span className="text-red-500 text-sm">{errors.userPassword}</span>
                                        )}
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor="userAdress" className="form-label">{t('form_address')} <span className="text-danger">*</span></label>
                                        <textarea
                                            id="userAdress"
                                            name="userAdress"
                                            rows={3}
                                            placeholder={t('form_placeholder_address_full')}
                                            className={`form-input w-full min-h-[80px] resize-y ${errors.userAdress ? "border-red-500" : ""}`}
                                            value={formData.userAdress}
                                            onChange={handleChange}
                                        />
                                        {errors.userAdress && (
                                            <span className="text-red-500 text-sm">{errors.userAdress}</span>
                                        )}
                                    </div>
                                    <div className="sm:col-span-2">
                                        <p className="form-label mb-2">{t('form_cnic_document')}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 p-4 bg-gray-50/50 dark:bg-white/5 transition-colors duration-200 hover:border-primary/50">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('form_front_cnic')}</p>
                                                <ImageUploading value={images} onChange={onChangeImageFront} maxNumber={1}>
                                                    {({ imageList, onImageUpload }) => (
                                                        <div>
                                                            <button type="button" className="btn btn-outline-primary btn-sm w-full" onClick={onImageUpload}>
                                                                {imageList.length ? t('btn_change_front_cnic') : t('btn_choose_front_cnic')}
                                                            </button>
                                                            {imageList.map((image, index) => (
                                                                <div key={index} className="mt-2 rounded-lg overflow-hidden border border-white-light dark:border-white/10">
                                                                    <img src={image.dataURL} alt="Front CNIC" className="w-full h-auto max-h-32 object-contain" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </ImageUploading>
                                            </div>
                                            <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 p-4 bg-gray-50/50 dark:bg-white/5 transition-colors duration-200 hover:border-primary/50">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('form_back_cnic')}</p>
                                                <ImageUploading value={images2} onChange={onChangeImageBack} maxNumber={1}>
                                                    {({ imageList, onImageUpload }) => (
                                                        <div>
                                                            <button type="button" className="btn btn-outline-primary btn-sm w-full" onClick={onImageUpload}>
                                                                {imageList.length ? t('btn_change_back_cnic') : t('btn_choose_back_cnic')}
                                                            </button>
                                                            {imageList.map((image, index) => (
                                                                <div key={index} className="mt-2 rounded-lg overflow-hidden border border-white-light dark:border-white/10">
                                                                    <img src={image.dataURL} alt="Back CNIC" className="w-full h-auto max-h-32 object-contain" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </ImageUploading>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2 mt-2 flex justify-end">
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 !bg-[#16a34a] hover:!bg-[#15803d]"
                                            onClick={handleSubmit}
                                        >
                                            Save &amp; Next →
                                        </button>
                                    </div>

                                </div>
                            </div>
                    </div>
                ) : (
                    ''
                )}
                {tabs === 'shop-details' ? (
                    <div className="rounded-2xl border border-white-light bg-white dark:bg-[#0b1526]/60 dark:border-white/10 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                <IconMenuShop className="w-5 h-5 text-primary shrink-0" />
                                Shop Information
                            </h2>
                            <div className="flex flex-col lg:flex-row gap-8">
                                <div className="shrink-0 flex flex-col items-center mx-auto lg:mx-0">
                                    <input
                                        type="file"
                                        onChange={(e) => handelImageShop(e)}
                                        accept="image/*"
                                        className="hidden"
                                        id="shopFileInput"
                                    />
                                    <label htmlFor="shopFileInput" className="cursor-pointer block">
                                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary-200 dark:border-primary-700 bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:border-primary transition-colors duration-200">
                                            <img
                                                src={perImageShop || "https://cdn.iconscout.com/icon/free/png-256/free-logo-icon-download-in-svg-png-gif-file-formats--emblem-label-round-arrows-elements-pack-sign-symbols-icons-2882300.png"}
                                                alt="Shop"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">Shop logo / bill image</p>
                                    </label>
                                </div>
                                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="min-w-0">
                                        <label htmlFor="shopName" className="form-label">Shop Name <span className="text-danger">*</span></label>
                                        <input
                                            id="shopName"
                                            name="shopName"
                                            type="text"
                                            placeholder="Jimmy Turner"
                                            className={`form-input w-full ${errorsShop.shopName ? "border-red-500" : ""}`}
                                            value={formDataShop.shopName}
                                            onChange={handleChangeShop}
                                        />
                                        {errorsShop.shopName && (
                                            <span className="text-red-500 text-sm">{errorsShop.shopName}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <label htmlFor="shopRegistrationNumber" className="form-label">License / Registration <span className="text-danger">*</span></label>
                                        <input
                                            id="shopRegistrationNumber"
                                            name="shopRegistrationNumber"
                                            type="number"
                                            placeholder="0000000"
                                            className={`form-input w-full ${errorsShop.shopRegistrationNumber ? "border-red-500" : ""}`}
                                            value={formDataShop.shopRegistrationNumber}
                                            onChange={handleChangeShop}
                                        />
                                        {errorsShop.shopRegistrationNumber && (
                                            <span className="text-red-500 text-sm">{errorsShop.shopRegistrationNumber}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <label htmlFor="shopNumber" className="form-label">Phone <span className="text-danger">*</span></label>
                                        <input
                                            id="shopNumber"
                                            name="shopNumber"
                                            type="text"
                                            placeholder="3000000000"
                                            className={`form-input w-full ${errorsShop.shopNumber ? "border-red-500" : ""}`}
                                            value={formDataShop.shopNumber}
                                            onChange={handleChangeShop}
                                        />
                                        {errorsShop.shopNumber && (
                                            <span className="text-red-500 text-sm">{errorsShop.shopNumber}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <label htmlFor="shopProvince" className="form-label">Province <span className="text-danger">*</span></label>
                                        <input
                                            id="shopProvince"
                                            name="shopProvince"
                                            type="text"
                                            placeholder="Province"
                                            className={`form-input w-full ${errorsShop.shopProvince ? "border-red-500" : ""}`}
                                            value={formDataShop.shopProvince}
                                            onChange={handleChangeShop}
                                        />
                                        {errorsShop.shopProvince && (
                                            <span className="text-red-500 text-sm">{errorsShop.shopProvince}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <label htmlFor="shopCity" className="form-label">City <span className="text-danger">*</span></label>
                                        <input
                                            id="shopCity"
                                            name="shopCity"
                                            type="text"
                                            placeholder="City"
                                            className={`form-input w-full ${errorsShop.shopCity ? "border-red-500" : ""}`}
                                            value={formDataShop.shopCity}
                                            onChange={handleChangeShop}
                                        />
                                        {errorsShop.shopCity && (
                                            <span className="text-red-500 text-sm">{errorsShop.shopCity}</span>
                                        )}
                                    </div>
                                    <div className="sm:col-span-2 min-w-0">
                                        <label htmlFor="shopAddress" className="form-label">Address <span className="text-danger">*</span></label>
                                        <input
                                            id="shopAddress"
                                            name="shopAddress"
                                            type="text"
                                            placeholder="New York"
                                            className={`form-input w-full ${errorsShop.shopAddress ? "border-red-500" : ""}`}
                                            value={formDataShop.shopAddress}
                                            onChange={handleChangeShop}
                                        />
                                        {errorsShop.shopAddress && (
                                            <span className="text-red-500 text-sm">{errorsShop.shopAddress}</span>
                                        )}
                                    </div>



                                    <div className="sm:col-span-2 mt-2 flex justify-end">
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 !bg-[#16a34a] hover:!bg-[#15803d]"
                                            onClick={handleSubmitShop}
                                        >
                                            Save Shop Details &amp; Next →
                                        </button>
                                    </div>

                                </div>
                            </div>
                    </div>
                ) : (
                    ''
                )}
                {tabs === 'subcription' ? (
                    <div className="rounded-2xl border border-white-light bg-white dark:bg-[#0b1526]/60 dark:border-white/10 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                                <IconUser className="w-5 h-5 text-primary shrink-0" />
                                Choose a Subscription Plan
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">Select a plan for this shop owner. Price, crop limit, and duration are shown below.</p>
                            {subscriptions.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {subscriptions.map((sub: any) => (
                                        <div
                                            key={sub._id}
                                            className="flex flex-col h-full min-w-0 rounded-2xl border border-white-light dark:border-white/10 bg-white dark:bg-[#0b1526]/40 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40"
                                        >
                                            <div className="p-5 flex-1">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate" title={sub.subName}>{sub.subName}</h3>
                                                    <span className="shrink-0 whitespace-nowrap inline-flex items-center rounded-xl bg-primary/10 dark:bg-primary/20 px-3 py-1.5 text-sm font-bold text-primary">
                                                        {sub.subPrice} PKR
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sub.subDescription || '') }} />
                                            </div>
                                            <div className="px-5 py-3 border-t border-white-light dark:border-white/10">
                                                <ul className="space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    <li>Crops allowed: {sub.subCrop}</li>
                                                    {sub.timeDuration && <li>Duration: {sub.timeDuration} months</li>}
                                                </ul>
                                            </div>
                                            <div className="p-5 pt-3">
                                                <button
                                                    type="button"
                                                    className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-colors !bg-[#16a34a] hover:!bg-[#15803d]"
                                                    onClick={() => selectSubcription(sub._id, sub.timeDuration)}
                                                >
                                                    Select Plan
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 rounded-xl bg-gray-50 dark:bg-white/5">
                                    <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">No subscription plans found.</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{t('add_plans_from_subscriptions')}</p>
                                </div>
                            )}
                    </div>
                ) : (
                    ''
                )}
                {tabs === 'cropselect' ? (
                    <div className="rounded-2xl border border-white-light bg-white dark:bg-[#0b1526]/60 dark:border-white/10 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                                <IconPhone className="w-5 h-5 text-primary shrink-0" />
                                Assign Crops to Shop Owner
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">Click on crops to select. Selected crops will be assigned to this shop owner.</p>
                            {cropData.length > 0 ? (
                                <>
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        <div className="flex-1 min-w-[200px] relative">
                                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="Search crops by name..."
                                                value={cropSearchQuery}
                                                onChange={(e) => setCropSearchQuery(e.target.value)}
                                                className="form-input pl-10 w-full"
                                            />
                                        </div>
                                        <div className="w-full sm:w-auto sm:min-w-[180px]">
                                            <select
                                                value={cropTypeFilter}
                                                onChange={(e) => setCropTypeFilter(e.target.value)}
                                                className="form-select w-full"
                                            >
                                                {CROP_TYPE_OPTIONS.map((opt) => (
                                                    <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{filteredCrops.length} of {cropData.length} crop{cropData.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {filteredCrops.map((crop: any) => {
                                            const isSelected = selectedCards.includes(crop._id);
                                            const cropImg = crop.cropImage ? `${ServerSetting.serUrl}/crop/${crop.cropImage}` : '';
                                            return (
                                                <button
                                                    key={crop._id}
                                                    type="button"
                                                    onClick={() => toggleSelection(crop._id)}
                                                    className={`rounded-2xl border-2 p-4 text-center flex flex-col items-center gap-3 min-w-0 transition-all duration-200 cursor-pointer hover:shadow-md bg-white dark:bg-[#0b1526]/40 ${isSelected
                                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md ring-2 ring-primary/30'
                                                        : 'border-white-light dark:border-white/10 hover:border-primary/40'
                                                        }`}
                                                >
                                                    <div className="w-full aspect-[4/3] rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                                                        {cropImg ? (
                                                            <img src={cropImg} alt={crop.cropName} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <span className="text-4xl opacity-50">🌾</span>
                                                        )}
                                                    </div>
                                                    <span className="font-semibold text-gray-800 dark:text-white text-sm line-clamp-2">{crop.cropName}</span>
                                                    {isSelected && <span className="inline-flex items-center rounded-lg bg-primary px-2 py-0.5 text-xs font-semibold text-white">Selected</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {selectedCards.length} crop(s) selected
                                        </p>
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 !bg-[#16a34a] hover:!bg-[#15803d]"
                                            onClick={handleSubmitCrop}
                                        >
                                            Save &amp; Finish →
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 rounded-xl bg-gray-50 dark:bg-white/5">
                                    <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">No crops found.</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{t('add_crops_from_crops')}</p>
                                </div>
                            )}
                    </div>
                ) : (
                    ''
                )}
        </div>
    );
};

export default CreateUserShopOwner;