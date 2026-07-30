import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import IconCaretsDown from '../Icon/IconCaretsDown';
import IconMinus from '../Icon/IconMinus';
import IconMenuDashboard from '../Icon/Menu/IconMenuDashboard';
import IconMenuShop from '../Icon/Menu/IconMenuShop';
import IconMenuUsers from '../Icon/Menu/IconMenuUsers';
import IconMenuInvoice from '../Icon/Menu/IconMenuInvoice';
import IconMenuCalendar from '../Icon/Menu/IconMenuCalendar';

const SidebarImproved = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    
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
    }, [location, dispatch, themeConfig.sidebar]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3">
                        <NavLink to="/dashboard" className="main-logo flex items-center shrink-0 gap-2">
                            <img src="/assets/images/commission-shop-logo.png" alt="Commission Shop" className="h-14 w-14 object-contain flex-none rounded-lg" />
                            <span className="text-xl ltr:ml-1 rtl:mr-1 font-bold align-middle lg:inline dark:text-white-light text-primary-700 dark:text-primary-400">
                                Commission Shop
                            </span>
                        </NavLink>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>
                    
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            {/* Dashboard */}
                            <li className="menu nav-item">
                                <NavLink to="/dashboard">
                                    <button type="button" className={`${currentMenu === 'dashboard' ? 'active' : ''} nav-link group w-full`}>
                                        <div className="flex items-center">
                                            <IconMenuDashboard className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Dashboard</span>
                                        </div>
                                    </button>
                                </NavLink>
                            </li>

                            {/* Commission Shop Management Section */}
                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 mt-4">
                                <IconMinus className="w-4 h-5 flex-none hidden" />
                                <span>Shop Management</span>
                            </h2>

                            {/* Shops */}
                            <li className="menu nav-item">
                                <NavLink to="/shop">
                                    <button type="button" className="nav-link group w-full">
                                        <div className="flex items-center">
                                            <IconMenuShop className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Shops</span>
                                        </div>
                                    </button>
                                </NavLink>
                            </li>

                            {/* Shop Owners / Employees */}
                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'employees' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('employees')}>
                                    <div className="flex items-center">
                                        <IconMenuUsers className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Shop Owners</span>
                                    </div>
                                    <div className={currentMenu !== 'employees' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretsDown className="w-4 h-4" />
                                    </div>
                                </button>
                                <AnimateHeight duration={300} height={currentMenu === 'employees' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/shopowner">All Shop Owners</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/creatshopowner">Create Shop Owner</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            {/* Subscriptions */}
                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'subscriptions' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('subscriptions')}>
                                    <div className="flex items-center">
                                        <IconMenuInvoice className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Subscriptions</span>
                                    </div>
                                    <div className={currentMenu !== 'subscriptions' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretsDown className="w-4 h-4" />
                                    </div>
                                </button>
                                <AnimateHeight duration={300} height={currentMenu === 'subscriptions' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/subcriptions">All Subscriptions</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/addsubcription">Add Subscription</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/SubcriptionHistory">Subscription History</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            {/* Crops Section */}
                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 mt-4">
                                <IconMinus className="w-4 h-5 flex-none hidden" />
                                <span>Crop Management</span>
                            </h2>

                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'crops' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('crops')}>
                                    <div className="flex items-center">
                                        <IconMenuCalendar className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Crops</span>
                                    </div>
                                    <div className={currentMenu !== 'crops' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretsDown className="w-4 h-4" />
                                    </div>
                                </button>
                                <AnimateHeight duration={300} height={currentMenu === 'crops' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/viewcrops">All Crops</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/addnewcrop">Add New Crop</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/getassginshopcrops">Assigned Crops</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            {/* Customers Section */}
                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 mt-4">
                                <IconMinus className="w-4 h-5 flex-none hidden" />
                                <span>Customer Management</span>
                            </h2>

                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'customers' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('customers')}>
                                    <div className="flex items-center">
                                        <IconMenuUsers className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Customers</span>
                                    </div>
                                    <div className={currentMenu !== 'customers' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretsDown className="w-4 h-4" />
                                    </div>
                                </button>
                                <AnimateHeight duration={300} height={currentMenu === 'customers' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/customerlist">Customer List</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/addnewcustomer">Add Customer</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/customerbalance">Customer Balance</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            {/* Finance Section */}
                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 mt-4">
                                <IconMinus className="w-4 h-5 flex-none hidden" />
                                <span>Finance & Transactions</span>
                            </h2>

                            <li className="menu nav-item">
                                <NavLink to="/finance">
                                    <button type="button" className="nav-link group w-full">
                                        <div className="flex items-center">
                                            <IconMenuInvoice className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Finance Overview</span>
                                        </div>
                                    </button>
                                </NavLink>
                            </li>

                            {/* Expenses */}
                            <li className="menu nav-item">
                                <NavLink to="/expense-management">
                                    <button type="button" className="nav-link group w-full">
                                        <div className="flex items-center">
                                            <IconMenuInvoice className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Shop Expenses</span>
                                        </div>
                                    </button>
                                </NavLink>
                            </li>

                            {/* User Account Section */}
                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 mt-4">
                                <IconMinus className="w-4 h-5 flex-none hidden" />
                                <span>Account</span>
                            </h2>

                            <li className="menu nav-item">
                                <NavLink to="/users/profile">
                                    <button type="button" className="nav-link group w-full">
                                        <div className="flex items-center">
                                            <IconMenuUsers className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Profile</span>
                                        </div>
                                    </button>
                                </NavLink>
                            </li>

                            <li className="menu nav-item">
                                <NavLink to="/users/user-account-settings">
                                    <button type="button" className="nav-link group w-full">
                                        <div className="flex items-center">
                                            <IconMenuUsers className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Account Settings</span>
                                        </div>
                                    </button>
                                </NavLink>
                            </li>
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default SidebarImproved;

