import { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { toggleTheme, toggleSidebar, toggleLocale, setOpenSettingPanel } from '../../store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import Dropdown from '../Dropdown';
import IconMenu from '../Icon/IconMenu';
import IconSun from '../Icon/IconSun';
import IconMoon from '../Icon/IconMoon';
import IconLaptop from '../Icon/IconLaptop';
import IconUser from '../Icon/IconUser';
import IconLogout from '../Icon/IconLogout';
import IconSettings from '../Icon/IconSettings';
import IconBellBing from '../Icon/IconBellBing';
import IconHelpCircle from '../Icon/IconHelpCircle';
import IconCreditCard from '../Icon/IconCreditCard';
import IconMenuDashboard from '../Icon/Menu/IconMenuDashboard';
import IconMenuInvoice from '../Icon/Menu/IconMenuInvoice';
import IconMenuShop from '../Icon/Menu/IconMenuShop';
import IconMenuUsers from '../Icon/Menu/IconMenuUsers';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';

type PosNotification = { _id: string; type: string; title: string; message: string; link?: string; read: boolean; createdAt: string };

const PosHeader = () => {
    const { t, i18n } = useTranslation();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isRtl = themeConfig.rtlClass === 'rtl';
    const [langFlag, setLangFlag] = useState(() =>
        typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') || themeConfig.locale || 'en' : 'en'
    );
    const [userName, setUserName] = useState('');
    const [notifications, setNotifications] = useState<PosNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifLoading, setNotifLoading] = useState(false);
    const tokenRef = useRef<string | null>(null);

    const openSettings = () => dispatch(setOpenSettingPanel(true));

    useEffect(() => {
        try {
            const raw = localStorage.getItem('userInformation');
            if (raw) {
                const parsed = JSON.parse(raw);
                const data = parsed?.data ?? parsed;
                const f = data?.userNameF ?? '';
                const l = data?.userNameL ?? '';
                setUserName(`${f} ${l}`.trim() || t('pos_user_default'));
            }
        } catch {
            setUserName(t('pos_user_default'));
        }
    }, [t]);

    useEffect(() => {
        const code = (i18n.language || 'en').split('-')[0];
        setLangFlag(code);
    }, [i18n.language]);

    const fetchNotifications = () => {
        const tok = localStorage.getItem('token');
        tokenRef.current = tok;
        if (!tok) return;
        setNotifLoading(true);
        axios
            .get(`${ServerSetting.apiUrl}/notifications`, { headers: { Authorization: `Bearer ${tok}` }, params: { limit: 15 }, validateStatus: () => true })
            .then((res) => {
                const data = res.data?.data ?? res.data;
                if (data?.notifications) {
                    setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
                    setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
                }
            })
            .catch(() => {})
            .finally(() => setNotifLoading(false));
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markNotifRead = (id: string, link?: string) => {
        const tok = localStorage.getItem('token');
        if (!tok) return;
        axios
            .patch(`${ServerSetting.apiUrl}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${tok}` }, validateStatus: () => true })
            .then(() => {
                setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
                setUnreadCount((c) => Math.max(0, c - 1));
                if (link) navigate(link.startsWith('/pos') ? link : '/pos/dashboard');
            })
            .catch(() => {});
    };

    const logout = (e: React.MouseEvent) => {
        e.preventDefault();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userInformation');
        localStorage.removeItem('userRole');
        localStorage.removeItem('token');
        localStorage.removeItem('loginSource');
        navigate('/pos-login', { replace: true });
    };

    const posHorizontalLinks = [
        { to: '/pos/dashboard', labelKey: 'pos_nav_dashboard', Icon: IconMenuDashboard },
        { to: '/pos/sale', labelKey: 'pos_nav_new_sale', Icon: IconMenuInvoice },
        { to: '/pos/products', labelKey: 'pos_nav_products', Icon: IconMenuShop },
        { to: '/pos/sales-history', labelKey: 'pos_nav_sales_history', Icon: IconMenuInvoice },
        { to: '/pos/customers', labelKey: 'pos_nav_customers', Icon: IconMenuUsers },
        { to: '/pos/pending-requests', labelKey: 'pos_nav_shop_requests', Icon: IconMenuInvoice },
        { to: '/pos/commission-shop-management', labelKey: 'pos_nav_commission_shops', Icon: IconMenuShop },
        { to: '/pos/support', labelKey: 'pos_nav_support', Icon: IconHelpCircle },
    ] as const;

    return (
        <header
            className={`z-40 sticky top-0 border-b border-white-dark/10 bg-white dark:bg-black shadow-sm ${
                themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''
            }`}
        >
            <div className="shadow-sm">
                {/* Single logo + label (one "POS" only); menu button only below lg */}
                <div className="relative flex w-full flex-nowrap items-center gap-2 bg-white px-4 py-2.5 dark:bg-black sm:px-5">
                    <div className="horizontal-logo flex shrink-0 items-center gap-2 ltr:mr-2 rtl:ml-2">
                        <Link to="/pos/dashboard" className="main-logo flex min-w-0 items-center gap-2">
                            <img
                                src="/assets/images/logo.svg"
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-lg object-contain ring-1 ring-black/5 dark:ring-white/10"
                            />
                            <span className="truncate text-lg font-bold text-primary dark:text-primary-400">POS</span>
                        </Link>
                        <button
                            type="button"
                            className="collapse-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white-light/40 p-0 hover:bg-white-light/90 dark:bg-dark/40 dark:hover:bg-dark/60 dark:text-[#d0d2d6] lg:hidden"
                            onClick={() => dispatch(toggleSidebar())}
                            aria-label={t('pos_aria_open_menu')}
                        >
                            <IconMenu className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2 ltr:ml-auto rtl:mr-auto">
                    <div className="dropdown shrink-0">
                        <Dropdown
                            offset={[0, 8]}
                            placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                            btnClassName="block p-2 rounded-lg hover:bg-white-dark/10 dark:hover:bg-white-dark/5"
                            button={
                                <img
                                    className="w-5 h-5 object-cover rounded-full"
                                    src={`/assets/images/flags/${(langFlag || 'en').toUpperCase()}.svg`}
                                    alt=""
                                    aria-label={t('pos_aria_language')}
                                />
                            }
                        >
                            <ul className="!px-1 text-dark dark:text-white-dark grid grid-cols-1 gap-1 font-semibold dark:text-white-light/90 w-[240px] py-1">
                                {themeConfig.languageList.map((item: { code: string; name: string }) => (
                                    <li key={item.code}>
                                        <button
                                            type="button"
                                            className={`flex w-full items-center hover:text-success rounded-lg px-2 py-2 ${i18n.language === item.code ? 'bg-success/10 text-success' : ''}`}
                                            onClick={() => {
                                                dispatch(toggleLocale(item.code));
                                                setLangFlag(item.code);
                                            }}
                                        >
                                            <img
                                                src={`/assets/images/flags/${item.code.toUpperCase()}.svg`}
                                                alt=""
                                                className="w-5 h-5 object-cover rounded-full shrink-0"
                                            />
                                            <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </Dropdown>
                    </div>
                    <Dropdown
                        offset={[0, 8]}
                        placement="bottom-end"
                        btnClassName="relative p-2 rounded-lg hover:bg-white-dark/10"
                        button={
                            <span className="flex items-center justify-center">
                                <IconBellBing className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-danger text-white text-xs font-bold px-1">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </span>
                        }
                    >
                        <div className="w-80 py-2">
                            <div className="px-4 py-2 border-b border-white-light dark:border-white-dark/10 font-semibold text-gray-800 dark:text-white">
                                {t('pos_header_notifications')}
                            </div>
                            {notifLoading ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">{t('pos_header_loading')}</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">{t('pos_header_no_notifications')}</div>
                            ) : (
                                <ul className="max-h-[320px] overflow-y-auto">
                                    {notifications.map((n) => (
                                        <li key={n._id}>
                                            <button
                                                type="button"
                                                onClick={() => markNotifRead(n._id, n.link)}
                                                className={`w-full text-left px-4 py-3 border-b border-white-light/80 dark:border-white-dark/10 hover:bg-gray-50 dark:hover:bg-white-dark/5 ${!n.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                                            >
                                                <p className="font-medium text-gray-800 dark:text-white text-sm">{n.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </Dropdown>
                    <button type="button" className="p-2 rounded-lg hover:bg-white-dark/10" onClick={openSettings} title={t('pos_header_theme_settings')}>
                        <IconSettings className="w-5 h-5" />
                    </button>
                    {themeConfig.theme === 'light' && (
                        <button type="button" className="p-2 rounded-lg hover:bg-white-dark/10" onClick={() => dispatch(toggleTheme('dark'))}>
                            <IconSun className="w-5 h-5" />
                        </button>
                    )}
                    {themeConfig.theme === 'dark' && (
                        <button type="button" className="p-2 rounded-lg hover:bg-white-dark/10" onClick={() => dispatch(toggleTheme('system'))}>
                            <IconMoon className="w-5 h-5" />
                        </button>
                    )}
                    {themeConfig.theme === 'system' && (
                        <button type="button" className="p-2 rounded-lg hover:bg-white-dark/10" onClick={() => dispatch(toggleTheme('light'))}>
                            <IconLaptop className="w-5 h-5" />
                        </button>
                    )}
                    <Dropdown
                        offset={[0, 8]}
                        placement="bottom-end"
                        btnClassName="flex items-center gap-2 p-2 rounded-lg hover:bg-white-dark/10"
                        button={
                            <span className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                    <IconUser className="w-4 h-4 text-primary" />
                                </div>
                                <span className="hidden sm:inline text-sm font-medium truncate max-w-[120px]">{userName}</span>
                            </span>
                        }
                    >
                        <ul className="py-1 text-sm min-w-[220px]">
                            <li className="px-4 py-2.5 border-b border-gray-100 dark:border-white/10">
                                <span className="font-medium block truncate text-gray-900 dark:text-white">{userName}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{t('pos_header_pos_account')}</span>
                            </li>
                            <li>
                                <Link to="/pos/profile" className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary/5 dark:hover:bg-white/5 w-full">
                                    <IconUser className="w-4 h-4 shrink-0 text-primary" /> {t('pos_header_my_profile')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/pos/profile#pos-subscription" className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary/5 dark:hover:bg-white/5 w-full">
                                    <IconCreditCard className="w-4 h-4 shrink-0 text-primary" /> {t('pos_header_subscription')}
                                </Link>
                            </li>
                            <li className="border-t border-gray-100 dark:border-white/10 mt-1 pt-1">
                                <Link to="/pos/support" className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary/5 dark:hover:bg-white/5 w-full">
                                    <IconHelpCircle className="w-4 h-4 shrink-0 text-primary" /> {t('pos_nav_support')}
                                </Link>
                            </li>
                            <li className="border-t border-gray-100 dark:border-white/10 mt-1 pt-1">
                                <button type="button" onClick={logout} className="w-full flex items-center gap-2 px-4 py-2.5 text-danger hover:bg-danger-light/10">
                                    <IconLogout className="w-4 h-4 rotate-90 shrink-0" /> {t('pos_header_sign_out')}
                                </button>
                            </li>
                        </ul>
                    </Dropdown>
                    </div>
                </div>

                {themeConfig.menu === 'horizontal' && (
                    <ul className="horizontal-menu hidden w-full flex-nowrap overflow-x-auto border-t border-[#ebedf2] bg-white py-1.5 pl-4 pr-4 font-semibold text-black dark:border-[#191e3a] dark:bg-black dark:text-white-dark lg:flex lg:space-x-1.5 xl:space-x-6 rtl:space-x-reverse">
                        {posHorizontalLinks.map(({ to, labelKey, Icon }) => (
                            <li key={to} className="menu nav-item relative shrink-0">
                                <NavLink to={to}>
                                    <button type="button" className="nav-link">
                                        <div className="sub-menu flex items-center">
                                            <Icon className="shrink-0" />
                                            <span className="px-1 whitespace-nowrap">{t(labelKey)}</span>
                                        </div>
                                    </button>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </header>
    );
};

export default PosHeader;
