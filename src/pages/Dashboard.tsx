import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { IRootState } from '../store';
import { setPageTitle } from '../store/themeConfigSlice';
import ReactApexChart from 'react-apexcharts';
import axios from 'axios';
import { ServerSetting } from '../helperComponents/ServerSetting';
import { useAuthToken } from '../Hooks/useAuthToken';
import { useShopId } from '../Hooks/useShopId';
import { useShopIdFromUrl } from '../Hooks/useShopIdFromUrl';
import { useDebouncedValue } from '../Hooks/useDebouncedValue';
import AgriculturalCard from '../components/Agricultural/AgriculturalCard';
import QuickActionButton from '../components/Agricultural/QuickActionButton';
import IconUser from '../components/Icon/IconUser';
import IconCashBanknotes from '../components/Icon/IconCashBanknotes';
import IconTag from '../components/Icon/IconTag';
import IconPlus from '../components/Icon/IconPlus';
import IconFile from '../components/Icon/IconFile';
import IconUsers from '../components/Icon/IconUsers';
import IconMenuDashboard from '../components/Icon/Menu/IconMenuDashboard';
import IconTrendingUp from '../components/Icon/IconTrendingUp';
import IconMenuCalendar from '../components/Icon/Menu/IconMenuCalendar';

// Shared style tokens so this page stays visually consistent with the rest
// of the app (obsidian / emerald glass-panel theme — see CropHistory / CropPosRecord).
// NOTE: these are now split into dark/light variants and resolved inside the
// component based on `isDark`, so the page actually respects the app's theme
// toggle instead of always rendering the dark palette.

const getCardGlass = (isDark: boolean) => ({
    background: isDark
        ? 'linear-gradient(135deg, rgba(14, 32, 48, 0.75) 0%, rgba(9, 21, 33, 0.85) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(236, 253, 245, 0.9) 100%)',
    backdropFilter: 'blur(12px)',
});

const cardBase = 'rounded-2xl border p-6';
const cardDark = 'border-[#1b344d]/80 shadow-[0_4px_20px_-2px_rgba(4,9,16,0.7)]';
const cardLight = 'border-emerald-100 shadow-[0_4px_20px_-2px_rgba(16,185,129,0.10)]';

const iconBadgeDark =
    'inline-flex shrink-0 h-10 w-10 items-center justify-center rounded-2xl bg-[#092233] border border-emerald-500/30 text-emerald-400 shadow-inner';
const iconBadgeLight =
    'inline-flex shrink-0 h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-inner';

const sectionHeadingDark = 'text-lg font-semibold text-white';
const sectionHeadingLight = 'text-lg font-semibold text-slate-800';

const sectionDividerDark = 'my-6 border-t border-[#142a40]/70';
const sectionDividerLight = 'my-6 border-t border-emerald-100';

const filterBoxDark = 'rounded-2xl border border-[#1b3650] bg-[#081522]/60 p-4 transition-colors focus-within:border-emerald-500';
const filterBoxLight = 'rounded-2xl border border-emerald-100 bg-white p-4 transition-colors focus-within:border-emerald-500 shadow-sm';

const filterLabelDark = 'mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-300';
const filterLabelLight = 'mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-600';

const filterSelectDark =
    'form-select w-full rounded-xl border-[#1b3650] bg-[#081522] text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
const filterSelectLight =
    'form-select w-full rounded-xl border-emerald-100 bg-white text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';

const pageBgDark = 'bg-[#060d16]';
const pageBgLight = 'bg-slate-50';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

function parseDashboardRes(res: any): any {
    const data = res?.data;
    if (!data) return null;
    if (data.success && data.data) return data.data;
    if (data.status === 200 && data.data) return data.data;
    return null;
}

function isAbortError(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;
    const e = err as { code?: string; name?: string };
    return e.code === 'ERR_CANCELED' || e.name === 'CanceledError' || e.name === 'AbortError';
}

function normalizeOverview(raw: any): {
    totalCustomers: number;
    totalCrops: number;
    totalReceivable: number;
    totalPayable: number;
} {
    if (!raw || typeof raw !== 'object') {
        return { totalCustomers: 0, totalCrops: 0, totalReceivable: 0, totalPayable: 0 };
    }
    return {
        totalCustomers: Number(raw.totalCustomers) || 0,
        totalCrops: Number(raw.totalCrops) || 0,
        totalReceivable: Number(raw.totalReceivable) || 0,
        totalPayable: Number(raw.totalPayable) || 0,
    };
}

