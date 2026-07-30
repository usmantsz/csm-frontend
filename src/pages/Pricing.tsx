import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ServerSetting } from '../helperComponents/ServerSetting';

interface ProvincesCities {
    provinces: string[];
    cities: Record<string, string[]>;
}

interface CropOption {
    _id: string;
    cropName: string;
}

interface PricingRow {
    province: string;
    city: string;
    cropId: string;
    cropName: string;
    minRate: number;
    maxRate: number;
    avgRate: number;
    count: number;
}

const Pricing = () => {
    const [provincesCities, setProvincesCities] = useState<ProvincesCities | null>(null);
    const [crops, setCrops] = useState<CropOption[]>([]);
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
    const [province, setProvince] = useState('');
    const [city, setCity] = useState('');
    const [cropId, setCropId] = useState('');
    const [data, setData] = useState<PricingRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingFilters, setLoadingFilters] = useState(true);

    useEffect(() => {
        Promise.all([
            axios.get(`${ServerSetting.serUrl}/api/public/provinces-cities`, { validateStatus: () => true }),
            axios.get(`${ServerSetting.serUrl}/api/public/crops`, { validateStatus: () => true }),
        ]).then(([resPc, resCrops]) => {
            if (resPc.data?.success && resPc.data?.data) setProvincesCities(resPc.data.data);
            if (resCrops.data?.success && Array.isArray(resCrops.data.data)) setCrops(resCrops.data.data);
            setLoadingFilters(false);
        });
    }, []);

    const cities = province && provincesCities?.cities?.[province] ? provincesCities.cities[province] : [];

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('period', period);
        if (province) params.set('province', province);
        if (city) params.set('city', city);
        if (cropId) params.set('cropId', cropId);
        axios
            .get(`${ServerSetting.serUrl}/api/public/pricing?${params.toString()}`, { validateStatus: () => true })
            .then((res) => {
                if (res.data?.success && Array.isArray(res.data.data)) setData(res.data.data);
                else setData([]);
            })
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    }, [period, province, city, cropId]);

    const formatRs = (n: number) =>
        'Rs. ' + (n ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="min-h-screen bg-[#f8faf9] dark:from-[#0b0f0d] dark:to-[#121816] dark:bg-gradient-to-b text-gray-800 dark:text-gray-100">
            <header className="sticky top-0 z-20 border-b border-black/5 dark:border-white/10 bg-white/85 dark:bg-[#0e1726]/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className="rounded-lg border border-black/10 dark:border-white/10 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
                        >
                            Back to Home
                        </Link>
                        <Link to="/" className="flex items-center gap-3">
                            <img
                                src="/assets/images/logo.svg"
                                alt="Commission Shop"
                                className="h-10 w-10 object-contain rounded-xl ring-1 ring-black/5 dark:ring-white/10"
                            />
                            <div>
                                <p className="text-base font-bold text-primary">Commission Shop</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Pricing & market view</p>
                            </div>
                        </Link>
                    </div>
                    <nav className="flex items-center gap-2">
                        <Link
                            to="/"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-primary/5 hover:text-primary dark:text-gray-300 dark:hover:text-primary"
                        >
                            Home
                        </Link>
                        <Link
                            to="/pricing"
                            className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                        >
                            Pricing
                        </Link>
                        <Link
                            to="/shopowner-login"
                            className="btn btn-primary btn-sm px-4"
                        >
                            Login
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                {/* Compact heading — no big hero panel */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                        Crop Pricing – Pakistan (Province & City)
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Order/receipt data ke base par crop rates (low, high, average). Province, city aur daily/weekly/monthly filter lagayein.
                    </p>
                </div>

                <section className="panel rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#0e1726] p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Market filters</p>
                            <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">Refine the pricing view</h2>
                        </div>
                        <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-400">
                            Filter the results by period, province, city, and crop to view the market data that matters most.
                        </p>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {loadingFilters ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 sm:col-span-2 lg:col-span-4">Loading filters…</p>
                        ) : (
                            <>
                                <div>
                                    <label className="form-label text-sm font-medium text-gray-700 dark:text-gray-300">Period</label>
                                    <select
                                        value={period}
                                        onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
                                        className="form-select w-full border-primary-300 dark:border-primary-600"
                                    >
                                        <option value="day">Current day</option>
                                        <option value="week">Current week</option>
                                        <option value="month">Current month</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label text-sm font-medium text-gray-700 dark:text-gray-300">Province</label>
                                    <select
                                        value={province}
                                        onChange={(e) => { setProvince(e.target.value); setCity(''); }}
                                        className="form-select w-full border-primary-300 dark:border-primary-600"
                                    >
                                        <option value="">All</option>
                                        {(provincesCities?.provinces || []).map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                                    <select
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="form-select w-full border-primary-300 dark:border-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={!province || cities.length === 0}
                                    >
                                        <option value="">All</option>
                                        {cities.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label text-sm font-medium text-gray-700 dark:text-gray-300">Crop</label>
                                    <select
                                        value={cropId}
                                        onChange={(e) => setCropId(e.target.value)}
                                        className="form-select w-full border-primary-300 dark:border-primary-600"
                                    >
                                        <option value="">All crops</option>
                                        {crops.map((c) => (
                                            <option key={c._id} value={c._id}>{c.cropName}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-6 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
                        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 bg-primary/5 dark:bg-primary/10 px-4 py-4 sm:px-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rates</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {period === 'day' ? 'Today' : period === 'week' ? 'This week' : 'This month'}
                                </p>
                            </div>
                            <div className="rounded-full bg-white dark:bg-[#0e1726] px-3 py-1 text-sm font-medium text-primary shadow-sm">
                                {data.length} result{data.length === 1 ? '' : 's'}
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading pricing data…</p>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                No rate data for the selected filters. Try changing province, city, or period.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-primary/10 dark:bg-primary/20 text-sm font-semibold text-gray-900 dark:text-white">
                                            <th className="p-3">Province</th>
                                            <th className="p-3">City</th>
                                            <th className="p-3">Crop</th>
                                            <th className="p-3">Min (Rs.)</th>
                                            <th className="p-3">Max (Rs.)</th>
                                            <th className="p-3">Avg (Rs.)</th>
                                            <th className="p-3">Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((row, i) => (
                                            <tr key={i} className="border-t border-black/5 dark:border-white/10 text-sm text-gray-700 hover:bg-primary/[0.03] dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/[0.03]">
                                                <td className="p-3">{row.province}</td>
                                                <td className="p-3">{row.city}</td>
                                                <td className="p-3 font-medium text-gray-900 dark:text-white">{row.cropName}</td>
                                                <td className="p-3">{formatRs(row.minRate)}</td>
                                                <td className="p-3">{formatRs(row.maxRate)}</td>
                                                <td className="p-3 font-medium text-primary">{formatRs(row.avgRate)}</td>
                                                <td className="p-3">{row.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Pricing;
