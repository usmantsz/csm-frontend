import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import IconCaretsDown from '../Icon/IconCaretsDown';
import IconCaretDown from '../Icon/IconCaretDown';
import IconMenuDashboard from '../Icon/Menu/IconMenuDashboard';
import IconMinus from '../Icon/IconMinus';
import IconMenuChat from '../Icon/Menu/IconMenuChat';
import IconMenuMailbox from '../Icon/Menu/IconMenuMailbox';
import IconMenuTodo from '../Icon/Menu/IconMenuTodo';
import IconMenuNotes from '../Icon/Menu/IconMenuNotes';
import IconMenuScrumboard from '../Icon/Menu/IconMenuScrumboard';
import IconMenuContacts from '../Icon/Menu/IconMenuContacts';
import IconMenuInvoice from '../Icon/Menu/IconMenuInvoice';
import IconMenuCalendar from '../Icon/Menu/IconMenuCalendar';
import IconMenuComponents from '../Icon/Menu/IconMenuComponents';
import IconMenuElements from '../Icon/Menu/IconMenuElements';
import IconMenuCharts from '../Icon/Menu/IconMenuCharts';
import IconMenuWidgets from '../Icon/Menu/IconMenuWidgets';
import IconMenuFontIcons from '../Icon/Menu/IconMenuFontIcons';
import IconMenuDragAndDrop from '../Icon/Menu/IconMenuDragAndDrop';
import IconMenuTables from '../Icon/Menu/IconMenuTables';
import IconMenuDatatables from '../Icon/Menu/IconMenuDatatables';
import IconMenuForms from '../Icon/Menu/IconMenuForms';
import IconMenuUsers from '../Icon/Menu/IconMenuUsers';
import IconMenuShop from '../Icon/Menu/IconMenuShop';
import IconMenuPages from '../Icon/Menu/IconMenuPages';
import IconMenuAuthentication from '../Icon/Menu/IconMenuAuthentication';
import IconMenuDocumentation from '../Icon/Menu/IconMenuDocumentation';
import { useUserPermissions } from '../../Hooks/useUserPermissions';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import axios from 'axios';