const Dashboard = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const { shopId: urlShopId } = useShopIdFromUrl();
    const { shopId: userShopId, loading: shopIdLoading } = useShopId();
    const shopId = urlShopId || userShopId;

    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

    // Resolve the shared tokens against the current theme once per render.
    const cardGlass = getCardGlass(isDark);
    const card = `${cardBase} ${isDark ? cardDark : cardLight}`;
    const iconBadge = isDark ? iconBadgeDark : iconBadgeLight;
    const sectionHeading = isDark ? sectionHeadingDark : sectionHeadingLight;
    const sectionDivider = isDark ? sectionDividerDark : sectionDividerLight;
    const filterBox = isDark ? filterBoxDark : filterBoxLight;
    const filterLabel = isDark ? filterLabelDark : filterLabelLight;
    const filterSelect = isDark ? filterSelectDark : filterSelectLight;
    const pageBg = isDark ? pageBgDark : pageBgLight;

    const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
    const strongText = isDark ? 'text-slate-200' : 'text-slate-800';
    const emeraldValueText = isDark ? 'text-emerald-400' : 'text-emerald-600';
    const dividerBorder = isDark ? 'border-[#142a40]' : 'border-emerald-100';

    const [year, setYear] = useState(currentYear.toString());
    const [quarter, setQuarter] = useState('');
    const [cropId, setCropId] = useState('');
    const [cropList, setCropList] = useState<{ _id: string; cropName: string }[]>([]);

    const [overview, setOverview] = useState<{
        totalCustomers: number;
        totalCrops: number;
        totalReceivable: number;
        totalPayable: number;
    } | null>(null);
    const [commission, setCommission] = useState<{
        total: number;
        byMonth?: Record<number, number>;
    } | null>(null);
    const [loans, setLoans] = useState<{
        totalGiven: number;
        totalReturned: number;
        remaining: number;
    } | null>(null);

    const [loadingOverview, setLoadingOverview] = useState(false);
    const [loadingCommission, setLoadingCommission] = useState(false);
    const [loadingLoans, setLoadingLoans] = useState(false);
    const [loadingCrops, setLoadingCrops] = useState(false);
    const [posOwedTotal, setPosOwedTotal] = useState<number | null>(null);
    const [loadingPosOwed, setLoadingPosOwed] = useState(false);

    const debouncedYear = useDebouncedValue(year, 400);
    const debouncedQuarter = useDebouncedValue(quarter, 400);
    const debouncedCropId = useDebouncedValue(cropId, 400);

    useEffect(() => {
        dispatch(setPageTitle(t('dashboard_title')));
    }, [dispatch, t]);

    useEffect(() => {
        if (!shopId || !token) return;
        const ac = new AbortController();
        const { signal } = ac;
        setLoadingOverview(true);
        axios
            .post(
                `${ServerSetting.serUrl}/api/dashboard/overview`,
                { shopId: String(shopId) },
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true, signal }
            )
            .then((res) => {
                if (signal.aborted) return;
                const data = parseDashboardRes(res);
                setOverview(normalizeOverview(data));
            })
            .catch((err) => {
                if (isAbortError(err)) return;
                setOverview(normalizeOverview(null));
            })
            .finally(() => {
                if (!signal.aborted) setLoadingOverview(false);
            });
        return () => ac.abort();
    }, [shopId, token]);

    useEffect(() => {
        if (!shopId || !token) return;
        const ac = new AbortController();
        const { signal } = ac;
        setLoadingCrops(true);
        axios
            .post(
                `${ServerSetting.serUrl}/api/dashboard/crops`,
                { shopId: String(shopId) },
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true, signal }
            )
            .then((res) => {
                if (signal.aborted) return;
                const data = parseDashboardRes(res);
                setCropList(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                if (isAbortError(err)) return;
                setCropList([]);
            })
            .finally(() => {
                if (!signal.aborted) setLoadingCrops(false);
            });
        return () => ac.abort();
    }, [shopId, token]);

    /** Commission + loans share filters — one debounced round-trip, parallel requests, single abort. */
    useEffect(() => {
        if (!shopId || !token) return;
        const ac = new AbortController();
        const { signal } = ac;
        setLoadingCommission(true);
        setLoadingLoans(true);
        const body = {
            shopId: String(shopId),
            year: debouncedYear || undefined,
            quarter: debouncedQuarter || undefined,
            cropId: debouncedCropId || undefined,
        };
        const cfg = { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true, signal };
        Promise.all([
            axios.post(`${ServerSetting.serUrl}/api/dashboard/commission`, body, cfg),
            axios.post(`${ServerSetting.serUrl}/api/dashboard/loans`, body, cfg),
        ])
            .then(([resC, resL]) => {
                if (signal.aborted) return;
                const dataC = parseDashboardRes(resC);
                const dataL = parseDashboardRes(resL);
                setCommission(dataC || { total: 0, byMonth: {} });
                setLoans(dataL || { totalGiven: 0, totalReturned: 0, remaining: 0 });
            })
            .catch((err) => {
                if (isAbortError(err)) return;
                setCommission({ total: 0, byMonth: {} });
                setLoans({ totalGiven: 0, totalReturned: 0, remaining: 0 });
            })
            .finally(() => {
                if (!signal.aborted) {
                    setLoadingCommission(false);
                    setLoadingLoans(false);
                }
            });
        return () => ac.abort();
    }, [shopId, token, debouncedYear, debouncedQuarter, debouncedCropId]);

    useEffect(() => {
        if (!shopId || !token) return;
        const ac = new AbortController();
        const { signal } = ac;
        setLoadingPosOwed(true);
        axios
            .get(`${ServerSetting.apiUrl}/shop-owner-pos/outstanding`, {
                headers: { Authorization: `Bearer ${token}` },
                validateStatus: () => true,
                signal,
            })
            .then((res) => {
                if (signal.aborted) return;
                if (res.status !== 200 || !Array.isArray(res.data?.data)) {
                    setPosOwedTotal(null);
                    return;
                }
                const sum = res.data.data.reduce((s: number, row: { outstanding?: number }) => s + (Number(row.outstanding) || 0), 0);
                setPosOwedTotal(sum);
            })
            .catch((err) => {
                if (isAbortError(err)) return;
                setPosOwedTotal(null);
            })
            .finally(() => {
                if (!signal.aborted) setLoadingPosOwed(false);
            });
        return () => ac.abort();
    }, [shopId, token]);

    const chartColors = ['#10b981', '#34d399', '#f59e0b', '#3b82f6'];
    const axisLabelColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? '#142a40' : '#e2e8f0';
    const apexTheme = isDark ? 'dark' : 'light';

    const byMonth = commission?.byMonth || {};
    const commissionSeries = [{
        name: t('commission_series_name'),
        data: MONTHS.map((_, i) => Math.round((byMonth[i + 1] || 0) * 100) / 100),
    }];
    const commissionChartOptions: any = {
        chart: { type: 'bar', height: 280, toolbar: { show: false }, fontFamily: 'Inter, sans-serif', background: 'transparent' },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
        colors: [chartColors[0]],
        dataLabels: { enabled: false },
        xaxis: { categories: MONTHS, labels: { style: { colors: axisLabelColor } } },
        yaxis: {
            labels: {
                style: { colors: axisLabelColor },
                formatter: (val: number) => 'Rs. ' + (val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val),
            },
        },
        grid: { borderColor: gridColor, strokeDashArray: 5 },
        theme: { mode: apexTheme },
    };

    const totalGiven = loans?.totalGiven ?? 0;
    const totalReturned = loans?.totalReturned ?? 0;
    const loanChartSeries = totalGiven + totalReturned > 0 ? [totalGiven, totalReturned] : [1, 0];
    const loanChartOptions: any = {
        chart: { type: 'donut', height: 280, background: 'transparent' },
        labels: [t('loan_given'), t('loan_returned')],
        colors: [chartColors[2], chartColors[1]],
        legend: { position: 'bottom', labels: { colors: axisLabelColor } },
        dataLabels: { formatter: (val: number) => Math.round(val) + '%' },
        theme: { mode: apexTheme },
    };

    const formatRs = (n: number) =>
        'Rs. ' + (n ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    if (shopIdLoading && !shopId) {
        return (
            <div className={`${pageBg} min-h-full -m-4 p-4 md:-m-6 md:p-6`}>
                <div className={`${card} flex flex-col items-center justify-center py-20`} style={cardGlass}>
                    <span className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    <p className={mutedText}>{t('loading_dashboard')}</p>
                </div>
            </div>
        );
    }

    if (!shopId) {
        return (
            <div className={`${pageBg} min-h-full -m-4 p-4 md:-m-6 md:p-6`}>
                <div className={`${card} p-8 text-center`} style={cardGlass}>
                    <p className={`font-medium ${strongText}`}>{t('shop_not_found')}</p>
                    <p className={`mt-2 text-sm ${mutedText}`}>{t('contact_admin_shop_assigned')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${pageBg} min-h-full -m-4 p-4 md:-m-6 md:p-6 space-y-6`}>
            {/* Overview + Filters — merged into a single card */}
            <div className={`${card} relative overflow-hidden`} style={cardGlass}>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="mb-2 flex items-center gap-3 relative">
                    <span className={iconBadge}>
                        <IconMenuDashboard className="w-5 h-5" />
                    </span>
                    <h5 className={sectionHeading}>{t('overview')}</h5>
                </div>
                <p className={`mb-4 text-sm ${mutedText} relative`}>{t('shop_summary_desc')}</p>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 relative">
                    <AgriculturalCard
                        title={t('total_customers')}
                        value={loadingOverview ? '…' : (overview?.totalCustomers ?? 0)}
                        icon={<IconUsers className="w-6 h-6" />}
                        subtitle={t('registered_customers')}
                        color="success"
                    />
                    <AgriculturalCard
                        title={t('total_crops_card')}
                        value={loadingOverview ? '…' : (overview?.totalCrops ?? 0)}
                        icon={<IconTag className="w-6 h-6" />}
                        subtitle={t('assigned_in_use')}
                        color="crop"
                    />
                    <AgriculturalCard
                        title={t('paisa_lena_receivable')}
                        value={loadingOverview ? '…' : formatRs(overview?.totalReceivable ?? 0)}
                        icon={<IconTrendingUp className="w-6 h-6" />}
                        subtitle={t('customer_owes_to_shop')}
                        color="primary"
                    />
                    <AgriculturalCard
                        title={t('paisa_dena_payable')}
                        value={loadingOverview ? '…' : formatRs(overview?.totalPayable ?? 0)}
                        icon={<IconCashBanknotes className="w-6 h-6" />}
                        subtitle={t('shop_owes_to_customer')}
                        color="warning"
                    />
                </div>

                {/* Divider between overview stats and filters */}
                <div className={`${sectionDivider} relative`} />

                {/* Filters */}
                <div className="mb-4 flex items-center gap-3 relative">
                    <span className={iconBadge}>
                        <IconMenuCalendar className="w-5 h-5" />
                    </span>
                    <div>
                        <h5 className={sectionHeading}>{t('filter_year_quarter_crop')}</h5>
                        <p className={`text-xs ${mutedText}`}>{t('dashboard_filters_debounced_hint')}</p>
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3 relative">
                    <div className={filterBox}>
                        <label className={filterLabel}>
                            <IconMenuCalendar className="h-4 w-4 shrink-0 text-emerald-400" />
                            {t('year')}
                        </label>
                        <select value={year} onChange={(e) => setYear(e.target.value)} className={filterSelect}>
                            <option value="">{t('all_time')}</option>
                            {years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className={filterBox}>
                        <label className={filterLabel}>
                            <IconMenuCalendar className="h-4 w-4 shrink-0 text-emerald-400" />
                            {t('quarter_label')}
                        </label>
                        <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className={filterSelect}>
                            <option value="">{t('full_year')}</option>
                            <option value="1">{t('quarter_q1')}</option>
                            <option value="2">{t('quarter_q2')}</option>
                            <option value="3">{t('quarter_q3')}</option>
                            <option value="4">{t('quarter_q4')}</option>
                        </select>
                    </div>
                    <div className={filterBox}>
                        <label className={filterLabel}>
                            <IconTag className="h-4 w-4 shrink-0 text-emerald-400" />
                            {t('crop')}
                        </label>
                        <select
                            value={cropId}
                            onChange={(e) => setCropId(e.target.value)}
                            className={filterSelect}
                            disabled={loadingCrops}
                        >
                            <option value="">{t('view_all_crops')}</option>
                            {cropList.map((c) => (
                                <option key={c._id} value={c._id}>{c.cropName}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Commission, Loans & POS dues — merged into a single card */}
            <div className={card} style={cardGlass}>
                {posOwedTotal !== null && (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
                            <div className="flex items-center gap-3">
                                <span className={iconBadge}>
                                    <IconCashBanknotes className="w-5 h-5" />
                                </span>
                                <div>
                                    <h5 className={sectionHeading}>{t('dashboard_pos_total_owed')}</h5>
                                    <p className={`text-sm ${mutedText}`}>{t('dashboard_pos_total_owed_desc')}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <p className={`text-2xl font-bold ${emeraldValueText}`}>
                                    {loadingPosOwed ? '…' : formatRs(posOwedTotal)}
                                </p>
                                <Link
                                    to="/pos-payments"
                                    className="inline-flex items-center justify-center shrink-0 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition duration-150 shadow-lg shadow-emerald-950/40"
                                >
                                    {t('dashboard_pos_record_payments')}
                                </Link>
                            </div>
                        </div>
                        <div className={sectionDivider} />
                    </>
                )}

                <div className="grid gap-6 xl:grid-cols-2">
                    {/* Commission */}
                    <div>
                        <div className="mb-4 flex items-center gap-3">
                            <span className={iconBadge}>
                                <IconTrendingUp className="w-5 h-5" />
                            </span>
                            <h5 className={sectionHeading}>
                                {t('commission_panel_title')} {year}{quarter ? ` Q${quarter}` : ''} {cropId ? `(${t('crop_filter_label')})` : `(${t('all_crops_filter')})`}
                            </h5>
                        </div>
                        {loadingCommission ? (
                            <div className="flex h-[280px] items-center justify-center">
                                <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                            </div>
                        ) : (
                            <>
                                <p className={`mb-4 text-2xl font-bold ${emeraldValueText}`}>
                                    {t('total_label')}: {formatRs(commission?.total ?? 0)}
                                </p>
                                {commissionSeries[0].data.some((d: number) => d > 0) ? (
                                    <ReactApexChart series={commissionSeries} options={commissionChartOptions} type="bar" height={280} />
                                ) : (
                                    <div className={`flex h-[260px] items-center justify-center rounded-2xl border border-dashed ${isDark ? 'border-[#1b3650] bg-[#081522]/40' : 'border-emerald-200 bg-white'} ${mutedText}`}>
                                        {t('no_commission_data')}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Loans */}
                    <div className={`xl:border-l ${dividerBorder} xl:pl-6`}>
                        <div className="mb-4 flex items-center gap-3">
                            <span className={iconBadge}>
                                <IconCashBanknotes className="w-5 h-5" />
                            </span>
                            <h5 className={sectionHeading}>
                                {t('loans_panel_title')} {year ? `${year}${quarter ? ` Q${quarter}` : ''}` : t('all_time_label')} {cropId ? `(${t('crop_filter_label')})` : `(${t('all_crops_filter')})`}
                            </h5>
                        </div>
                        {loadingLoans ? (
                            <div className="flex h-[280px] items-center justify-center">
                                <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 grid grid-cols-3 gap-2">
                                    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3">
                                        <p className={`text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{t('given')}</p>
                                        <p className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{formatRs(totalGiven)}</p>
                                    </div>
                                    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3">
                                        <p className={`text-xs font-medium ${emeraldValueText}`}>{t('returned')}</p>
                                        <p className={`font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{formatRs(totalReturned)}</p>
                                    </div>
                                    <div className={`rounded-2xl border ${isDark ? 'border-[#1b3650] bg-[#081522]/60' : 'border-slate-200 bg-white'} p-3`}>
                                        <p className={`text-xs font-medium ${mutedText}`}>{t('remaining')}</p>
                                        <p className={`font-bold ${strongText}`}>{formatRs(loans?.remaining ?? 0)}</p>
                                    </div>
                                </div>
                                {totalGiven + totalReturned > 0 ? (
                                    <ReactApexChart series={loanChartSeries} options={loanChartOptions} type="donut" height={260} />
                                ) : (
                                    <div className={`flex h-[220px] items-center justify-center rounded-2xl border border-dashed ${isDark ? 'border-[#1b3650] bg-[#081522]/40' : 'border-emerald-200 bg-white'} ${mutedText}`}>
                                        {t('no_loan_data')}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className={card} style={cardGlass}>
                <div className="mb-4 flex items-center gap-3">
                    <span className={iconBadge}>
                        <IconTag className="w-5 h-5" />
                    </span>
                    <h5 className={sectionHeading}>{t('quick_actions_title')}</h5>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <QuickActionButton to="/getassginshopcrops" icon={<IconPlus className="w-6 h-6" />} label={t('new_order')} description={t('crop_select_receipt')} color="primary" />
                    <QuickActionButton to="/addnewcustomer" icon={<IconUser className="w-6 h-6" />} label={t('add_customer')} description={t('naya_customer_register')} color="success" />
                    <QuickActionButton to="/getassginshopcrops" icon={<IconTag className="w-6 h-6" />} label={t('my_crops')} description={t('crops_and_receipts')} color="primary" />
                    <QuickActionButton to="/customerbalance" icon={<IconFile className="w-6 h-6" />} label={t('customer_balance')} description={t('balance_customer_return')} color="success" />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;