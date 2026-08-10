import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import ConnectionsPanel from '../../components/Connections/ConnectionsPanel';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';

/**
 * Shop owner (Commission Shop) page: Connect with POS users.
 * Shown in main layout as "POS Shop Management".
 */
const PosShopManagement = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle(t('pos_shop_management')));
    }, [dispatch, t]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <ul className="flex flex-wrap items-center gap-2 text-sm">
                    <li>
                        <Link to="/dashboard" className="text-green-600 hover:underline dark:text-green-400">
                            {t('dashboard')}
                        </Link>
                    </li>
                    <li className="text-gray-500 before:mr-2 before:content-['/'] dark:text-gray-400 ltr:before:mr-2 rtl:before:ml-2">
                        {t('pos_shop_management')}
                    </li>
                </ul>

                <Link
                    to="/dashboard"
                            className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                >
                    <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    {t('back_to_dashboard')}
                </Link>
            </div>

            <ConnectionsPanel targetType="pos_user" targetLabel={t('pos_user')} />
        </div>
    );
};

export default PosShopManagement;