// Tries multiple common field-naming conventions so this works whether the
// logged-in account is an Admin, Team Member, Shop Owner, or Customer —
// different portals/backends sometimes store the display name under
// different keys (userNameF/userNameL, fullName, name, customerName, etc).
function extractDisplayName(raw: Record<string, any> | null | undefined): string {
    if (!raw) return '';
    const u = raw?.data || raw || {};

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

const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const [errorSubMenu, setErrorSubMenu] = useState(false);
    const [permissionsRefreshed, setPermissionsRefreshed] = useState(0);
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { token } = useAuthToken();
    const [userRole, setUserRole] = useState<string | null>(() =>
        typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
    );
    // Logged-in user's display name — shown in place of the static app name in the logo area
    const [userName, setUserName] = useState<string>('');
    const { isTeamMember, canViewShops, canViewTeam, canViewShopOwners, canManageSubscriptions, canViewTickets } = useUserPermissions();

    // Team member: refresh permissions from API on load so sidebar shows all assigned sections (Shop Owners, Subscriptions, Support)
    useEffect(() => {
        if (!isTeamMember || !token) return;
        axios
            .get(`${ServerSetting.apiUrl}/me`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((res) => {
                if (res.data?.success && res.data?.data) {
                    try {
                        const raw = localStorage.getItem('userInformation');
                        if (raw) {
                            const existing = JSON.parse(raw);
                            const merged = { ...existing, data: { ...(existing.data || {}), ...res.data.data } };
                            localStorage.setItem('userInformation', JSON.stringify(merged));
                            setPermissionsRefreshed((k) => k + 1);
                        }
                    } catch {
                        // ignore
                    }
                }
            })
            .catch(() => {});
    }, [isTeamMember, token]);

    useEffect(() => {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        setUserRole(stored);

        // Read logged-in user's name from userInformation (same source Profile.tsx uses).
        // Falls back to a customerInformation key too, in case the customer portal
        // stores its session under a different localStorage key.
        try {
            const rawUserInfo = typeof window !== 'undefined' ? localStorage.getItem('userInformation') : null;
            const rawCustomerInfo = typeof window !== 'undefined' ? localStorage.getItem('customerInformation') : null;

            let name = '';
            if (rawUserInfo) {
                name = extractDisplayName(JSON.parse(rawUserInfo));
            }
            if (!name && rawCustomerInfo) {
                name = extractDisplayName(JSON.parse(rawCustomerInfo));
            }
            setUserName(name);
        } catch {
            setUserName('');
        }
    }, [location, permissionsRefreshed]);
    const isSuperAdminOnly = userRole === '0';
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    // ---- Green active/hover helpers (arbitrary hex so it doesn't depend on
    // the project's tailwind.config.js color tokens) ----
    const activeBtnClass = (isOn: boolean) => (isOn ? '!bg-[#16a34a] !text-white cs-active' : '');
    const activeIconClass = (isOn: boolean) =>
        isOn
            ? '!text-white'
            : '!text-[#506690] dark:!text-white-dark group-hover:!text-[#16a34a]';
    const activeLabelClass = (isOn: boolean) =>
        isOn ? '!text-white' : 'text-black dark:text-[#506690] dark:group-hover:text-white-dark';

    return (
        <div className={semidark ? 'dark' : ''}>
            {/* Scoped override — guaranteed to win over any conflicting global CSS
                (width/display/colors) because it's a more specific selector with
                !important, rendered after the app's global stylesheet. */}
   <style>{`
    .sidebar {
        container-type: inline-size !important;
        container-name: cs-sidebar !important;
        overflow: hidden !important;
    }
    .cs-sidebar-nav .nav-link {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 0.6rem 0.75rem !important;
        overflow: hidden !important;
    }
    .cs-sidebar-nav li.menu.nav-item {
        box-shadow: none !important;
        border: none !important;
        outline: none !important;
        overflow: hidden !important;
    }
    .cs-sidebar-nav .nav-link > div:first-child {
        display: flex !important;
        align-items: center !important;
        flex: 1 1 auto !important;
        min-width: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    .cs-sidebar-nav .nav-link svg {
        width: 20px !important;
        height: 20px !important;
        min-width: 20px !important;
        flex-shrink: 0 !important;
    }
    .cs-sidebar-nav .nav-link span {
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        display: inline-block !important;
        max-width: 100% !important;
    }
    .cs-sidebar-nav .nav-link .cs-caret {
        flex-shrink: 0 !important;
        display: flex !important;
        align-items: center !important;
    }
    .cs-sidebar-nav .nav-link.cs-active {
        background-color: #16a34a !important;
        border-radius: 0.5rem !important;
        border: 1px solid #16a34a !important;
        outline: 1px solid #16a34a !important;
        box-shadow: 0 10px 20px 0 rgba(22, 163, 74, 0.35) !important;
    }
    .cs-sidebar-nav .nav-link.cs-active,
    .cs-sidebar-nav .nav-link.cs-active span,
    .cs-sidebar-nav .nav-link.cs-active svg {
        color: #ffffff !important;
    }
    .sidebar .sub-menu {
        overflow: hidden !important;
    }

    /* ---- Sub-menu (dropdown) link active/click state ----
       Previously these links only had "text-gray-500" with no explicit
       active-state color, so in dark mode the text stayed gray even after
       being clicked/selected. Now: green in light mode, white in dark mode. */
    .sidebar .sub-menu li a.active,
    .dark .sidebar .sub-menu li a.active {
        color: #16a34a !important;
        font-weight: 600 !important;
    }
    .sidebar .sub-menu li a:hover,
    .dark .sidebar .sub-menu li a:hover {
        color: #16a34a !important;
    }

    /* ---- Dropdown TOGGLE buttons (Shop Owners, Team, Finance, Support, etc.) ----
       These get a plain "active" class (not just "cs-active") when their
       dropdown is open. Some global/template CSS was winning over our
       Tailwind !text-white on this specific class, so force it here with
       higher specificity for both light and dark mode. */
    .sidebar .cs-sidebar-nav .nav-link.active,
    .sidebar .cs-sidebar-nav .nav-link.active span,
    .sidebar .cs-sidebar-nav .nav-link.active svg,
    .sidebar .cs-sidebar-nav .nav-link.active .cs-caret,
    .dark .sidebar .cs-sidebar-nav .nav-link.active,
    .dark .sidebar .cs-sidebar-nav .nav-link.active span,
    .dark .sidebar .cs-sidebar-nav .nav-link.active svg,
    .dark .sidebar .cs-sidebar-nav .nav-link.active .cs-caret {
        color: #ffffff !important;
    }

    /* ---- Collapsed sidebar state: icons centered, equal green padding both sides ---- */
    @container cs-sidebar (max-width: 100px) {
        .cs-sidebar-nav {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
        }
        .cs-sidebar-nav li.menu.nav-item {
            display: flex !important;
            justify-content: center !important;
        }
        .cs-sidebar-nav .nav-link {
            justify-content: center !important;
            padding: 0.65rem !important;
            width: 44px !important;
            height: 44px !important;
        }
        .cs-sidebar-nav .nav-link > div:first-child {
            flex: 0 0 auto !important;
            justify-content: center !important;
            width: 100% !important;
        }
        .cs-sidebar-nav .nav-link span,
        .cs-sidebar-nav .nav-link .cs-caret {
            display: none !important;
        }
        .cs-sidebar-nav .nav-link svg {
            margin: 0 auto !important;
        }
        .main-logo span {
            display: none !important;
        }
    }
`}</style>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center  py-3">
                        <div className="main-logo flex items-center shrink-0 gap-2">
                            <img src="/assets/images/commission-shop-logo.png" alt="Commission Shop" className="h-14 w-14 object-contain flex-none rounded-lg" />
                            <span className="text-xl ltr:ml-1 rtl:mr-1 font-bold align-middle lg:inline dark:text-white-light text-[#15803d] dark:text-[#4ade80] truncate max-w-[150px]">
                                {userName || t('app_name')}
                            </span>
                        </div>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="cs-sidebar-nav relative font-semibold space-y-0.5 p-4 py-0">
                            <li className="menu nav-item">
                                <NavLink to="/dashboard">
                                    {({ isActive }) => (
                                        <button type="button" className={`${currentMenu === 'dashboard' ? 'active' : ''} ${activeBtnClass(isActive)} nav-link group !flex !w-full`} onClick={() => toggleMenu('dashboard')}>
                                            <div className="flex items-center">
                                                <IconMenuDashboard className={`${activeIconClass(isActive)} shrink-0`} />
                                                <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(isActive)}`}>{t('dashboard')}</span>
                                            </div>
                                        </button>
                                    )}
                                </NavLink>
                            </li>

                            {/* Team Member (2, 3): only permitted sections – Shops, Team, Shop Owners, Subscriptions, Support */}
                            {isTeamMember && (
                                <>
                                    {canViewShops && (
                                        <li className="menu nav-item">
                                            <NavLink to="/shop">
                                                {({ isActive }) => (
                                                    <button type="button" className={`${activeBtnClass(isActive)} nav-link group !flex !w-full`}>
                                                        <div className="flex items-center">
                                                            <IconMenuShop className={`${activeIconClass(isActive)} shrink-0`} />
                                                            <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(isActive)}`}>{t('shops')}</span>
                                                        </div>
                                                    </button>
                                                )}
                                            </NavLink>
                                        </li>
                                    )}
                                    {canViewTeam && (
                                        <li className="menu nav-item">
                                            <button type="button" className={`${currentMenu === 'team' ? 'active' : ''} ${activeBtnClass(currentMenu === 'team')} nav-link group !flex !w-full`} onClick={() => toggleMenu('team')}>
                                                <div className="flex items-center">
                                                    <IconMenuUsers className={`${activeIconClass(currentMenu === 'team')} shrink-0`} />
                                                    <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(currentMenu === 'team')}`}>{t('team')}</span>
                                                </div>
                                                <div className={`cs-caret ${currentMenu !== 'team' ? 'rtl:rotate-90 -rotate-90' : ''} ${currentMenu === 'team' ? '!text-white' : ''}`}>
                                                    <IconCaretDown />
                                                </div>
                                            </button>
                                            <AnimateHeight duration={300} height={currentMenu === 'team' ? 'auto' : 0}>
                                                <ul className="sub-menu text-gray-500">
                                                    <li><NavLink to="/admin/team">{t('team_members')}</NavLink></li>
                                                    <li><NavLink to="/admin/team/add">{t('add_team_member')}</NavLink></li>
                                                </ul>
                                            </AnimateHeight>
                                        </li>
                                    )}
                                    {canViewShopOwners && (
                                        <li className="menu nav-item">
                                            <button type="button" className={`${currentMenu === 'employees' ? 'active' : ''} ${activeBtnClass(currentMenu === 'employees')} nav-link group !flex !w-full`} onClick={() => toggleMenu('employees')}>
                                                <div className="flex items-center">
                                                    <IconMenuUsers className={`${activeIconClass(currentMenu === 'employees')} shrink-0`} />
                                                    <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(currentMenu === 'employees')}`}>{t('shop_owners')}</span>
                                                </div>
                                                <div className={`cs-caret ${currentMenu !== 'employees' ? 'rtl:rotate-90 -rotate-90' : ''} ${currentMenu === 'employees' ? '!text-white' : ''}`}>
                                                    <IconCaretDown />
                                                </div>
                                            </button>
                                            <AnimateHeight duration={300} height={currentMenu === 'employees' ? 'auto' : 0}>
                                                <ul className="sub-menu text-gray-500">
                                                    <li><NavLink to="/shopowner">{t('all_shop_owners')}</NavLink></li>
                                                    <li><NavLink to="/creatshopowner">{t('create_shop_owner')}</NavLink></li>
                                                </ul>
                                            </AnimateHeight>
                                        </li>
                                    )}
                                    {canManageSubscriptions && (
                                        <li className="menu nav-item">
                                            <button type="button" className={`${currentMenu === 'subscriptions' ? 'active' : ''} ${activeBtnClass(currentMenu === 'subscriptions')} nav-link group !flex !w-full`} onClick={() => toggleMenu('subscriptions')}>
                                                <div className="flex items-center">
                                                    <IconMenuInvoice className={`${activeIconClass(currentMenu === 'subscriptions')} shrink-0`} />
                                                    <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(currentMenu === 'subscriptions')}`}>{t('subscriptions')}</span>
                                                </div>
                                                <div className={`cs-caret ${currentMenu !== 'subscriptions' ? 'rtl:rotate-90 -rotate-90' : ''} ${currentMenu === 'subscriptions' ? '!text-white' : ''}`}>
                                                    <IconCaretDown />
                                                </div>
                                            </button>
                                            <AnimateHeight duration={300} height={currentMenu === 'subscriptions' ? 'auto' : 0}>
                                                <ul className="sub-menu text-gray-500">
                                                    <li><NavLink to="/subcriptions">{t('all_subscriptions')}</NavLink></li>
                                                    <li><NavLink to="/addsubcription">{t('add_subscription')}</NavLink></li>
                                                    <li><NavLink to="/SubcriptionHistory">{t('subscription_history')}</NavLink></li>
                                                </ul>
                                            </AnimateHeight>
                                        </li>
                                    )}
                                    {canViewTickets && (
                                        <li className="menu nav-item">
                                            <button type="button" className={`${currentMenu === 'support' ? 'active' : ''} ${activeBtnClass(currentMenu === 'support')} nav-link group !flex !w-full`} onClick={() => toggleMenu('support')}>
                                                <div className="flex items-center">
                                                    <IconMenuChat className={`${activeIconClass(currentMenu === 'support')} shrink-0`} />
                                                    <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(currentMenu === 'support')}`}>{t('support')}</span>
                                                </div>
                                                <div className={`cs-caret ${currentMenu !== 'support' ? 'rtl:rotate-90 -rotate-90' : ''} ${currentMenu === 'support' ? '!text-white' : ''}`}>
                                                    <IconCaretDown />
                                                </div>
                                            </button>
                                            <AnimateHeight duration={300} height={currentMenu === 'support' ? 'auto' : 0}>
                                                <ul className="sub-menu text-gray-500">
                                                    <li><NavLink to="/support/new">{t('create_ticket')}</NavLink></li>
                                                    <li><NavLink to="/support">{t('my_tickets')}</NavLink></li>
                                                    <li><NavLink to="/support/all">{t('all_tickets')}</NavLink></li>
                                                </ul>
                                            </AnimateHeight>
                                        </li>
                                    )}
                                </>
                            )}

                            {/* Super Admin (0) only: Shops, Shop Owners, Subscriptions, Crops, Team – not for Shop Owner */}
                            {!isTeamMember && isSuperAdminOnly && (
                                <>
                                    <li className="menu nav-item">
                                        <NavLink to="/shop">
                                            {({ isActive }) => (
                                                <button type="button" className={`${activeBtnClass(isActive)} nav-link group !flex !w-full`}>
                                                    <div className="flex items-center">
                                                        <IconMenuShop className={`${activeIconClass(isActive)} shrink-0`} />
                                                        <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(isActive)}`}>{t('shops')}</span>
                                                    </div>
                                                </button>
                                            )}
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'employees' ? 'active' : ''} ${activeBtnClass(currentMenu === 'employees')} nav-link group !flex !w-full`} onClick={() => toggleMenu('employees')}>
                                            <div className="flex items-center">
                                                <IconMenuUsers className={`${activeIconClass(currentMenu === 'employees')} shrink-0`} />
                                                <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(currentMenu === 'employees')}`}>{t('shop_owners')}</span>
                                            </div>
                                            <div className={`cs-caret ${currentMenu !== 'employees' ? 'rtl:rotate-90 -rotate-90' : ''} ${currentMenu === 'employees' ? '!text-white' : ''}`}>
                                                <IconCaretDown />
                                            </div>
                                        </button>
                                        <AnimateHeight duration={300} height={currentMenu === 'employees' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li><NavLink to="/shopowner">All Shop Owners</NavLink></li>
                                                <li><NavLink to="/creatshopowner">Create Shop Owner</NavLink></li>
                                            </ul>
                                        </AnimateHeight>
                                    </li>
                                    <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'subscriptions' ? 'active' : ''} ${activeBtnClass(currentMenu === 'subscriptions')} nav-link group !flex !w-full`} onClick={() => toggleMenu('subscriptions')}>
                                            <div className="flex items-center">
                                                <IconMenuInvoice className={`${activeIconClass(currentMenu === 'subscriptions')} shrink-0`} />
                                                <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(currentMenu === 'subscriptions')}`}>{t('subscriptions')}</span>
                                            </div>
                                            <div className={`cs-caret ${currentMenu !== 'subscriptions' ? 'rtl:rotate-90 -rotate-90' : ''} ${currentMenu === 'subscriptions' ? '!text-white' : ''}`}>
                                                <IconCaretDown />
                                            </div>
                                        </button>
                                        <AnimateHeight duration={300} height={currentMenu === 'subscriptions' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li><NavLink to="/subcriptions">{t('all_subscriptions')}</NavLink></li>
                                                <li><NavLink to="/addsubcription">{t('add_subscription')}</NavLink></li>
                                                <li><NavLink to="/SubcriptionHistory">{t('subscription_history')}</NavLink></li>
                                            </ul>
                                        </AnimateHeight>
                                    </li>
                                    <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'pesticidePos' ? 'active' : ''} ${activeBtnClass(currentMenu === 'pesticidePos')} nav-link group !flex !w-full`} onClick={() => toggleMenu('pesticidePos')}>
                                            <div className="flex items-center">
                                                <IconMenuShop className={`${activeIconClass(currentMenu === 'pesticidePos')} shrink-0`} />
                                                <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(currentMenu === 'pesticidePos')}`}>{t('pesticide_pos')}</span>
                                            </div>
                                            <div className={`cs-caret ${currentMenu !== 'pesticidePos' ? 'rtl:rotate-90 -rotate-90' : ''} ${currentMenu === 'pesticidePos' ? '!text-white' : ''}`}>
                                                <IconCaretDown />
                                            </div>
                                        </button>
                                        <AnimateHeight duration={300} height={currentMenu === 'pesticidePos' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li><NavLink to="/pesticide-pos/register">{t('register_pesticide_shop')}</NavLink></li>
                                                <li><NavLink to="/pesticide-pos/subscriptions">{t('subscription_for_pos')}</NavLink></li>
                                                <li><NavLink to="/pesticide-pos/subscription-history">{t('pos_subscription_history')}</NavLink></li>
                                                <li><NavLink to="/pesticide-pos/owners">{t('pos_owners')}</NavLink></li>
                                                <li><NavLink to="/pesticide-pos/shops">{t('pesticide_shop_list')}</NavLink></li>
                                            </ul>
                                        </AnimateHeight>
                                    </li>
                                    <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'team' ? 'active' : ''} ${activeBtnClass(currentMenu === 'team')} nav-link group !flex !w-full`} onClick={() => toggleMenu('team')}>
                                            <div className="flex items-center">
                                                <IconMenuUsers className={`${activeIconClass(currentMenu === 'team')} shrink-0`} />
                                                <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(currentMenu === 'team')}`}>{t('team')}</span>
                                            </div>
                                            <div className={`cs-caret ${currentMenu !== 'team' ? 'rtl:rotate-90 -rotate-90' : ''} ${currentMenu === 'team' ? '!text-white' : ''}`}>
                                                <IconCaretDown />
                                            </div>
                                        </button>
                                        <AnimateHeight duration={300} height={currentMenu === 'team' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li><NavLink to="/admin/team">Team Members</NavLink></li>
                                                <li><NavLink to="/admin/team/add">Add Team Member</NavLink></li>
                                            </ul>
                                        </AnimateHeight>
                                    </li>
                                    <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'crops' ? 'active' : ''} ${activeBtnClass(currentMenu === 'crops')} nav-link group !flex !w-full`} onClick={() => toggleMenu('crops')}>
                                            <div className="flex items-center">
                                                <IconMenuCalendar className={`${activeIconClass(currentMenu === 'crops')} shrink-0`} />
                                                <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(currentMenu === 'crops')}`}>{t('crops')}</span>
                                            </div>
                                            <div className={`cs-caret ${currentMenu !== 'crops' ? 'rtl:rotate-90 -rotate-90' : ''} ${currentMenu === 'crops' ? '!text-white' : ''}`}>
                                                <IconCaretDown />
                                            </div>
                                        </button>
                                        <AnimateHeight duration={300} height={currentMenu === 'crops' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li><NavLink to="/viewcrops">{t('all_crops')}</NavLink></li>
                                                <li><NavLink to="/addnewcrop">{t('add_crop')}</NavLink></li>
                                            </ul>
                                        </AnimateHeight>
                                    </li>
                                </>
                            )}

                            {/* Shop owner only: My Crops (single link) */}
                            {userRole === '1' && (
                                <li className="menu nav-item">
                                    <NavLink to="/getassginshopcrops">
                                        {({ isActive }) => (
                                            <button type="button" className={`${activeBtnClass(isActive)} nav-link group !flex !w-full`}>
                                                <div className="flex items-center">
                                                    <IconMenuCalendar className={`${activeIconClass(isActive)} shrink-0`} />
                                                    <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(isActive)}`}>{t('my_crops')}</span>
                                                </div>
                                            </button>
                                        )}
                                    </NavLink>
                                </li>
                            )}

                            {/* Shop owner only: POS Shop Management (connect with POS users) */}
                            {userRole === '1' && (
                                <>
                                    <li className="menu nav-item">
                                        <NavLink to="/pos-shop-management">
                                            {({ isActive }) => (
                                                <button type="button" className={`${activeBtnClass(isActive)} nav-link group !flex !w-full`}>
                                                    <div className="flex items-center">
                                                        <IconMenuShop className={`${activeIconClass(isActive)} shrink-0`} />
                                                        <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(isActive)}`}>{t('pos_shop_management')}</span>
                                                    </div>
                                                </button>
                                            )}
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/pos-payments">
                                            {({ isActive }) => (
                                                <button type="button" className={`${activeBtnClass(isActive)} nav-link group !flex !w-full`}>
                                                    <div className="flex items-center">
                                                        <IconMenuShop className={`${activeIconClass(isActive)} shrink-0`} />
                                                        <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(isActive)}`}>{t('pos_payments')}</span>
                                                    </div>
                                                </button>
                                            )}
                                        </NavLink>
                                    </li>
                                </>
                            )}

                            {/* Customers – Shop Owner ONLY (role '1'). Not shown for Admin, Team Member, or Customer portal. */}
                            {userRole === '1' && (
                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'customers' ? 'active' : ''} ${activeBtnClass(currentMenu === 'customers')} nav-link group !flex !w-full`} onClick={() => toggleMenu('customers')}>
                                    <div className="flex items-center">
                                        <IconMenuUsers className={`${activeIconClass(currentMenu === 'customers')} shrink-0`} />
                                        <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(currentMenu === 'customers')}`}>{t('customers')}</span>
                                    </div>
                                    <div className={`cs-caret ${currentMenu !== 'customers' ? 'rtl:rotate-90 -rotate-90' : ''} ${currentMenu === 'customers' ? '!text-white' : ''}`}>
                                        <IconCaretDown />
                                    </div>
                                </button>
                                <AnimateHeight duration={300} height={currentMenu === 'customers' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
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
                                </AnimateHeight>
                            </li>
                            )}

                            {/* Finance – Shop Owner (role '1'): dropdown with Finance Overview + Shop Expenses. */}
                            {userRole === '1' && (
                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'finance' ? 'active' : ''} ${activeBtnClass(currentMenu === 'finance')} nav-link group !flex !w-full`} onClick={() => toggleMenu('finance')}>
                                    <div className="flex items-center">
                                        <IconMenuInvoice className={`${activeIconClass(currentMenu === 'finance')} shrink-0`} />
                                        <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(currentMenu === 'finance')}`}>{t('finance')}</span>
                                    </div>
                                    <div className={`cs-caret ${currentMenu !== 'finance' ? 'rtl:rotate-90 -rotate-90' : ''} ${currentMenu === 'finance' ? '!text-white' : ''}`}>
                                        <IconCaretDown />
                                    </div>
                                </button>
                                <AnimateHeight duration={300} height={currentMenu === 'finance' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/finance">{t('finance_overview')}</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/expense-management">{t('shop_expenses')}</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>
                            )}

                            {/* Finance – Customer portal: only Finance Overview exists, so a simple
                                direct link (no dropdown/caret) instead of a single-item submenu. */}
                            {!isTeamMember && userRole !== '0' && userRole !== '1' && (
                            <li className="menu nav-item">
                                <NavLink to="/finance">
                                    {({ isActive }) => (
                                        <button type="button" className={`${activeBtnClass(isActive)} nav-link group !flex !w-full`}>
                                            <div className="flex items-center">
                                                <IconMenuInvoice className={`${activeIconClass(isActive)} shrink-0`} />
                                                <span className={`ltr:pl-3 rtl:pr-3 truncate ${activeLabelClass(isActive)}`}>{t('finance')}</span>
                                            </div>
                                        </button>
                                    )}
                                </NavLink>
                            </li>
                            )}

                            {/* Apps, UI, Tables, Forms, Users, Pages, Authentication, Documentation – hidden */}
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
