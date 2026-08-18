import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { useShopId } from '../../Hooks/useShopId';
import { useShopIdFromUrl } from '../../Hooks/useShopIdFromUrl';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import axios from 'axios';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';

type PosRecord = {
    _id: string;
    receiptNumber: string;
    customerName: string;
    customerCNIC: string;
    totalAmount: number;
    status: string;
    posUserName: string;
    createdAt: string;
};

const CropPosRecord = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const params = useParams<{ userId?: string; cropId?: string }>();
    const paramUserId = params?.userId ?? '';
    const cropId = params?.cropId ?? '';
    const [searchParams] = useSearchParams();
    const { token, user } = useAuthToken();
    const { shopId: urlShopId } = useShopIdFromUrl();
    const { shopId: userShopId } = useShopId();
    const [shopId, setShopId] = useState<string | null>(() => searchParams.get('shopId') || null);
    const [cropName, setCropName] = useState('');
    const [list, setList] = useState<PosRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingShop, setFetchingShop] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const effectiveUserId = paramUserId || (user as any)?._id;

    // Sync initial shopId from hooks (may be available from URL or context)
    useEffect(() => {
        if (urlShopId) setShopId(String(urlShopId));
        else if (userShopId) setShopId(String(userShopId));
    }, [urlShopId, userShopId]);

    useEffect(() => {
        dispatch(setPageTitle(t('posrecord_page_title')));
    }, [dispatch, t]);

    // Resolve shopId from API when not provided by URL/context
    useEffect(() => {
        if (urlShopId || userShopId) return;
        if (!effectiveUserId || !token) return;
        setFetchingShop(true);
        axios
            .get(`${ServerSetting.serUrl}/api/getShopId/${effectiveUserId}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((r) => {
                if (r.data?.status === 200 && r.data?.data) {
                    const sid = r.data.data._id ?? (typeof r.data.data === 'string' ? r.data.data : null);
                    if (sid) setShopId(String(sid));
                }
            })
            .catch(() => {})
            .finally(() => setFetchingShop(false));
    }, [effectiveUserId, token, urlShopId, userShopId]);

    useEffect(() => {
        if (!cropId || !token) return;
        axios
            .get(`${ServerSetting.serUrl}/api/viewcrop/${cropId}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((r) => { if (r.data?.status === 200 && r.data?.data?.cropName) setCropName(r.data.data.cropName); })
            .catch(() => {});
    }, [cropId, token]);

    useEffect(() => {
        if (!cropId || !shopId || !token) {
            setList([]);
            setApiError(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setApiError(null);
        axios
            .get(`${ServerSetting.apiUrl}/shop-owner-pos/requests/by-crop/${cropId}`, {
                params: { shopId },
                headers: { Authorization: `Bearer ${token}` },
                validateStatus: () => true,
            })
            .then((r) => {
                if (r.data?.status === 200 && Array.isArray(r.data?.data)) setList(r.data.data);
                else setList([]);
                if (r.data?.status !== 200 && r.data?.message) setApiError(r.data.message);
            })
            .catch((e) => {
                setList([]);
                setApiError(e.response?.data?.message || t('posrecord_load_failed'));
            })
            .finally(() => setLoading(false));
    }, [cropId, shopId, token, t]);

    const getRouteWithShopId = (path: string) => {
        const s = searchParams.get('shopId');
        if (s) return `${path}${path.includes('?') ? '&' : '?'}shopId=${s}`;
        return path;
    };

    const cropMenuPath = paramUserId && cropId ? getRouteWithShopId(`/cropmenu/${paramUserId}/${cropId}`) : '/getassginshopcrops';

    if (!paramUserId || !cropId) {
        return (
            <div>
                <div className="flex justify-end mb-4">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                    >
                        <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        {t('posrecord_back')}
                    </button>
                </div>
                <div className="panel p-6 text-center text-gray-500 dark:text-gray-400">
                    {t('posrecord_missing_crop_user')}
                </div>
            </div>
        );
    }

    return (
        <div>
            <ul className="flex flex-wrap items-center gap-2 text-sm mb-6">
                <li><Link to="/dashboard" className="text-primary hover:underline">{t('posrecord_breadcrumb_dashboard')}</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link to="/getassginshopcrops" className="text-primary hover:underline">{t('posrecord_breadcrumb_my_crops')}</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link to={cropMenuPath} className="text-primary hover:underline">{t('posrecord_breadcrumb_crop_menu')}</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-500 dark:text-gray-400">{t('posrecord_breadcrumb_pos_record')}</li>
            </ul>

            {/* Back button - top right, outside card */}
            <div className="flex justify-end mb-4">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                >
                    <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    {t('posrecord_back_to_crop_menu')}
                </button>
            </div>

            <div className="panel bg-white dark:bg-[#0e1726] p-5 rounded-2xl border border-white-dark/10 shadow-sm">
                {apiError && (
                    <div className="mb-4 p-3 rounded-lg bg-danger/10 text-danger text-sm">{apiError}</div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('posrecord_title')}{cropName ? ` – ${cropName}` : ''}
                    </h5>
                    <Link
                        to="/pos-payments"
                        className="btn !bg-[#16a34a] !text-white !border-[#16a34a] hover:!bg-[#15803d] shadow-none rounded-xl px-4 py-2"
                    >
                        {t('posrecord_pos_payments_btn')}
                    </Link>
                </div>
                {!cropId || !shopId ? (
                    <div className="text-center py-8 text-gray-500">{t('posrecord_crop_shop_unresolved')}</div>
                ) : loading ? (
                    <div className="flex justify-center py-8"><span className="animate-spin inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" /></div>
                ) : list.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('posrecord_no_records')}</p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-white-dark/10 dark:border-white/10">
                        <table className="table-auto w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-white/5 border-b border-white-dark/10">
                                    <th className="text-left py-3 px-4 font-semibold">{t('posrecord_col_receipt')}</th>
                                    <th className="text-left py-3 px-4 font-semibold">{t('posrecord_col_customer')}</th>
                                    <th className="text-left py-3 px-4 font-semibold">{t('posrecord_col_pos_user')}</th>
                                    <th className="text-right py-3 px-4 font-semibold">{t('posrecord_col_amount')}</th>
                                    <th className="text-left py-3 px-4 font-semibold">{t('posrecord_col_status')}</th>
                                    <th className="text-left py-3 px-4 font-semibold">{t('posrecord_col_date')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((r) => (
                                    <tr key={r._id} className="border-b border-white-dark/5 hover:bg-white-dark/5 dark:hover:bg-white/5">
                                        <td className="py-3 px-4 font-mono text-gray-800 dark:text-white">{r.receiptNumber}</td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{r.customerName} ({r.customerCNIC})</td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{r.posUserName || '—'}</td>
                                        <td className="py-3 px-4 text-right font-medium">Rs {Number(r.totalAmount || 0).toLocaleString()}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : r.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CropPosRecord;