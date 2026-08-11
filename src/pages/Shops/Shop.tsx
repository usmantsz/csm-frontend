import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import sortBy from 'lodash/sortBy';
import { DataTableSortStatus } from 'mantine-datatable';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { Notification } from './../../helperComponents/Notification';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { setPageTitle } from '../../store/themeConfigSlice';
import TableCard from './../../components/Agricultural/TableCard';
import { FaEye } from 'react-icons/fa';
import IconShop from '../../components/Icon/Menu/IconMenuShop';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';

interface Shop {
    _id: string;
    shopName: string;
    shopUserId: string;
    shopNumber: string;
    shopAddress: string;
    shopProvince: string;
    shopCity: string;
    shopRegistrationNumber: string;
    shopBillImageTop: string;
    shopStatus: string;
    createdAt: string;
    updatedAt: string;
}

const Shop = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useAuthToken();

    useEffect(() => {
        dispatch(setPageTitle(t('all_shops')));
    }, [dispatch, t]);

    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Shop[]>([]);
    const [recordsData, setRecordsData] = useState<Shop[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'shopName',
        direction: 'asc',
    });

    // Fetch shops
    useEffect(() => {
        const fetchShops = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get(`${ServerSetting.serUrl}/api/allviewshop`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (response.status === 200 && response.data.status === 200) {
                    setInitialRecords(response.data.data || []);
                } else {
                    Notification({ text: response.data.message || 'Failed to fetch shops', color: 'danger' });
                }
            } catch (error: any) {
                console.error('Error fetching shops:', error);
                Notification({ text: error.response?.data?.message || 'Error fetching shops', color: 'danger' });
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchShops();
        }
    }, [token]);

    // Pagination
    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    // Search and filter
    useEffect(() => {
        let filtered = initialRecords;

        if (search) {
            const lower = search.toLowerCase();
            filtered = filtered.filter((item) => {
                return (
                    item.shopName?.toLowerCase().includes(lower) ||
                    item.shopNumber?.toLowerCase().includes(lower) ||
                    item.shopRegistrationNumber?.toLowerCase().includes(lower) ||
                    item.shopCity?.toLowerCase().includes(lower) ||
                    item.shopProvince?.toLowerCase().includes(lower) ||
                    item.shopAddress?.toLowerCase().includes(lower)
                );
            });
        }

        // Apply sorting
        const sortedData = sortBy(filtered, sortStatus.columnAccessor);
        const finalData = sortStatus.direction === 'desc' ? sortedData.reverse() : sortedData;

        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...finalData.slice(from, to)]);
    }, [search, initialRecords, page, pageSize, sortStatus]);

    // Handle view shop
    const handleViewShop = (shop: Shop) => {
        // Navigate to shop view page with shopId
        navigate(`/shop/view/${shop._id}`);
    };

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const columns = [
        {
            accessor: 'shopBillImageTop',
            title: t('image'),
            textAlignment: 'center',
            render: ({ shopBillImageTop }: Shop) => (
                <div className="flex items-center justify-center">
                    {shopBillImageTop ? (
                        <img
                            src={`${ServerSetting.serUrl}/shop/${shopBillImageTop}`}
                            className="h-10 w-10 rounded-full object-cover border-2 border-primary-200"
                            alt="Shop"
                            onError={(e: any) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div
                        className="h-10 w-10 rounded-full border-2 border-primary-200 bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center"
                        style={{ display: shopBillImageTop ? 'none' : 'flex' }}
                    >
                        <IconShop className="w-5 h-5 text-primary-600" />
                    </div>
                </div>
            ),
        },
        {
            accessor: 'shopName',
            title: t('shop_name'),
            sortable: true,
            textAlignment: 'left',
            render: ({ shopName }: Shop) => (
                <div className="font-semibold text-primary-600 dark:text-primary-400">
                    {shopName || '-'}
                </div>
            ),
        },
        {
            accessor: 'shopRegistrationNumber',
            title: t('registration_number'),
            sortable: true,
            textAlignment: 'center',
            render: ({ shopRegistrationNumber }: Shop) => (
                <span className="font-mono text-sm" dir="ltr">{shopRegistrationNumber || '-'}</span>
            ),
        },
        {
            accessor: 'shopNumber',
            title: t('phone_number'),
            sortable: true,
            textAlignment: 'center',
            render: ({ shopNumber }: Shop) => (
                <span className="font-mono" dir="ltr">{shopNumber || '-'}</span>
            ),
        },
        {
            accessor: 'shopCity',
            title: t('city'),
            sortable: true,
            textAlignment: 'left',
            render: ({ shopCity, shopProvince }: Shop) => (
                <div>
                    <div className="font-medium">{shopCity || '-'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{shopProvince || ''}</div>
                </div>
            ),
        },
        {
            accessor: 'shopStatus',
            title: t('status'),
            sortable: true,
            textAlignment: 'center',
            render: ({ shopStatus }: Shop) => (
                <span
                    className={`badge ${
                        shopStatus === '0' || shopStatus === 0
                            ? 'badge-outline-success'
                            : 'badge-outline-danger'
                    }`}
                >
                    {shopStatus === '0' || shopStatus === 0 ? t('active') : t('inactive')}
                </span>
            ),
        },
        {
            accessor: 'createdAt',
            title: t('created_date'),
            sortable: true,
            textAlignment: 'center',
            render: ({ createdAt }: Shop) => (
                <span className="text-sm">{formatDate(createdAt)}</span>
            ),
        },
        {
            accessor: 'actions',
            title: t('actions'),
            textAlignment: 'center',
            render: (shop: Shop) => (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleViewShop(shop)}
                        className="btn btn-sm flex items-center gap-2 !bg-[#16a34a] !text-white !border-[#16a34a] hover:!bg-[#15803d] !shadow-none"
                        title={t('view_shop_details')}
                    >
                        <FaEye className="w-4 h-4" />
                        {t('view')}
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <TableCard
                title={t('shops_list')}
                description=""
                data={recordsData}
                columns={columns}
                loading={isLoading}
                page={page}
                pageSize={pageSize}
                totalRecords={initialRecords.length}
                onPageChange={setPage}
                onRecordsPerPageChange={setPageSize}
                sortStatus={sortStatus}
                onSortStatusChange={setSortStatus}
                recordsPerPageOptions={PAGE_SIZES}
                emptyMessage={t('no_shops_found')}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder={t('search_shop_placeholder')}
                className="shadow-lg hover:shadow-xl transition-shadow"
                actions={
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                    >
                        <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        {t('back_to_dashboard')}
                    </button>
                }
            />
        </div>
    );
};

export default Shop;
