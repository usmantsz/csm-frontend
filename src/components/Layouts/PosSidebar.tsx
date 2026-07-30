import PerfectScrollbar from 'react-perfect-scrollbar';
import { NavLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { toggleSidebar } from '../../store/themeConfigSlice';
import { IRootState } from '../../store';
import { useTranslation } from 'react-i18next';
import IconCaretsDown from '../Icon/IconCaretsDown';
import IconMenuDashboard from '../Icon/Menu/IconMenuDashboard';
import IconMenuInvoice from '../Icon/Menu/IconMenuInvoice';
import IconMenuShop from '../Icon/Menu/IconMenuShop';
import IconMenuUsers from '../Icon/Menu/IconMenuUsers';
import IconHelpCircle from '../Icon/IconHelpCircle';

const PosSidebar = () => {
    const { t } = useTranslation();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();

    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-white-light/50 dark:border-white-light/10">
                        <NavLink to="/pos/dashboard" className="main-logo flex items-center shrink-0 gap-2">
                            <img src="/assets/images/logo.svg" alt="Commission Shop" className="h-10 w-10 object-contain flex-none rounded-lg" />
                            <span className="text-lg ltr:ml-1 rtl:mr-1 font-bold align-middle lg:inline dark:text-white-light text-primary-700 dark:text-primary-400">
                                POS
                            </span>
                        </NavLink>
                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                            aria-label={t('pos_aria_toggle_sidebar')}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            <li className="menu nav-item">
                                <NavLink
                                    to="/pos/dashboard"
                                    className={({ isActive }) => `nav-link group w-full ${isActive ? 'active' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <IconMenuDashboard className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('pos_nav_dashboard')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item">
                                <NavLink
                                    to="/pos/sale"
                                    className={({ isActive }) => `nav-link group w-full ${isActive ? 'active' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <IconMenuInvoice className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('pos_nav_new_sale')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item">
                                <NavLink
                                    to="/pos/products"
                                    className={({ isActive }) => `nav-link group w-full ${isActive ? 'active' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <IconMenuShop className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('pos_nav_products')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item">
                                <NavLink
                                    to="/pos/sales-history"
                                    className={({ isActive }) => `nav-link group w-full ${isActive ? 'active' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <IconMenuInvoice className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('pos_nav_sales_history')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item">
                                <NavLink
                                    to="/pos/customers"
                                    className={({ isActive }) => `nav-link group w-full ${isActive ? 'active' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <IconMenuUsers className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('pos_nav_customers')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item">
                                <NavLink
                                    to="/pos/pending-requests"
                                    className={({ isActive }) => `nav-link group w-full ${isActive ? 'active' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <IconMenuInvoice className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('pos_nav_shop_requests')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item">
                                <NavLink
                                    to="/pos/commission-shop-management"
                                    className={({ isActive }) => `nav-link group w-full ${isActive ? 'active' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <IconMenuShop className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('pos_nav_commission_shops')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item mt-4 pt-4 border-t border-white-light/50 dark:border-white-light/10">
                                <NavLink
                                    to="/pos/support"
                                    className={({ isActive }) => `nav-link group w-full ${isActive ? 'active' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <IconHelpCircle className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('pos_nav_support')}</span>
                                    </div>
                                </NavLink>
                            </li>
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default PosSidebar;
