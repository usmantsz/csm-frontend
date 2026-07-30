import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { IRootState } from '../../store';
import PageHeader from '../../components/Agricultural/PageHeader';
import ReactApexChart from 'react-apexcharts';
import axios from 'axios';

type ChartPeriod = 'day' | 'week' | 'month' | 'year';

const PosDashboard = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const [shop, setShop] = useState<{ shopName?: string; subscriptionExpireDate?: string } | null>(null);
    const [stats, setStats] = useState<{
        todaySales: number;
        todayReturns: number;
        todayPaymentsReceived: number;
        netAfterReturns: number;
        totalProducts: number;
        lowStockCount: number;
    }>({ todaySales: 0, todayReturns: 0, todayPaymentsReceived: 0, netAfterReturns: 0, totalProducts: 0, lowStockCount: 0 });
    const [loading, setLoading] = useState(true);
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('day');
    const [chartData, setChartData] = useState<{ labels: string[]; sales: number[]; returns: number[] }>({ labels: [], sales: [], returns: [] });
    const [chartLoading, setChartLoading] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('pos_dashboard_title')));
    }, [dispatch, t, i18n.language]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        Promise.all([
            axios.get(`${ServerSetting.apiUrl}/pos/my-shop`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
            axios.get(`${ServerSetting.apiUrl}/pos/dashboard-stats`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
            axios.get(`${ServerSetting.apiUrl}/pos/products?limit=500`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
        ]).then(([shopRes, statsRes, productsRes]) => {
            if (shopRes.data?.data) setShop(shopRes.data.data);
            const d = statsRes.data?.data || {};
            const list = productsRes.data?.data || [];
            const totalProducts = list.length;
            const lowStockCount = list.filter((p: { stock?: number; lowStockThreshold?: number }) => (p.stock ?? 0) <= (p.lowStockThreshold ?? 5)).length;
            setStats({
                todaySales: d.todaySales ?? 0,
                todayReturns: d.todayReturns ?? 0,
                todayPaymentsReceived: d.todayPaymentsReceived ?? 0,
                netAfterReturns: d.netAfterReturns ?? 0,
                totalProducts,
                lowStockCount,
            });
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const fetchChart = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setChartLoading(true);
        axios
            .get(`${ServerSetting.apiUrl}/pos/sales/chart?groupBy=${chartPeriod}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((r) => {
                const d = r.data?.data;
                if (d?.labels) setChartData({
                    labels: d.labels,
                    sales: d.sales ?? d.data ?? [],
                    returns: d.returns ?? [],
                });
            })
            .catch(() => {})
            .finally(() => setChartLoading(false));
    }, [chartPeriod]);

    useEffect(() => {
        fetchChart();
    }, [fetchChart]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <span className="animate-spin inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('pos_dashboard_title')}
                description={shop?.shopName || t('pos_dashboard_subtitle_default')}
                rightContent={
                    <Link to="/pos/sale" className="btn btn-outline-white">
                        {t('pos_dashboard_new_sale_btn')}
                    </Link>
                }
                icon={<span>🧾</span>}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                <div className="panel bg-gradient-to-br from-primary-500 to-primary-700 text-white p-6 rounded-2xl shadow-lg border-0">
                    <p className="text-primary-100 text-sm font-semibold uppercase tracking-wide">{t('pos_stat_today_sales_net')}</p>
                    <p className="text-3xl font-bold mt-2">Rs {stats.todaySales.toLocaleString()}</p>
                    <Link to="/pos/sales-history" className="text-primary-100 text-sm mt-3 inline-flex items-center gap-1 hover:underline font-medium">{t('pos_view_history')}</Link>
                </div>
                <div className="panel bg-white dark:bg-[#0e1726] p-6 rounded-2xl shadow-sm border border-white-dark/10 dark:border-white/5">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wide">{t('pos_stat_today_returns')}</p>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">Rs {stats.todayReturns.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('pos_stat_refunds_today')}</p>
                </div>
                <div className="panel bg-white dark:bg-[#0e1726] p-6 rounded-2xl shadow-sm border border-white-dark/10 dark:border-white/5">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wide">{t('pos_stat_payments_received')}</p>
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">Rs {stats.todayPaymentsReceived.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('pos_stat_credit_today')}</p>
                </div>
                <div className="panel bg-white dark:bg-[#0e1726] p-6 rounded-2xl shadow-sm border border-white-dark/10 dark:border-white/5">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wide">{t('pos_stat_net_after_returns')}</p>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">Rs {stats.netAfterReturns.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('pos_stat_sales_minus_returns')}</p>
                </div>
                <div className="panel bg-white dark:bg-[#0e1726] p-6 rounded-2xl shadow-sm border border-white-dark/10 dark:border-white/5 flex flex-col justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wide">{t('pos_stat_products_low')}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{stats.totalProducts} <span className="text-amber-600 dark:text-amber-400">({stats.lowStockCount} {t('pos_stat_low_suffix')})</span></p>
                    <div className="flex gap-2 mt-3">
                        <Link to="/pos/products" className="text-primary-600 dark:text-primary-400 text-sm hover:underline font-medium">{t('pos_link_products')}</Link>
                        {stats.lowStockCount > 0 && <Link to="/pos/products?lowStock=1" className="text-amber-600 text-sm hover:underline font-medium">{t('pos_link_low_stock')}</Link>}
                    </div>
                </div>
            </div>

            {/* Sales chart - Day / Week / Month / Year */}
            <div className="panel bg-white dark:bg-[#0e1726] p-5 rounded-2xl border border-white-dark/10 shadow-sm dark:border-white/5">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('pos_sales_overview')}</h2>
                    <div className="flex gap-2">
                        {(['day', 'week', 'month', 'year'] as ChartPeriod[]).map((p) => (
                            <button
                                key={p}
                                type="button"
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${chartPeriod === p ? 'bg-primary-600 text-white' : 'bg-white-dark/10 dark:bg-white/5 hover:bg-white-dark/20 dark:hover:bg-white/10'}`}
                                onClick={() => setChartPeriod(p)}
                            >
                                {p === 'day' ? t('pos_period_day') : p === 'week' ? t('pos_period_week') : p === 'month' ? t('pos_period_month') : t('pos_period_year')}
                            </button>
                        ))}
                    </div>
                </div>
                {chartLoading ? (
                    <div className="flex justify-center py-12">
                        <span className="animate-spin inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
                    </div>
                ) : !chartData.labels?.length ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-sm font-medium">{t('pos_chart_no_data')}</p>
                        <p className="text-xs mt-1">{t('pos_chart_hint')}</p>
                    </div>
                ) : (
                    <div className="rounded-lg bg-white dark:bg-transparent overflow-hidden">
                        <ReactApexChart
                            series={[
                                { name: t('pos_chart_series_sales'), data: chartData.sales },
                                { name: t('pos_chart_series_returns'), data: chartData.returns },
                            ]}
                            options={{
                                chart: {
                                    height: 300,
                                    type: 'line',
                                    toolbar: { show: false },
                                    zoom: { enabled: false },
                                    background: 'transparent',
                                    foreColor: isDark ? '#94a3b8' : '#475569',
                                },
                                colors: ['#2d8659', '#f59e0b'],
                                dataLabels: { enabled: false },
                                tooltip: {
                                    theme: isDark ? 'dark' : 'light',
                                    y: {
                                        formatter: (val: number) => 'Rs ' + (val != null ? Number(val).toLocaleString() : '0'),
                                    },
                                },
                                stroke: {
                                    width: 2,
                                    curve: 'smooth',
                                },
                                xaxis: {
                                    categories: chartData.labels,
                                    labels: {
                                        style: { colors: isDark ? '#94a3b8' : '#475569', fontSize: '12px' },
                                        formatter: (val: string) => {
                                            if (chartPeriod === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                                                const d = new Date(val + 'T12:00:00');
                                                return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
                                            }
                                            if (chartPeriod === 'week' && /^\d{4}-W\d{2}$/.test(val)) {
                                                const [, w] = val.split('-W');
                                                return `W${parseInt(w, 10)}`;
                                            }
                                            if (chartPeriod === 'month' && /^\d{4}-\d{2}$/.test(val)) {
                                                const [y, m] = val.split('-');
                                                return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-PK', { month: 'short', year: '2-digit' });
                                            }
                                            if (chartPeriod === 'year' && /^\d{4}$/.test(val)) return val;
                                            return val;
                                        },
                                    },
                                    axisBorder: {
                                        color: isDark ? '#191e3a' : '#e0e6ed',
                                    },
                                },
                                yaxis: {
                                    labels: {
                                        style: { colors: isDark ? '#94a3b8' : '#475569', fontSize: '12px' },
                                        formatter: (val: number) => 'Rs ' + (val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val),
                                    },
                                },
                                grid: {
                                    borderColor: isDark ? '#191e3a' : '#e0e6ed',
                                    strokeDashArray: 4,
                                    xaxis: { lines: { show: false } },
                                    yaxis: { lines: { show: true } },
                                },
                                legend: {
                                    show: true,
                                    position: 'top',
                                    horizontalAlign: 'right',
                                    fontSize: '12px',
                                    markers: { width: 10, height: 10, radius: 2 },
                                },
                            }}
                            type="line"
                            height={300}
                        />
                    </div>
                )}
            </div>

            {shop?.subscriptionExpireDate && (
                <div className="panel p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                        {t('pos_sub_expires', { date: new Date(shop.subscriptionExpireDate).toLocaleDateString() })}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PosDashboard;
