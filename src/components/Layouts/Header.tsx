import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { IRootState } from '../../store';
import { toggleRTL, toggleTheme, toggleSidebar, toggleLocale } from '../../store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import Dropdown from '../Dropdown';
import IconMenu from '../Icon/IconMenu';
import IconXCircle from '../Icon/IconXCircle';
import IconSun from '../Icon/IconSun';
import IconMoon from '../Icon/IconMoon';
import IconLaptop from '../Icon/IconLaptop';
import IconInfoCircle from '../Icon/IconInfoCircle';
import IconBellBing from '../Icon/IconBellBing';
import IconUser from '../Icon/IconUser';
import IconLogout from '../Icon/IconLogout';
import IconMenuDashboard from '../Icon/Menu/IconMenuDashboard';
import IconCaretDown from '../Icon/IconCaretDown';
import IconMenuShop from '../Icon/Menu/IconMenuShop';
import IconMenuChat from '../Icon/Menu/IconMenuChat';
import IconMenuComponents from '../Icon/Menu/IconMenuComponents';
import IconMenuInvoice from '../Icon/Menu/IconMenuInvoice';
import IconMenuCalendar from '../Icon/Menu/IconMenuCalendar';
import IconMenuUsers from '../Icon/Menu/IconMenuUsers';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { profileMeta } from './../../helperComponents/MetaData';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { useUserPermissions } from '../../Hooks/useUserPermissions';

interface AppNotification {
    _id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
}

const formatTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (sec < 60) return 'Just now';
    if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
    if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`;
    return d.toLocaleDateString();
};

// Tries multiple common field-naming conventions so this works whether the
// logged-in account is an Admin, Team Member, Shop Owner, or Customer —
// different portals/backends sometimes store the display name under
// different keys (userNameF/userNameL, fullName, name, customerName, etc).
function getDisplayName(u: Record<string, any> | null | undefined): string {
    if (!u) return '';

    const f = (u.userNameF as string) || (u.customerNameF as string) || (u.nameF as string) || '';
    const l = (u.userNameL as string) || (u.customerNameL as string) || (u.nameL as string) || '';
    const combined = `${f} ${l}`.trim();
    if (combined) return combined;

    const single =
        (u.userName as string) ||
        (u.customerName as string) ||
        (u.fullName as string) ||
        (u.name as string) ||
        '';
    return (single || '').trim();
}

const Header = () => {
    const [userRole, setUserRole] = useState<string | null>(null);
    const { canViewTickets, isTeamMember, canViewShops, canViewTeam, canViewShopOwners, canManageSubscriptions } = useUserPermissions();




    const location = useLocation();
    const navigate = useNavigate();
    const [dataUserLogin, setDataUserLogin] = useState(profileMeta);
    useEffect(() => {
        const userInfo = localStorage.getItem('userInformation');
        const storedRole = localStorage.getItem('userRole');

        if (userInfo) {
            try {
                const parsedUserInfo = JSON.parse(userInfo);
                const data = parsedUserInfo?.data;
                if (data) {
                    setDataUserLogin(data);
                }
                const role = data?.userRole != null ? String(data.userRole) : storedRole ?? null;
                setUserRole(role);
            } catch {
                setUserRole(storedRole);
            }
        } else {
            setUserRole(storedRole);
        }

        const selector = document.querySelector('ul.horizontal-menu a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const all: any = document.querySelectorAll('ul.horizontal-menu .nav-link.active');
            for (let i = 0; i < all.length; i++) {
                all[0]?.classList.remove('active');
            }
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link');
                if (ele) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele?.classList.add('active');
                    });
                }
            }
        }
    }, [location]);

    // Robust display name for the logo area + profile dropdown, works across
    // Admin / Team Member / Shop Owner / Customer portals even if the backend
    // uses slightly different field names for each role.
    const displayName = getDisplayName(dataUserLogin as Record<string, any>);


    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();

    function createMarkup(messages: any) {
        return { __html: messages };
    }
    const [messages, setMessages] = useState([
        {
            id: 1,
            image: '<span className="grid place-content-center w-9 h-9 rounded-full bg-success-light dark:bg-success text-success dark:text-success-light"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></span>',
            title: 'Congratulations!',
            message: 'Your OS has been updated.',
            time: '1hr',
        },
        {
            id: 2,
            image: '<span className="grid place-content-center w-9 h-9 rounded-full bg-info-light dark:bg-info text-info dark:text-info-light"><svg g xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></span>',
            title: 'Did you know?',
            message: 'You can switch between artboards.',
            time: '2hr',
        },
        {
            id: 3,
            image: '<span className="grid place-content-center w-9 h-9 rounded-full bg-danger-light dark:bg-danger text-danger dark:text-danger-light"> <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>',
            title: 'Something went wrong!',
            message: 'Send Reposrt',
            time: '2days',
        },
        {
            id: 4,
            image: '<span className="grid place-content-center w-9 h-9 rounded-full bg-warning-light dark:bg-warning text-warning dark:text-warning-light"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">    <circle cx="12" cy="12" r="10"></circle>    <line x1="12" y1="8" x2="12" y2="12"></line>    <line x1="12" y1="16" x2="12.01" y2="16"></line></svg></span>',
            title: 'Warning',
            message: 'Your password strength is low.',
            time: '5days',
        },
    ]);

    const removeMessage = (value: number) => {
        setMessages(messages.filter((user) => user.id !== value));
    };

    const { token } = useAuthToken();
    const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const previousUnreadCountRef = useRef(-1);
    const hasFetchedOnceRef = useRef(false);

    const fetchNotifications = () => {
        if (!token) return;
        setNotificationsLoading(true);
        axios
            .get(`${ServerSetting.apiUrl}/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: 20 },
            })
            .then((res) => {
                if (res.data?.success && res.data?.data) {
                    const list: AppNotification[] = res.data.data.notifications || [];
                    const count = res.data.data.unreadCount ?? 0;
                    setAppNotifications(list);
                    setUnreadCount(count);

                    if (hasFetchedOnceRef.current && count > previousUnreadCountRef.current && list.length > 0) {
                        const latest = list[0];
                        const msg = (latest.message || '').slice(0, 120);
                        Swal.fire({
                            title: latest.title,
                            text: msg + ((latest.message || '').length > 120 ? '…' : ''),
                            toast: true,
                            position: isRtl ? 'bottom-start' : 'bottom-end',
                            showConfirmButton: false,
                            timer: 4500,
                            showCloseButton: true,
                            icon: 'info',
                            timerProgressBar: true,
                        });
                    }
                    hasFetchedOnceRef.current = true;
                    previousUnreadCountRef.current = count;
                }
            })
            .catch(() => {})
            .finally(() => setNotificationsLoading(false));
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        } else {
            setAppNotifications([]);
            setUnreadCount(0);
        }
    }, [token]);

    const markNotificationRead = (id: string, link?: string) => {
        if (!token) return;
        axios
            .patch(`${ServerSetting.apiUrl}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } })
            .then(() => {
                setAppNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
                setUnreadCount((c) => Math.max(0, c - 1));
                if (link) navigate(link);
            })
            .catch(() => {});
    };

    const markAllNotificationsRead = () => {
        if (!token) return;
        axios
            .patch(`${ServerSetting.apiUrl}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } })
            .then(() => {
                setAppNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                setUnreadCount(0);
            })
            .catch(() => {});
    };

    const [search, setSearch] = useState(false);

    const setLocale = (flag: string) => {
        setFlag(flag);
        if (flag.toLowerCase() === 'pk') {
            dispatch(toggleRTL('rtl'));
        } else {
            dispatch(toggleRTL('ltr'));
        }
    };
    const [flag, setFlag] = useState(themeConfig.locale);

    const { t } = useTranslation();
    const logout = () => {
        // Clear local storage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');

        // Optionally clear other session-related items

        // Redirect to home page
        navigate('/');
    };

    return (
        <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''}`}>
            <div className="shadow-sm">
                <div className="relative bg-white flex w-full items-center px-5 py-2.5 dark:bg-black">
                    <div className="horizontal-logo flex lg:hidden justify-between items-center ltr:mr-2 rtl:ml-2">
                        <div className="main-logo flex items-center shrink-0">
                            <img className="h-12 w-auto ltr:-ml-1 rtl:-mr-1 inline object-contain rounded-lg" src="/assets/images/commission-shop-logo.png" alt="Commission Shop" />
                            <span className="text-xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle hidden md:inline dark:text-white-light transition-all duration-300 truncate max-w-[160px]">
                                {displayName || t('app_name')}
                            </span>
                        </div>
                        <button
                            type="button"
                            className="collapse-icon flex-none dark:text-[#d0d2d6] hover:text-success dark:hover:text-success flex lg:hidden ltr:ml-2 rtl:mr-2 p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:bg-white-light/90 dark:hover:bg-dark/60"
                            onClick={() => {
                                dispatch(toggleSidebar());
                            }}
                        >
                            <IconMenu className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="sm:flex-1 ltr:sm:ml-0 ltr:ml-auto sm:rtl:mr-0 rtl:mr-auto flex items-center space-x-1.5 lg:space-x-2 rtl:space-x-reverse dark:text-[#d0d2d6]">
                        <div className="sm:ltr:mr-auto sm:rtl:ml-auto">
                        </div>
                        <div>
                            {themeConfig.theme === 'light' ? (
                                <button
                                    className={`${themeConfig.theme === 'light' &&
                                        'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-success hover:bg-white-light/90 dark:hover:bg-dark/60'
                                        }`}
                                    onClick={() => {
                                        dispatch(toggleTheme('dark'));
                                    }}
                                >
                                    <IconSun />
                                </button>
                            ) : (
                                ''
                            )}
                            {themeConfig.theme === 'dark' && (
                                <button
                                    className={`${themeConfig.theme === 'dark' &&
                                        'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-success hover:bg-white-light/90 dark:hover:bg-dark/60'
                                        }`}
                                    onClick={() => {
                                        dispatch(toggleTheme('system'));
                                    }}
                                >
                                    <IconMoon />
                                </button>
                            )}
                            {themeConfig.theme === 'system' && (
                                <button
                                    className={`${themeConfig.theme === 'system' &&
                                        'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-success hover:bg-white-light/90 dark:hover:bg-dark/60'
                                        }`}
                                    onClick={() => {
                                        dispatch(toggleTheme('light'));
                                    }}
                                >
                                    <IconLaptop />
                                </button>
                            )}
                        </div>
                        <div className="dropdown shrink-0">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-success hover:bg-white-light/90 dark:hover:bg-dark/60"
                                button={<img className="w-5 h-5 object-cover rounded-full" src={`/assets/images/flags/${flag.toUpperCase()}.svg`} alt="flag" />}
                            >
                                <ul className="!px-1 text-dark dark:text-white-dark grid grid-cols-1 gap-1 font-semibold dark:text-white-light/90 w-[280px]">
                                    {themeConfig.languageList.map((item: any) => {
                                        return (
                                            <li key={item.code}>
                                                <button
                                                    type="button"
                                                    className={`flex w-full hover:text-success rounded-lg ${i18next.language === item.code ? 'bg-success/10 text-success' : ''}`}
                                                    onClick={() => {
                                                        i18next.changeLanguage(item.code);
                                                        setLocale(item.code);
                                                        dispatch(toggleLocale(item.code));
                                                    }}
                                                >
                                                    <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="flag" className="w-5 h-5 object-cover rounded-full" />
                                                    <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Dropdown>
                        </div>
                        <div className="dropdown shrink-0">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="relative block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-success hover:bg-white-light/90 dark:hover:bg-dark/60"
                                button={
                                    <span className="relative inline-flex">
                                        <IconBellBing className="w-5 h-5" />
                                        {unreadCount > 0 && (
                                            <span className="flex absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 min-w-[18px] h-[18px] items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white px-1">
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </span>
                                }
                            >
                                <ul className="!py-0 text-dark dark:text-white-dark w-[320px] sm:w-[380px] divide-y dark:divide-white/10 max-h-[400px] overflow-y-auto">
                                    <li onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center px-4 py-3 justify-between font-semibold sticky top-0 bg-white dark:bg-black z-10 border-b border-white-light dark:border-white/10">
                                            <h4 className="text-base">Notifications</h4>
                                            {unreadCount > 0 && (
                                                <button type="button" className="text-xs text-primary hover:underline" onClick={markAllNotificationsRead}>
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                    {notificationsLoading ? (
                                        <li className="py-8 flex justify-center">
                                            <span className="animate-spin border-2 border-primary border-t-transparent rounded-full w-8 h-8 inline-block" />
                                        </li>
                                    ) : appNotifications.length > 0 ? (
                                        <>
                                            {appNotifications.map((n) => (
                                                <li key={n._id} onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-white-dark/5 dark:hover:bg-white/5 transition-colors ${!n.read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                                        onClick={() => markNotificationRead(n._id, n.link)}
                                                    >
                                                        <span className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary dark:bg-primary/20">
                                                            {n.type === 'ticket_reply' ? (
                                                                <IconMenuChat className="w-5 h-5" />
                                                            ) : (
                                                                <IconMenuInvoice className="w-5 h-5" />
                                                            )}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm text-gray-800 dark:text-white truncate">{n.title}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                                            <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 block">{formatTimeAgo(n.createdAt)}</span>
                                                        </div>
                                                    </button>
                                                </li>
                                            ))}
                                        </>
                                    ) : (
                                        <li onClick={(e) => e.stopPropagation()}>
                                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                                <span className="w-12 h-12 rounded-full bg-gray-100 dark:bg-dark/40 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-2">
                                                    <IconBellBing className="w-6 h-6" />
                                                </span>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Ticket replies and subscription updates will appear here</p>
                                            </div>
                                        </li>
                                    )}
                                </ul>
                            </Dropdown>
                        </div>
                        <div className="dropdown shrink-0 flex">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="relative group block"
                                button={<img className="w-9 h-9 rounded-full object-cover saturate-50 group-hover:saturate-100" src={dataUserLogin?.userProfileImage ? `${ServerSetting.serUrl}/profile/${dataUserLogin.userProfileImage}` : '/assets/images/profile-34.jpeg'} alt="userProfile" />}
                            >
                                <ul className="text-dark dark:text-white-dark !py-0 w-[230px] font-semibold dark:text-white-light/90">
                                    <li>
                                        <div className="flex items-center px-4 py-4">
                                            <img className="rounded-md w-10 h-10 object-cover" src={dataUserLogin?.userProfileImage ? `${ServerSetting.serUrl}/profile/${dataUserLogin.userProfileImage}` : '/assets/images/profile-34.jpeg'} alt="userProfile" />
                                            <div className="ltr:pl-4 rtl:pr-4 truncate">
                                                <h4 className="text-base">
                                                    {displayName || (userRole === 'customer' ? 'Customer' : 'User')}
                                                    {(String(dataUserLogin?.userRole ?? '') === '0' || userRole === '0') && <span className="text-xs bg-primary-light dark:bg-primary rounded text-primary dark:text-white px-1 ltr:ml-2 rtl:ml-2">Admin</span>}
                                                    {(String(dataUserLogin?.userRole ?? '') === '1' || userRole === '1') && <span className="text-xs bg-success-light dark:bg-success rounded text-success dark:text-white px-1 ltr:ml-2 rtl:ml-2">Shop Owner</span>}
                                                    {(String(dataUserLogin?.userRole ?? '') === '2' || userRole === '2') && <span className="text-xs bg-info-light dark:bg-info rounded text-info dark:text-white px-1 ltr:ml-2 rtl:ml-2">Sub Admin</span>}
                                                    {(String(dataUserLogin?.userRole ?? '') === '3' || userRole === '3') && <span className="text-xs bg-info-light dark:bg-info rounded text-info dark:text-white px-1 ltr:ml-2 rtl:ml-2">Team Member</span>}
                                                    {userRole === 'customer' && <span className="text-xs bg-info-light dark:bg-info rounded text-info dark:text-white px-1 ltr:ml-2 rtl:ml-2">Customer</span>}
                                                </h4>
                                                <button type="button" className="text-black/60 hover:text-primary dark:text-dark-light/60 dark:hover:text-white text-sm">
                                                    {dataUserLogin?.userEmail ?? (userRole === 'customer' ? 'CNIC login' : '')}
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <Link to="/users/profile" className="dark:hover:text-white">
                                            <IconUser className="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 shrink-0" />
                                            {t('profile')}
                                        </Link>
                                    </li>
                                    {/* Support: Create Ticket, My Tickets – Shop Owner; Admin/Team also get All Tickets */}
                                    {(userRole === '1' || userRole === '0' || ((userRole === '2' || userRole === '3') && canViewTickets)) && (
                                        <>
                                            <li className="border-t border-white-light/50 dark:border-white-light/10 pt-1 mt-1">
                                                <span className="px-4 py-1.5 text-xs font-semibold text-gray-500 dark:text-white-dark/70 uppercase tracking-wider">Support</span>
                                            </li>
                                            <li>
                                                <Link to="/support/new" className="dark:hover:text-white">
                                                    <IconMenuChat className="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 shrink-0" />
                                                    {t('create_ticket')}
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/support" className="dark:hover:text-white">
                                                    <IconMenuChat className="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 shrink-0" />
                                                    {t('my_tickets')}
                                                </Link>
                                            </li>
                                            {(userRole === '0' || ((userRole === '2' || userRole === '3') && canViewTickets)) && (
                                                <li>
                                                    <Link to="/support/all" className="dark:hover:text-white">
                                                        <IconMenuChat className="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 shrink-0" />
                                                        {t('all_tickets')}
                                                    </Link>
                                                </li>
                                            )}
                                        </>
                                    )}
                                    <li onClick={logout} className="border-t border-white-light dark:border-white-light/10">
                                        <Link to={''} className="text-danger !py-3">
                                            <IconLogout className="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 rotate-90 shrink-0" />
                                            {t('sign_out')}
                                        </Link>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                {/* horizontal menu - only when layout is Horizontal (hidden when Vertical = single left sidebar) */}
                {themeConfig.menu === 'horizontal' && (
                <>
                <style>{`
                    /* Same green active/hover treatment as the sidebar, scoped to the
                       horizontal header menu only. */
                    .cs-header-nav .nav-link {
                        border-radius: 0.5rem !important;
                        transition: background-color 0.2s ease, box-shadow 0.2s ease !important;
                    }
                    .cs-header-nav .nav-link:hover {
                        background-color: rgba(22, 163, 74, 0.08) !important;
                    }
                    .cs-header-nav .nav-link:hover svg {
                        color: #16a34a !important;
                    }
                    /* Parent <a> from react-router NavLink gets the "active" class;
                       style the button/icon/label inside it green, same as sidebar. */
                    .cs-header-nav > li > a.active > .nav-link,
                    .cs-header-nav .nav-link.active {
                        background-color: #16a34a !important;
                        border: 1px solid #16a34a !important;
                        box-shadow: 0 10px 20px 0 rgba(22, 163, 74, 0.35) !important;
                    }
                    .cs-header-nav > li > a.active > .nav-link *,
                    .cs-header-nav .nav-link.active * {
                        color: #ffffff !important;
                    }
                    .cs-header-nav .sub-menu li a:hover {
                        color: #16a34a !important;
                        background-color: rgba(22, 163, 74, 0.08);
                        border-radius: 0.375rem;
                    }
                    .cs-header-nav .sub-menu li a.active {
                        color: #16a34a !important;
                        font-weight: 600;
                    }
                `}</style>
                <ul className="cs-header-nav horizontal-menu py-1.5 font-semibold px-6 lg:space-x-1.5 xl:space-x-8 rtl:space-x-reverse bg-white border-t border-[#ebedf2] dark:border-[#191e3a] dark:bg-black text-black dark:text-white-dark">
                    {/* Dashboard - All Roles */}
                    {(userRole === '0' || userRole === '1' || userRole === '2' || userRole === 'customer') && (
                        <li className="menu nav-item relative">
                            <NavLink to="/dashboard">
                                <button type="button" className="nav-link">
                                    <div className="flex items-center sub-menu">
                                        <IconMenuDashboard className="shrink-0" />
                                        <span className="px-1">{t('dashboard')}</span>
                                    </div>
                                </button>
                            </NavLink>
                        </li>
                    )}

                    {/* Team Member (2, 3): only permitted sections – Shops, Team, Shop Owners, Subscriptions, Support */}
                    {isTeamMember && (
                        <>
                            {canViewShops && (
                                <li className="menu nav-item relative">
                                    <NavLink to="/shop">
                                        <button type="button" className="nav-link">
                                            <div className="flex items-center sub-menu">
                                                <IconMenuShop className="shrink-0" />
                                                <span className="px-1">{t('shops')}</span>
                                            </div>
                                        </button>
                                    </NavLink>
                                </li>
                            )}
                            {canViewTeam && (
                                <li className="menu nav-item relative">
                                    <button type="button" className="nav-link">
                                        <div className="flex items-center">
                                            <IconMenuUsers className="shrink-0" />
                                            <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('team')}</span>
                                        </div>
                                        <div className="right_arrow">
                                            <IconCaretDown />
                                        </div>
                                    </button>
                                    <ul className="sub-menu">
                                        <li>
                                            <NavLink to="/admin/team">{t('team_members')}</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/admin/team/add">{t('add_team_member')}</NavLink>
                                        </li>
                                    </ul>
                                </li>
                            )}
                            {canViewShopOwners && (
                                <li className="menu nav-item relative">
                                    <button type="button" className="nav-link">
                                        <div className="flex items-center">
                                            <IconMenuUsers className="shrink-0" />
                                            <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('shop_owners')}</span>
                                        </div>
                                        <div className="right_arrow">
                                            <IconCaretDown />
                                        </div>
                                    </button>
                                    <ul className="sub-menu">
                                        <li>
                                            <NavLink to="/shopowner">{t('all_shop_owners')}</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/creatshopowner">{t('create_shop_owner')}</NavLink>
                                        </li>
                                    </ul>
                                </li>
                            )}
                            {canManageSubscriptions && (
                                <li className="menu nav-item relative">
                                    <button type="button" className="nav-link">
                                        <div className="flex items-center">
                                            <IconMenuInvoice className="shrink-0" />
                                            <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('subscriptions')}</span>
                                        </div>
                                        <div className="right_arrow">
                                            <IconCaretDown />
                                        </div>
                                    </button>
                                    <ul className="sub-menu">
                                        <li>
                                            <NavLink to="/subcriptions">{t('all_subscriptions')}</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/addsubcription">{t('add_subscription')}</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/SubcriptionHistory">{t('subscription_history')}</NavLink>
                                        </li>
                                    </ul>
                                </li>
                            )}
                        </>
                    )}
                    
                    {/* Admin Only Menu Items */}
                    {(userRole === '0') && (
                        <>
                            {/* Shops & Owners */}
                            <li className="menu nav-item relative">
                                <button type="button" className="nav-link">
                                    <div className="flex items-center">
                                        <IconMenuShop className="shrink-0" />
                                        <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('shops_and_owners')}</span>
                                    </div>
                                    <div className="right_arrow">
                                        <IconCaretDown />
                                    </div>
                                </button>
                                <ul className="sub-menu">
                                    <li>
                                        <NavLink to="/shop">{t('all_shops')}</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/shopowner">{t('shop_owners')}</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/creatshopowner">{t('create_shop_owner')}</NavLink>
                                    </li>
                                </ul>
                            </li>

                            {/* Subscriptions */}
                            <li className="menu nav-item relative">
                                <button type="button" className="nav-link">
                                    <div className="flex items-center">
                                        <IconMenuInvoice className="shrink-0" />
                                        <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('subscriptions_title')}</span>
                                    </div>
                                    <div className="right_arrow">
                                        <IconCaretDown />
                                    </div>
                                </button>
                                <ul className="sub-menu">
                                    <li>
                                        <NavLink to="/subcriptions">{t('all_subscriptions_menu')}</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/addsubcription">{t('add_subscription_menu')}</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/SubcriptionHistory">{t('subscription_history_menu')}</NavLink>
                                    </li>
                                </ul>
                            </li>
                            
                            {/* Pesticide POS */}
                            <li className="menu nav-item relative">
                                <button type="button" className="nav-link">
                                    <div className="flex items-center">
                                        <IconMenuShop className="shrink-0" />
                                        <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('pesticide_pos')}</span>
                                    </div>
                                    <div className="right_arrow">
                                        <IconCaretDown />
                                    </div>
                                </button>
                                <ul className="sub-menu">
                                    <li>
                                        <NavLink to="/pesticide-pos/register">{t('register_pesticide_shop')}</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/pesticide-pos/subscriptions">{t('subscription_for_pos')}</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/pesticide-pos/subscription-history">{t('pos_subscription_history')}</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/pesticide-pos/owners">{t('pos_owners')}</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/pesticide-pos/shops">{t('pesticide_shop_list')}</NavLink>
                                    </li>
                                </ul>
                            </li>

                            {/* Team */}
                            <li className="menu nav-item relative">
                                <button type="button" className="nav-link">
                                    <div className="flex items-center">
                                        <IconMenuUsers className="shrink-0" />
                                        <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('team')}</span>
                                    </div>
                                    <div className="right_arrow">
                                        <IconCaretDown />
                                    </div>
                                </button>
                                <ul className="sub-menu">
                                    <li>
                                        <NavLink to="/admin/team">{t('team_members')}</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/team/add">{t('add_team_member')}</NavLink>
                                    </li>
                                </ul>
                            </li>

                            {/* Crops */}
                            <li className="menu nav-item relative">
                                <button type="button" className="nav-link">
                                    <div className="flex items-center">
                                        <IconMenuCalendar className="shrink-0" />
                                        <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('crops')}</span>
                                    </div>
                                    <div className="right_arrow">
                                        <IconCaretDown />
                                    </div>
                                </button>
                                <ul className="sub-menu">
                                    <li>
                                        <NavLink to="/viewcrops">{t('all_crops_menu')}</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/addnewcrop">{t('add_new_crop_page')}</NavLink>
                                    </li>
                                </ul>
                            </li>

                        </>
                    )}

                    {/* Shop Owner Menu Items */}
                    {(userRole === '1') && (
                        <>
                            {/* Shop Crops */}
                            <li className="menu nav-item relative">
                                <NavLink to="/getassginshopcrops">
                                    <button type="button" className="nav-link">
                                        <div className="flex items-center sub-menu">
                                            <IconMenuCalendar className="shrink-0" />
                                            <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('my_crops')}</span>
                                        </div>
                                    </button>
                                </NavLink>
                            </li>

                            {/* POS Shop Management */}
                            <li className="menu nav-item relative">
                                <NavLink to="/pos-shop-management">
                                    <button type="button" className="nav-link">
                                        <div className="flex items-center sub-menu">
                                            <IconMenuShop className="shrink-0" />
                                            <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('pos_shop_management')}</span>
                                        </div>
                                    </button>
                                </NavLink>
                            </li>

                            {/* POS Payments */}
                            <li className="menu nav-item relative">
                                <NavLink to="/pos-payments">
                                    <button type="button" className="nav-link">
                                        <div className="flex items-center sub-menu">
                                            <IconMenuShop className="shrink-0" />
                                            <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('pos_payments')}</span>
                                        </div>
                                    </button>
                                </NavLink>
                            </li>
                            
                            {/* Customers */}
                            <li className="menu nav-item relative">
                                <button type="button" className="nav-link">
                                    <div className="flex items-center">
                                        <IconMenuUsers className="shrink-0" />
                                        <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('customers')}</span>
                                    </div>
                                    <div className="right_arrow">
                                        <IconCaretDown />
                                    </div>
                                </button>
                                <ul className="sub-menu">
                                    <li>
                                        <NavLink to="/customerlist">{t('customer_list')}</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/addnewcustomer">{t('add_customer')}</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/customerbalance">{t('customer_balance')}</NavLink>
                                    </li>
                                </ul>
                            </li>

                            {/* Finance */}
                            <li className="menu nav-item relative">
                                <NavLink to="/finance">
                                    <button type="button" className="nav-link">
                                        <div className="flex items-center sub-menu">
                                            <IconMenuInvoice className="shrink-0" />
                                            <span className="px-1">{t('finance')}</span>
                                        </div>
                                    </button>
                                </NavLink>
                            </li>
                            
                            {/* Shop Expenses */}
                            <li className="menu nav-item relative">
                                <NavLink to="/expense-management">
                                    <button type="button" className="nav-link">
                                        <div className="flex items-center sub-menu">
                                            <IconMenuInvoice className="shrink-0" />
                                            <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('expenses')}</span>
                                        </div>
                                    </button>
                                </NavLink>
                            </li>

                        </>
                    )}
                    
                    {/* Customer Role Menu Items – mirrors what Sidebar.tsx shows for this role.
                        Customers section removed (Shop Owner only now, role '1') to match the
                        Sidebar.tsx fix. Finance is a simple direct link (no dropdown) since
                        Customer only has "Finance Overview" – "Shop Expenses" is Shop Owner ONLY (role '1'). */}
                    {(userRole === 'customer') && (
                        <>
                            {/* Finance – single destination, no dropdown */}
                            <li className="menu nav-item relative">
                                <NavLink to="/finance">
                                    <button type="button" className="nav-link">
                                        <div className="flex items-center sub-menu">
                                            <IconMenuInvoice className="shrink-0" />
                                            <span className="px-1" style={{ whiteSpace: "nowrap" }}>{t('finance')}</span>
                                        </div>
                                    </button>
                                </NavLink>
                            </li>
                        </>
                    )}

                </ul>
                </>
                )}
            </div>
        </header>
    );
};

export default Header;
