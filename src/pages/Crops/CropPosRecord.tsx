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
            <div className="bg-[#060d16] min-h-full -m-4 p-4 md:-m-6 md:p-6">
                <div className="flex justify-end mb-4">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/30 bg-[#08121d]/80 hover:bg-emerald-500/10 hover:border-emerald-400 text-emerald-400 text-sm font-medium tracking-wide shadow-sm transition-all duration-200 group"
                    >
                        <IconArrowLeft className="w-4 h-4 rtl:rotate-180 transform group-hover:-translate-x-0.5 transition-transform" />
                        {t('posrecord_back')}
                    </button>
                </div>
                <div className="rounded-2xl border border-[#14273b]/60 bg-gradient-to-b from-[#0c1926]/95 to-[#08121d]/90 p-6 text-center text-slate-400 shadow-2xl backdrop-blur-xl">
                    {t('posrecord_missing_crop_user')}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#060d16] min-h-full -m-4 p-4 md:-m-6 md:p-6">
            <div className="max-w-7xl w-full mx-auto space-y-6">
                <ul className="flex flex-wrap items-center gap-2 text-sm">
                    <li>
                        <Link to="/dashboard" className="text-emerald-500 hover:text-emerald-400 transition-colors">
                            {t('posrecord_breadcrumb_dashboard')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 before:text-slate-600">
                        <Link to="/getassginshopcrops" className="text-emerald-500 hover:text-emerald-400 transition-colors">
                            {t('posrecord_breadcrumb_my_crops')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 before:text-slate-600">
                        <Link to={cropMenuPath} className="text-emerald-500 hover:text-emerald-400 transition-colors">
                            {t('posrecord_breadcrumb_crop_menu')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 before:text-slate-600 text-slate-300 font-normal">
                        {t('posrecord_breadcrumb_pos_record')}
                    </li>
                </ul>

                {/* Back button - top right, outside card */}
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/30 bg-[#08121d]/80 hover:bg-emerald-500/10 hover:border-emerald-400 text-emerald-400 text-sm font-medium tracking-wide shadow-sm transition-all duration-200 group"
                    >
                        <IconArrowLeft className="w-4 h-4 rtl:rotate-180 transform group-hover:-translate-x-0.5 transition-transform" />
                        {t('posrecord_back_to_crop_menu')}
                    </button>
                </div>

                <section className="rounded-2xl border border-[#14273b]/60 bg-gradient-to-b from-[#0c1926]/95 to-[#08121d]/90 shadow-2xl backdrop-blur-xl overflow-hidden">
                    {apiError && (
                        <div className="mx-6 mt-5 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm">{apiError}</div>
                    )}

                    {/* Card Header Bar */}
                    <div className="px-6 py-5 border-b border-[#14273b]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0c1926]/60">
                        <div className="flex items-center space-x-3">
                            <div className="w-2.5 h-7 rounded-full bg-emerald-500 shadow-[0_0_10px_-2px_rgba(16,185,129,0.4)]"></div>
                            <h5 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                                {t('posrecord_title')}
                                {cropName ? ` – ${cropName}` : ''}
                            </h5>
                        </div>
                        <Link
                            to="/pos-payments"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04080e] font-semibold text-sm shadow-[0_0_20px_-3px_rgba(16,185,129,0.35)] hover:shadow-emerald-400/40 transition-all duration-200 transform active:scale-[0.98]"
                        >
                            {t('posrecord_pos_payments_btn')}
                        </Link>
                    </div>

                    {!cropId || !shopId ? (
                        <div className="text-center py-8 text-slate-400">{t('posrecord_crop_shop_unresolved')}</div>
                    ) : loading ? (
                        <div className="flex justify-center py-8">
                            <span className="animate-spin inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
                        </div>
                    ) : list.length === 0 ? (
                        <div className="py-20 px-6 flex flex-col items-center justify-center text-center">
                            <div className="relative mb-5 flex items-center justify-center">
                                <div className="absolute w-24 h-24 rounded-full bg-emerald-500/10 blur-xl"></div>
                                <div className="relative w-16 h-16 rounded-2xl bg-[#0e2030] border border-[#1b334d]/80 flex items-center justify-center text-emerald-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
                                    <svg className="w-8 h-8 opacity-85" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="1.6"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-slate-300 text-base md:text-lg font-normal tracking-wide max-w-md">{t('posrecord_no_records')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table-auto w-full text-sm">
                                <thead>
                                    <tr className="bg-[#0e1726]/60 border-b border-[#14273b]/60">
                                        <th className="text-left py-3 px-6 font-semibold text-slate-300">{t('posrecord_col_receipt')}</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-300">{t('posrecord_col_customer')}</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-300">{t('posrecord_col_pos_user')}</th>
                                        <th className="text-right py-3 px-4 font-semibold text-slate-300">{t('posrecord_col_amount')}</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-300">{t('posrecord_col_status')}</th>
                                        <th className="text-left py-3 px-6 font-semibold text-slate-300">{t('posrecord_col_date')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map((r) => (
                                        <tr key={r._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-6 font-mono text-white">{r.receiptNumber}</td>
                                            <td className="py-3 px-4 text-slate-300">
                                                {r.customerName} ({r.customerCNIC})
                                            </td>
                                            <td className="py-3 px-4 text-slate-300">{r.posUserName || '—'}</td>
                                            <td className="py-3 px-4 text-right font-medium text-white">Rs {Number(r.totalAmount || 0).toLocaleString()}</td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                        r.status === 'fulfilled'
                                                            ? 'bg-emerald-500/15 text-emerald-300'
                                                            : r.status === 'pending'
                                                            ? 'bg-amber-500/15 text-amber-300'
                                                            : 'bg-slate-500/15 text-slate-300'
                                                    }`}
                                                >
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-slate-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default CropPosRecord;
