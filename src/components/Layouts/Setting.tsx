import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { IRootState } from '../../store';
import { toggleAnimation, toggleLayout, toggleMenu, toggleNavbar, toggleRTL, toggleTheme, toggleSemidark, setOpenSettingPanel } from '../../store/themeConfigSlice';
import IconSettings from '../Icon/IconSettings';
import IconX from '../Icon/IconX';
import IconSun from '../Icon/IconSun';
import IconMoon from '../Icon/IconMoon';
import IconLaptop from '../Icon/IconLaptop';

const closePanel = (dispatch: any) => {
    dispatch(setOpenSettingPanel(false));
};

const Setting = () => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const [showCustomizer, setShowCustomizer] = useState(false);
    const isOpen = showCustomizer || themeConfig.openSettingPanel;

    useEffect(() => {
        if (themeConfig.openSettingPanel) setShowCustomizer(true);
    }, [themeConfig.openSettingPanel]);

    const handleClose = () => {
        setShowCustomizer(false);
        closePanel(dispatch);
    };

    // ---- Shared style tokens (green — matches the rest of the app) ----
    const cardClass = 'border border-green-200 dark:border-green-800 rounded-2xl mb-4 p-4 bg-green-50/40 dark:bg-white/[0.02] transition-colors';
    const cardTitleClass = 'mb-1 text-base font-bold text-stone-900 dark:text-white leading-none';
    const cardSubtitleClass = 'text-stone-500 dark:text-stone-400 text-xs';
    const btnBase = 'btn rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 border';
    const btnActive = 'bg-green-600 text-white border-green-600 shadow-[0_6px_16px_rgba(22,163,74,0.3)] dark:bg-green-500 dark:text-white dark:border-green-500';
    const btnInactive = 'bg-transparent border-green-200 text-stone-700 hover:bg-green-100 dark:border-green-800 dark:text-stone-300 dark:hover:bg-green-900/30';
    const btnClass = (active: boolean) => `${btnBase} ${active ? btnActive : btnInactive}`;
    const labelClass = 'inline-flex items-center gap-2 mb-0 text-sm text-stone-700 dark:text-stone-300';
    const radioCheckboxClass = 'accent-green-600 dark:accent-green-500 w-4 h-4';

    return (
        <div>
            <div className={`${(isOpen && '!block') || ''} fixed inset-0 bg-black/60 z-[51] px-4 hidden transition-[display]`} onClick={handleClose}></div>

            <nav
                className={`${
                    (isOpen && 'ltr:!right-0 rtl:!left-0') || ''
                } bg-white dark:bg-[#060b16] fixed ltr:-right-[400px] rtl:-left-[400px] top-0 bottom-0 w-full max-w-[400px] shadow-[5px_0_25px_0_rgba(22,163,74,0.15)] transition-[right] duration-300 z-[51] border-l border-green-200 dark:border-green-800 p-4`}
            >
                <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-green-600 via-green-400 to-green-600" />

                <button
                    type="button"
                    className="bg-green-600 ltr:rounded-tl-full rtl:rounded-tr-full ltr:rounded-bl-full rtl:rounded-br-full absolute ltr:-left-12 rtl:-right-12 top-0 bottom-0 my-auto w-12 h-10 flex justify-center items-center text-white cursor-pointer shadow-[0_8px_20px_rgba(22,163,74,0.35)] hover:bg-green-700 transition-colors duration-200"
                    onClick={() => { setShowCustomizer(!showCustomizer); if (showCustomizer) closePanel(dispatch); }}
                >
                    <IconSettings className="animate-[spin_3s_linear_infinite] w-5 h-5" />
                </button>

                <div className="overflow-y-auto overflow-x-hidden perfect-scrollbar h-full">
                    <div className="text-center relative pb-5 border-b border-green-200 dark:border-green-800 mb-4">
                        <button
                            type="button"
                            className="absolute top-0 ltr:right-0 rtl:left-0 text-stone-500 opacity-60 hover:opacity-100 hover:text-green-600 dark:text-stone-300 dark:hover:text-green-400 transition-colors duration-200"
                            onClick={handleClose}
                        >
                            <IconX className="w-5 h-5" />
                        </button>

                        <p className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-100/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-green-700 dark:border-green-800 dark:bg-green-900/40 dark:text-green-200">
                            {t('customizer')}
                        </p>
                        <h4 className="mt-3 mb-1 text-lg font-bold text-stone-900 dark:text-white">{t('template_customizer')}</h4>
                        <p className="text-stone-500 dark:text-stone-400 text-sm">{t('customizer_desc')}</p>
                    </div>

                    <div className={cardClass}>
                        <h5 className={cardTitleClass}>{t('color_scheme')}</h5>
                        <p className={cardSubtitleClass}>{t('color_scheme_desc')}</p>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            <button type="button" className={btnClass(themeConfig.theme === 'light')} onClick={() => dispatch(toggleTheme('light'))}>
                                <IconSun className="w-5 h-5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                {t('light')}
                            </button>

                            <button type="button" className={btnClass(themeConfig.theme === 'dark')} onClick={() => dispatch(toggleTheme('dark'))}>
                                <IconMoon className="w-5 h-5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                {t('dark')}
                            </button>

                            <button type="button" className={btnClass(themeConfig.theme === 'system')} onClick={() => dispatch(toggleTheme('system'))}>
                                <IconLaptop className="w-5 h-5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                {t('system')}
                            </button>
                        </div>
                    </div>

                    <div className={cardClass}>
                        <h5 className={cardTitleClass}>{t('navigation_position')}</h5>
                        <p className={cardSubtitleClass}>{t('navigation_position_desc')}</p>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            <button type="button" className={btnClass(themeConfig.menu === 'horizontal')} onClick={() => dispatch(toggleMenu('horizontal'))}>
                                {t('horizontal')}
                            </button>
                            <button type="button" className={btnClass(themeConfig.menu === 'vertical')} onClick={() => dispatch(toggleMenu('vertical'))}>
                                {t('vertical')}
                            </button>
                            <button type="button" className={btnClass(themeConfig.menu === 'collapsible-vertical')} onClick={() => dispatch(toggleMenu('collapsible-vertical'))}>
                                {t('collapsible')}
                            </button>
                        </div>
                        <div className="mt-5">
                            <label className={labelClass}>
                                <input
                                    type="checkbox"
                                    className={radioCheckboxClass}
                                    checked={themeConfig.semidark === true || themeConfig.semidark === 'true'}
                                    onChange={(e) => dispatch(toggleSemidark(e.target.checked))}
                                />
                                <span>{t('semi_dark')}</span>
                            </label>
                        </div>
                    </div>

                    <div className={cardClass}>
                        <h5 className={cardTitleClass}>{t('layout_style')}</h5>
                        <p className={cardSubtitleClass}>{t('layout_style_desc')}</p>
                        <div className="flex gap-2 mt-3">
                            <button type="button" className={`${btnClass(themeConfig.layout === 'boxed-layout')} flex-auto`} onClick={() => dispatch(toggleLayout('boxed-layout'))}>
                                {t('box')}
                            </button>

                            <button type="button" className={`${btnClass(themeConfig.layout === 'full')} flex-auto`} onClick={() => dispatch(toggleLayout('full'))}>
                                {t('full')}
                            </button>
                        </div>
                    </div>

                    <div className={cardClass}>
                        <h5 className={cardTitleClass}>{t('direction')}</h5>
                        <p className={cardSubtitleClass}>{t('direction_desc')}</p>
                        <div className="flex gap-2 mt-3">
                            <button type="button" className={`${btnClass(themeConfig.rtlClass === 'ltr')} flex-auto`} onClick={() => dispatch(toggleRTL('ltr'))}>
                                {t('ltr')}
                            </button>

                            <button type="button" className={`${btnClass(themeConfig.rtlClass === 'rtl')} flex-auto`} onClick={() => dispatch(toggleRTL('rtl'))}>
                                {t('rtl')}
                            </button>
                        </div>
                    </div>

                    <div className={cardClass}>
                        <h5 className={cardTitleClass}>{t('navbar_type')}</h5>
                        <p className={cardSubtitleClass}>{t('navbar_type_desc')}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                            <label className={labelClass}>
                                <input
                                    type="radio"
                                    checked={themeConfig.navbar === 'navbar-sticky'}
                                    value="navbar-sticky"
                                    className={radioCheckboxClass}
                                    onChange={() => dispatch(toggleNavbar('navbar-sticky'))}
                                />
                                <span>{t('sticky')}</span>
                            </label>
                            <label className={labelClass}>
                                <input
                                    type="radio"
                                    checked={themeConfig.navbar === 'navbar-floating'}
                                    value="navbar-floating"
                                    className={radioCheckboxClass}
                                    onChange={() => dispatch(toggleNavbar('navbar-floating'))}
                                />
                                <span>{t('floating')}</span>
                            </label>
                            <label className={labelClass}>
                                <input
                                    type="radio"
                                    checked={themeConfig.navbar === 'navbar-static'}
                                    value="navbar-static"
                                    className={radioCheckboxClass}
                                    onChange={() => dispatch(toggleNavbar('navbar-static'))}
                                />
                                <span>{t('static')}</span>
                            </label>
                        </div>
                    </div>

                    <div className={cardClass}>
                        <h5 className={cardTitleClass}>{t('router_transition')}</h5>
                        <p className={cardSubtitleClass}>{t('router_transition_desc')}</p>
                        <div className="mt-3">
                            <select
                                className="form-select w-full rounded-xl border-green-200 bg-white text-stone-700 focus:border-green-600 focus:ring-green-600/20 dark:border-green-800 dark:bg-[#0b1526] dark:text-stone-200 dark:focus:border-green-400"
                                value={themeConfig.animation}
                                onChange={(e) => dispatch(toggleAnimation(e.target.value))}
                            >
                                <option value=" ">{t('none')}</option>
                                <option value="animate__fadeIn">{t('fade')}</option>
                                <option value="animate__fadeInDown">{t('fade_down')}</option>
                                <option value="animate__fadeInUp">{t('fade_up')}</option>
                                <option value="animate__fadeInLeft">{t('fade_left')}</option>
                                <option value="animate__fadeInRight">{t('fade_right')}</option>
                                <option value="animate__slideInDown">{t('slide_down')}</option>
                                <option value="animate__slideInLeft">{t('slide_left')}</option>
                                <option value="animate__slideInRight">{t('slide_right')}</option>
                                <option value="animate__zoomIn">{t('zoom_in')}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Setting;