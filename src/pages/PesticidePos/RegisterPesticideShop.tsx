import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { useAuthToken } from '../../Hooks/useAuthToken';
import IconUser from '../../components/Icon/IconUser';
import IconMenuShop from '../../components/Icon/Menu/IconMenuShop';
import IconMenuInvoice from '../../components/Icon/Menu/IconMenuInvoice';

// Layout stays the newer card-per-section design; colors follow the
// original template palette (primary/gray/warning) instead of hardcoded hex.
const card =
    'rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-gray-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:shadow-none dark:ring-0';
const sectionHeading = 'text-lg font-semibold text-gray-900 dark:text-white';

const initialOwner = {
    userNameF: '',
    userNameL: '',
    userPhone: '',
    userEmail: '',
    userCNIC: '',
    userProvince: '',
    userCity: '',
    userAdress: '',
    userPassword: '123456',
};
const initialShop = {
    shopName: '',
    shopRegistrationNumber: '',
    shopPhone: '',
    shopAddress: '',
    shopProvince: '',
    shopCity: '',
    shopLogo: '',
};

const RegisterPesticideShop = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const [owner, setOwner] = useState(initialOwner);
    const [shop, setShop] = useState(initialShop);
    const [posSubscriptionId, setPosSubscriptionId] = useState('');
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingSubs, setLoadingSubs] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle(t('register_pesticide_shop_page')));
    }, [dispatch, t]);

    useEffect(() => {
        if (!token) return;
        axios
            .get(`${ServerSetting.apiUrl}/pesticide-pos/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => {
                if (r.data?.status === 200 && Array.isArray(r.data.data)) setSubscriptions(r.data.data);
            })
            .catch(() => Notification({ text: 'Failed to load subscriptions', color: 'danger' }))
            .finally(() => setLoadingSubs(false));
    }, [token]);

    const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOwner((p) => ({ ...p, [e.target.name]: e.target.value }));
    };
    const handleShopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShop((p) => ({ ...p, [e.target.name]: e.target.value }));
    };

    const validate = () => {
        if (!owner.userNameF?.trim()) {
            Notification({ text: 'Owner first name required', color: 'warning' });
            return false;
        }
        if (!owner.userEmail?.trim()) {
            Notification({ text: 'Owner email required', color: 'warning' });
            return false;
        }
        if (!owner.userPhone?.trim()) {
            Notification({ text: 'Owner phone required', color: 'warning' });
            return false;
        }
        if (!shop.shopName?.trim()) {
            Notification({ text: 'Shop name required', color: 'warning' });
            return false;
        }
        if (!shop.shopRegistrationNumber?.trim()) {
            Notification({ text: 'Shop registration number required', color: 'warning' });
            return false;
        }
        if (!shop.shopPhone?.trim()) {
            Notification({ text: 'Shop phone required', color: 'warning' });
            return false;
        }
        if (!shop.shopAddress?.trim()) {
            Notification({ text: 'Shop address required', color: 'warning' });
            return false;
        }
        if (!posSubscriptionId) {
            Notification({ text: 'Please assign a POS subscription', color: 'warning' });
            return false;
        }
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate() || !token) return;
        setLoading(true);
        axios
            .post(
                `${ServerSetting.apiUrl}/pesticide-pos/register`,
                { owner, shop, posSubscriptionId },
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
            )
            .then((r) => {
                if (r.data?.status === 201) {
                    Notification({ text: r.data.message || 'Pesticide shop registered successfully', color: 'success' });
                    setOwner(initialOwner);
                    setShop(initialShop);
                    setPosSubscriptionId('');
                    navigate('/pesticide-pos/shops');
                } else {
                    Notification({ text: r.data?.message || 'Failed', color: 'danger' });
                }
            })
            .catch((err) => Notification({ text: err.response?.data?.message || 'Failed to register', color: 'danger' }))
            .finally(() => setLoading(false));
    };

    return (
        <div className="space-y-6">
            <ul className="flex items-center gap-2 text-sm">
                <li>
                    <Link to="/dashboard" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link to="/pesticide-pos/shops" className="text-primary hover:underline">Pesticide POS</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-500 dark:text-gray-400">
                    <span>Register Pesticide Shop</span>
                </li>
            </ul>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className={card}>
                    <div className="mb-6 flex items-center gap-3">
                        <span className={iconBadge}>
                            <IconUser className="w-5 h-5" />
                        </span>
                        <h5 className={sectionHeading}>{t('section_owner_details')}</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="form-label">{t('form_first_name')} <span className="text-danger">*</span></label>
                            <input type="text" name="userNameF" className="form-input" value={owner.userNameF} onChange={handleOwnerChange} required />
                        </div>
                        <div>
                            <label className="form-label">{t('form_last_name')}</label>
                            <input type="text" name="userNameL" className="form-input" value={owner.userNameL} onChange={handleOwnerChange} />
                        </div>
                        <div>
                            <label className="form-label">{t('form_email')} <span className="text-danger">*</span></label>
                            <input type="email" name="userEmail" className="form-input" value={owner.userEmail} onChange={handleOwnerChange} required />
                        </div>
                        <div>
                            <label className="form-label">{t('form_phone')} <span className="text-danger">*</span></label>
                            <input type="text" name="userPhone" className="form-input" value={owner.userPhone} onChange={handleOwnerChange} required />
                        </div>
                        <div>
                            <label className="form-label">{t('form_cnic')}</label>
                            <input type="text" name="userCNIC" className="form-input" value={owner.userCNIC} onChange={handleOwnerChange} />
                        </div>
                        <div>
                            <label className="form-label">{t('form_password_default')}</label>
                            <input type="text" name="userPassword" className="form-input" value={owner.userPassword} onChange={handleOwnerChange} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">{t('form_address')}</label>
                            <input type="text" name="userAdress" className="form-input" value={owner.userAdress} onChange={handleOwnerChange} />
                        </div>
                        <div>
                            <label className="form-label">{t('province')}</label>
                            <input type="text" name="userProvince" className="form-input" value={owner.userProvince} onChange={handleOwnerChange} />
                        </div>
                        <div>
                            <label className="form-label">{t('city')}</label>
                            <input type="text" name="userCity" className="form-input" value={owner.userCity} onChange={handleOwnerChange} />
                        </div>
                    </div>
                </div>

                <div className={card}>
                    <div className="mb-6 flex items-center gap-3">
                        <span className={iconBadge}>
                            <IconMenuShop className="w-5 h-5" />
                        </span>
                        <h5 className={sectionHeading}>{t('section_shop_details')}</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="form-label">{t('form_shop_name')} <span className="text-danger">*</span></label>
                            <input type="text" name="shopName" className="form-input" value={shop.shopName} onChange={handleShopChange} required />
                        </div>
                        <div>
                            <label className="form-label">{t('form_registration_number')} <span className="text-danger">*</span></label>
                            <input type="text" name="shopRegistrationNumber" className="form-input" value={shop.shopRegistrationNumber} onChange={handleShopChange} required />
                        </div>
                        <div>
                            <label className="form-label">{t('form_shop_phone')} <span className="text-danger">*</span></label>
                            <input type="text" name="shopPhone" className="form-input" value={shop.shopPhone} onChange={handleShopChange} required />
                        </div>
                        <div>
                            <label className="form-label">{t('form_logo_url')}</label>
                            <input type="text" name="shopLogo" className="form-input" value={shop.shopLogo} onChange={handleShopChange} placeholder={t('form_optional')} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">{t('form_address')} <span className="text-danger">*</span></label>
                            <input type="text" name="shopAddress" className="form-input" value={shop.shopAddress} onChange={handleShopChange} required />
                        </div>
                        <div>
                            <label className="form-label">{t('province')}</label>
                            <input type="text" name="shopProvince" className="form-input" value={shop.shopProvince} onChange={handleShopChange} />
                        </div>
                        <div>
                            <label className="form-label">{t('city')}</label>
                            <input type="text" name="shopCity" className="form-input" value={shop.shopCity} onChange={handleShopChange} />
                        </div>
                    </div>
                </div>

                <div className={card}>
                    <div className="mb-6 flex items-center gap-3">
                        <span className={iconBadge}>
                            <IconMenuInvoice className="w-5 h-5" />
                        </span>
                        <h5 className={sectionHeading}>{t('section_assign_pos_subscription')}</h5>
                    </div>
                    <div className="max-w-md">
                        <label className="form-label">{t('form_pos_subscription')} <span className="text-danger">*</span></label>
                        <select
                            className="form-select"
                            value={posSubscriptionId}
                            onChange={(e) => setPosSubscriptionId(e.target.value)}
                            required
                        >
                            <option value="">{t('form_select_subscription')}</option>
                            {loadingSubs ? (
                                <option disabled>{t('loading')}</option>
                            ) : (
                                subscriptions.map((s) => (
                                    <option key={s._id} value={s._id}>
                                        {s.name} — Rs.{s.price} / {s.durationDays} days
                                    </option>
                                ))
                            )}
                        </select>
                        {subscriptions.length === 0 && !loadingSubs && (
                            <p className="mt-2 text-sm text-warning">
                                {t('no_subscriptions_yet')}{' '}
                                <Link to="/pesticide-pos/subscriptions" className="underline">{t('add_one')}</Link> {t('first')}.
                            </p>
                        )}
                    </div>
                </div>

                <div className={`${card} flex flex-wrap items-center gap-3`}>
                    <button type="submit" className="btn btn-primary rounded-2xl px-5 py-2.5 !bg-[#16a34a] !text-white !border-[#16a34a] hover:!bg-[#15803d]" disabled={loading}>
    {loading ? t('form_registering') : t('btn_register_pesticide_shop')}
</button>
                    <Link to="/pesticide-pos/shops" className="btn btn-outline-secondary rounded-2xl px-5 py-2.5">
                        {t('cancel')}
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default RegisterPesticideShop;