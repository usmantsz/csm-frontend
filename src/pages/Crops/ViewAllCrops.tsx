import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { useAuthToken } from './../../Hooks/useAuthToken';
import axios from 'axios';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconPencil from '../../components/Icon/IconPencil';
import IconPlus from '../../components/Icon/IconPlus';
import IconSearch from '../../components/Icon/IconSearch';
import IconTag from '../../components/Icon/IconTag';
import { CROP_TYPE_OPTIONS, normalizeCropType } from '../../constants/cropTypes';

const card =
    'rounded-[2rem] border border-white-light bg-white/95 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#0b1526]/85';

interface Crop {
    _id: string;
    cropName: string;
    cropType?: string;
    cropImage?: string;
    cropStatus?: number | string;
}

const ViewAllCrops = () => {
    const { t } = useTranslation();
    const [cropData, setCropData] = useState<Crop[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [cropTypeFilter, setCropTypeFilter] = useState('');
    const navigate = useNavigate();
    const { token } = useAuthToken();

    useEffect(() => {
        const fetchCropData = async () => {
            if (!token) return;
            setLoading(true);
            try {
                const response = await axios.get(`${ServerSetting.serUrl}/api/allviewcrop`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data.status === 200) {
                    setCropData(Array.isArray(response.data.data) ? response.data.data : []);
                } else {
                    setCropData([]);
                }
            } catch (error) {
                console.error('Error fetching crop data:', error);
                setCropData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchCropData();
    }, [token]);

    const cropImageUrl = (crop: Crop) =>
        crop.cropImage ? `${ServerSetting.serUrl}/crop/${crop.cropImage}` : '';

    const filteredCrops = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const typeFilter = cropTypeFilter.trim();
        return cropData.filter((crop) => {
            const type = normalizeCropType(crop.cropType);
            if (typeFilter && type !== typeFilter) return false;
            if (q && !crop.cropName?.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [cropData, searchQuery, cropTypeFilter]);

    return (
        <div className="space-y-6">
            <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
            >
                <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('back_to_dashboard')}
            </button>

            {/* Search + filter card, with heading + add-new-crop button inside */}
            <div className={card}>
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-success sm:text-2xl">{t('all_crops_page')}</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('all_crops_desc')}</p>
                    </div>
                    <Link
                        to="/addnewcrop"
                        className="inline-flex items-center gap-2 self-start rounded-2xl bg-success px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-success/90"
                    >
                        <IconPlus className="w-4 h-4" />
                        {t('add_new_crop_page')}
                    </Link>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-white-light pt-4 dark:border-white/10">
                    <div className="relative min-w-[200px] flex-1">
                        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search crops by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="form-input w-full pl-10"
                        />
                    </div>
                    <div className="w-full min-w-[180px] sm:w-auto">
                        <select
                            value={cropTypeFilter}
                            onChange={(e) => setCropTypeFilter(e.target.value)}
                            className="form-select w-full"
                        >
                            {CROP_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value || 'all'} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="whitespace-nowrap rounded-xl bg-success/10 px-3 py-1.5 text-sm font-medium text-success dark:bg-success/20">
                        {filteredCrops.length} of {cropData.length} crop{cropData.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className={`${card} flex flex-col items-center justify-center py-16`}>
                    <div className="mb-4 h-14 w-14 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="font-medium text-gray-600 dark:text-gray-400">{t('loading_crops')}</p>
                </div>
            ) : cropData.length === 0 ? (
                <div className={`${card} py-16 text-center`}>
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-50 text-4xl dark:bg-white/5">
                        🌾
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-200">{t('no_crops_yet')}</h3>
                    <p className="mx-auto mb-6 max-w-md text-gray-500 dark:text-gray-400">
                        {t('add_first_crop_desc')}
                    </p>
                    <Link
                        to="/addnewcrop"
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                    >
                        <IconPlus className="w-4 h-4" />
                        {t('add_new_crop_page')}
                    </Link>
                </div>
            ) : filteredCrops.length === 0 ? (
                <div className={`${card} py-12 text-center`}>
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/5">
                        <IconTag className="h-6 w-6 text-primary/60" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No crops match your search or filter.</p>
                    <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setCropTypeFilter(''); }}
                        className="mt-3 rounded-2xl border border-white-light bg-white/80 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {filteredCrops.map((crop) => (
                        <div
                            key={crop._id}
                            className="group flex flex-col overflow-hidden rounded-[1.75rem] border-2 border-white-light bg-white/95 p-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl dark:border-white/10 dark:bg-[#0b1526]/60 dark:hover:border-primary-700"
                        >
                            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10">
                                {cropImageUrl(crop) ? (
                                    <img
                                        src={cropImageUrl(crop)}
                                        alt={crop.cropName}
                                        className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="absolute inset-0 flex items-center justify-center bg-primary-50/80 text-6xl text-primary-300 dark:bg-primary-900/30 dark:text-primary-600"
                                    style={{ display: cropImageUrl(crop) ? 'none' : 'flex' }}
                                >
                                    🌾
                                </div>
                                {(normalizeCropType(crop.cropType)) && (
                                    <span className="absolute right-3 top-3 rounded-lg border border-primary-200 bg-white/90 px-2 py-1 text-xs font-medium text-primary-700 shadow-sm dark:border-primary-700 dark:bg-[#0b1526]/80 dark:text-primary-300">
                                        {normalizeCropType(crop.cropType)}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col p-5">
                                <h3 className="mb-3 min-h-[3.5rem] line-clamp-2 text-lg font-bold text-gray-800 dark:text-white">
                                    {crop.cropName}
                                </h3>
                                <div className="mt-auto">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/editcrop/${crop._id}`)}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                                    >
                                        <IconPencil className="w-4 h-4" />
                                        Edit Crop
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ViewAllCrops;