import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import ConnectionsPanel from '../../components/Connections/ConnectionsPanel';
import PageHeader from '../../components/Agricultural/PageHeader';

/**
 * POS user page: Connect with Commission Shop owners.
 * Shown in POS layout as "Commission Shop Management".
 */
const CommissionShopManagement = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const [showGuide, setShowGuide] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle(t('pos_nav_commission_shops')));
    }, [dispatch, t, i18n.language]);

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('pos_nav_commission_shops')}
                description={t('pos_commission_mgmt_desc')}
                backTo="/pos/dashboard"
                backLabel={t('pos_back_dashboard')}
                icon={<span>🏪</span>}
            />
            <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 px-4 py-3">
                <button
                    type="button"
                    onClick={() => setShowGuide((v) => !v)}
                    className="flex w-full items-center justify-between text-left font-semibold text-emerald-900 dark:text-emerald-200"
                >
                    <span>{t('pos_commission_onboard_title')}</span>
                    <span className="text-sm opacity-80">{showGuide ? '−' : '+'}</span>
                </button>
                {showGuide && (
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-t border-emerald-200/60 dark:border-emerald-800/40 pt-2">
                        {t('pos_commission_onboard_body')}
                    </p>
                )}
            </div>
            <div className="panel">
                <ConnectionsPanel targetType="shop_owner" targetLabel={t('table_shop_owner')} />
            </div>
        </div>
    );
};

export default CommissionShopManagement;
