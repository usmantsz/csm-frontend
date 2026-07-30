import { useEffect, useState, Fragment } from 'react';
import sortBy from 'lodash/sortBy';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { FaEye, FaEdit, FaBan, FaHistory } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { confirmStatusChange, showSuccess, showError, showLoading, closeAlert } from '../../utils/sweetAlert';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../components/Icon/IconX';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconSearch from '../../components/Icon/IconSearch';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { useTranslation } from 'react-i18next';

const card =
    'rounded-[2rem] border border-green-200 bg-white/95 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-green-800 dark:bg-[#0b1526]/85';

type PosShopRecord = {
    _id: string;
    shopName: string;
    shopRegistrationNumber?: string;
    shopPhone?: string;
    shopAddress?: string;
    status: number;
    subscriptionStartDate?: string;
    subscriptionExpireDate?: string;
    shopOwnerId?: {
        _id: string;
        userNameF?: string;
        userNameL?: string;
        userEmail?: string;
        userPhone?: string | number;
        userCNIC?: string | number;
        userAdress?: string;
        userProvince?: string;
        userCity?: string;
        userProfileImage?: string;
    };
    posSubscriptionId?: { name?: string; durationDays?: number; price?: number };
};

const PosOwnersList = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const [list, setList] = useState<PosShopRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [recordsData, setRecordsData] = useState<PosShopRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<PosShopRecord[]>([]);
    const [search, setSearch] = useState('');
    const [viewModal, setViewModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState<PosShopRecord | null>(null);
    const [subHistoryModal, setSubHistoryModal] = useState(false);
    const [subHistoryRow, setSubHistoryRow] = useState<PosShopRecord | null>(null);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'shopName',
        direction: 'asc',
    });

    useEffect(() => {
        dispatch(setPageTitle('POS Owners'));
    }, [dispatch]);

    useEffect(() => {
        if (!token) return;
        setIsLoading(true);
        axios
            .get(`${ServerSetting.apiUrl}/pesticide-pos/shops`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => {
                if (r.data?.status === 200 && Array.isArray(r.data.data)) {
                    setList(r.data.data);
                    setFilteredRecords(r.data.data);
                }
            })
            .catch(() => Notification({ text: 'Failed to load POS owners', color: 'danger' }))
            .finally(() => setIsLoading(false));
    }, [token]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        let filtered = list;
        if (search.trim()) {
            const s = search.toLowerCase();
            filtered = list.filter((row) => {
                const o = row.shopOwnerId;
                const name = [o?.userNameF, o?.userNameL].filter(Boolean).join(' ').toLowerCase();
                const email = (o?.userEmail || '').toString().toLowerCase();
                const phone = (o?.userPhone ?? '').toString().toLowerCase();
                const cnic = (o?.userCNIC ?? '').toString().toLowerCase();
                const shopName = (row.shopName || '').toLowerCase();
                return name.includes(s) || email.includes(s) || phone.includes(s) || cnic.includes(s) || shopName.includes(s);
            });
        }
        const sorted = sortBy(filtered, sortStatus.columnAccessor as keyof PosShopRecord);
        const ordered = sortStatus.direction === 'desc' ? sorted.reverse() : sorted;
        setFilteredRecords(ordered);
    }, [list, search, sortStatus]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        setRecordsData(filteredRecords.slice(from, from + pageSize));
    }, [filteredRecords, page, pageSize]);

    const formatDate = (d: string | Date | null | undefined) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getOwnerName = (row: PosShopRecord) => {
        const o = row.shopOwnerId;
        if (!o) return '—';
        return [o.userNameF, o.userNameL].filter(Boolean).join(' ') || '—';
    };

    const handleBlock = async (shop: PosShopRecord) => {
        const newStatus = shop.status === 1 ? 0 : 1;
        const actionText = newStatus === 1 ? 'Block' : 'Unblock';
        const confirmed = await confirmStatusChange(actionText, 'this POS owner/shop');
        if (!confirmed) return;
        showLoading('Updating...');
        axios
            .patch(
                `${ServerSetting.apiUrl}/pesticide-pos/shops/${shop._id}/block`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((r) => {
                if (r.data?.status === 200) {
                    closeAlert();
                    showSuccess(r.data.message || 'Status updated.');
                    setList((prev) => prev.map((s) => (s._id === shop._id ? { ...s, status: newStatus } : s)));
                } else {
                    closeAlert();
                    showError(r.data?.message || 'Failed');
                }
            })
            .catch((err) => {
                closeAlert();
                showError(err.response?.data?.message || 'Failed to update status');
            });
    };

    const viewTask = (row: PosShopRecord) => {
        setSelectedRow(row);
        setViewModal(true);
    };

    const openSubHistory = (row: PosShopRecord) => {
        setSubHistoryRow(row);
        setSubHistoryModal(true);
    };

    return (
        <div className="space-y-6">
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li><Link to="/dashboard" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link to="/pesticide-pos/shops" className="text-primary hover:underline">Pesticide POS</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-500 dark:text-gray-400">POS Owners</li>
            </ul>

            <button
                type="button"
                onClick={() => navigate('/pesticide-pos/shops')}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
            >
                <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('back_to_pesticide_shop_list')}
            </button>

            <div className={card}>
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-success sm:text-2xl">{t('pos_owners_title')}</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('pos_owners_desc')}</p>
                    </div>
                    <div className="relative w-full shrink-0 lg:w-auto lg:min-w-[260px]">
                        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            className="form-input w-full pl-10"
                            placeholder={t('search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="pos-owners-table dark:[--mantine-color-body:theme(colors.gray.900)] dark:[--mantine-color-text:theme(colors.blue.300)] [&_.mantine-datatable-empty-state]:text-blue-600 dark:[&_.mantine-datatable-empty-state]:!text-blue-300">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-20">
                            <span className="animate-[spin_2s_linear_infinite] border-8 border-[#f1f2f3] border-l-success border-r-success rounded-full w-14 h-14 inline-block align-middle m-auto" />
                        </div>
                    ) : (
                        <DataTable
                            highlightOnHover
                            className="whitespace-nowrap table-hover"
                            records={recordsData}
                            columns={[
                                {
                                    accessor: 'owner',
                                    title: t('table_pos_owner'),
                                    sortable: true,
                                    render: (row: PosShopRecord) => {
                                        const o = row.shopOwnerId;
                                        const name = getOwnerName(row);
                                        const img = o?.userProfileImage ? `${ServerSetting.serUrl}/profile/${o.userProfileImage}` : '/assets/images/profile-34.jpeg';
                                        return (
                                            <div className="flex items-center w-max">
                                                <img className="w-9 h-9 rounded-full ltr:mr-2 rtl:ml-2 object-cover" src={img} alt="" />
                                                <div>{name}</div>
                                            </div>
                                        );
                                    },
                                },
                                { accessor: 'shopName', title: t('shop_name'), sortable: true, render: (r: PosShopRecord) => r.shopName || '—' },
                                {
                                    accessor: 'userCNIC',
                                    title: t('cnic_column'),
                                    sortable: false,
                                    render: (row: PosShopRecord) => (row.shopOwnerId?.userCNIC != null ? String(row.shopOwnerId.userCNIC) : '—'),
                                },
                                {
                                    accessor: 'userPhone',
                                    title: t('phone_number'),
                                    sortable: false,
                                    render: (row: PosShopRecord) => (row.shopOwnerId?.userPhone != null ? String(row.shopOwnerId.userPhone) : row.shopPhone || '—'),
                                },
                                {
                                    accessor: 'userEmail',
                                    title: t('email_column'),
                                    sortable: false,
                                    render: (row: PosShopRecord) => row.shopOwnerId?.userEmail || '—',
                                },
                                {
                                    accessor: 'subscription',
                                    title: t('subscriptions_title'),
                                    sortable: false,
                                    render: (row: PosShopRecord) => row.posSubscriptionId?.name || '—',
                                },
                                {
                                    accessor: 'subscriptionExpireDate',
                                    title: t('table_expires'),
                                    sortable: true,
                                    render: (row: PosShopRecord) => {
                                        const d = row.subscriptionExpireDate;
                                        if (!d) return '—';
                                        const expired = new Date(d).getTime() < Date.now();
                                        return (
                                            <span className={expired ? 'text-danger font-medium' : ''}>
                                                {formatDate(d)}
                                                {expired && ' (Expired)'}
                                            </span>
                                        );
                                    },
                                },
                                {
                                    accessor: 'status',
                                    title: t('status'),
                                    sortable: true,
                                    render: (row: PosShopRecord) => (
                                        <span>
                                            {row.status === 1 ? (
                                                <span className="badge badge-outline-danger">{t('blocked')}</span>
                                            ) : (
                                                <span className="badge badge-outline-success">{t('active')}</span>
                                            )}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'action',
                                    title: t('action_column'),
                                    render: (row: PosShopRecord) => (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                type="button"
                                                className="text-blue-500 hover:text-blue-700 p-1"
                                                onClick={() => viewTask(row)}
                                                title={t('view')}
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                type="button"
                                                className="text-primary hover:text-primary/80 p-1"
                                                onClick={() => openSubHistory(row)}
                                                title={t('subscription_history_title')}
                                            >
                                                <FaHistory />
                                            </button>
                                            <button
                                                type="button"
                                                className={row.status === 1 ? 'text-green-500 hover:text-green-700 p-1' : 'text-red-500 hover:text-red-700 p-1'}
                                                onClick={() => handleBlock(row)}
                                                title={row.status === 1 ? 'Unblock' : 'Block'}
                                            >
                                                <FaBan />
                                            </button>
                                            <Link
                                                to={`/pesticide-pos/shops/edit/${row._id}`}
                                                className="text-yellow-500 hover:text-yellow-700 inline-flex p-1"
                                                title={t('edit')}
                                            >
                                                <FaEdit />
                                            </Link>
                                        </div>
                                    ),
                                },
                            ]}
                            totalRecords={filteredRecords.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                            noRecordsText={t('no_record_found') || 'No records found'}
                        />
                    )}
                </div>
            </div>

            {/* View modal */}
            <Transition appear show={viewModal} as={Fragment}>
                <Dialog as="div" open={viewModal} onClose={() => setViewModal(false)} className="relative z-[51]">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="relative panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                    <button type="button" onClick={() => setViewModal(false)} className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none">
                                        <IconX />
                                    </button>
                                    <div className="p-5">
                                        <h5 className="text-lg font-semibold mb-4">{t('pos_owners_title')} – {t('view')}</h5>
                                        {selectedRow && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={selectedRow.shopOwnerId?.userProfileImage ? `${ServerSetting.serUrl}/profile/${selectedRow.shopOwnerId.userProfileImage}` : '/assets/images/profile-34.jpeg'}
                                                        alt=""
                                                        className="w-20 h-20 rounded-full object-cover"
                                                    />
                                                    <div>
                                                        <p className="font-semibold">{getOwnerName(selectedRow)}</p>
                                                        <p className="text-sm text-gray-500">{selectedRow.shopName}</p>
                                                        <span className={`badge mt-1 ${selectedRow.status === 1 ? 'badge-outline-danger' : 'badge-outline-success'}`}>
                                                            {selectedRow.status === 1 ? 'Blocked' : 'Active'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="border-t border-white-light dark:border-[#1b2e4b] pt-4 grid grid-cols-1 gap-2 text-sm">
                                                    <p><strong>Phone:</strong> {selectedRow.shopOwnerId?.userPhone ?? selectedRow.shopPhone ?? '—'}</p>
                                                    <p><strong>Email:</strong> {selectedRow.shopOwnerId?.userEmail ?? '—'}</p>
                                                    <p><strong>CNIC:</strong> {selectedRow.shopOwnerId?.userCNIC != null ? String(selectedRow.shopOwnerId.userCNIC) : '—'}</p>
                                                    <p><strong>Address:</strong> {[selectedRow.shopOwnerId?.userProvince, selectedRow.shopOwnerId?.userCity, selectedRow.shopOwnerId?.userAdress].filter(Boolean).join(', ') || '—'}</p>
                                                    <p><strong>Shop Reg.#:</strong> {selectedRow.shopRegistrationNumber ?? '—'}</p>
                                                    <p><strong>Shop Address:</strong> {selectedRow.shopAddress ?? '—'}</p>
                                                </div>
                                                <div className="flex justify-end pt-4">
                                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setViewModal(false)}>{t('close')}</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Subscription History modal (current POS subscription) */}
            <Transition appear show={subHistoryModal} as={Fragment}>
                <Dialog as="div" open={subHistoryModal} onClose={() => setSubHistoryModal(false)} className="relative z-[51]">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between p-5 border-b border-white-light dark:border-[#1b2e4b]">
                                        <h5 className="text-lg font-semibold">POS Subscription – {subHistoryRow ? getOwnerName(subHistoryRow) + ' / ' + subHistoryRow.shopName : ''}</h5>
                                        <button type="button" onClick={() => setSubHistoryModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            <IconX />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        {subHistoryRow && (
                                            <div className="border border-white-light dark:border-[#1b2e4b] rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <p><strong>Plan:</strong> {subHistoryRow.posSubscriptionId?.name || '—'}</p>
                                                    <p><strong>Price:</strong> {subHistoryRow.posSubscriptionId?.price != null ? subHistoryRow.posSubscriptionId.price + ' PKR' : '—'}</p>
                                                    <p><strong>Start:</strong> {formatDate(subHistoryRow.subscriptionStartDate)}</p>
                                                    <p><strong>Expire:</strong> {formatDate(subHistoryRow.subscriptionExpireDate)}</p>
                                                    <p><strong>Status:</strong>
                                                        <span className={`badge ml-1 ${subHistoryRow.subscriptionExpireDate && new Date(subHistoryRow.subscriptionExpireDate).getTime() < Date.now() ? 'badge-outline-danger' : 'badge-outline-success'}`}>
                                                            {subHistoryRow.subscriptionExpireDate && new Date(subHistoryRow.subscriptionExpireDate).getTime() < Date.now() ? 'Expired' : 'Active'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-end pt-4">
                                            <button type="button" className="btn btn-outline-secondary" onClick={() => setSubHistoryModal(false)}>Close</button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <style>{`
                .pos-owners-table > div > div:last-child {
                    background-color: #ffffff !important;
                    color: #374151 !important;
                    border-top: 1px solid #bbf7d0;
                }
                .pos-owners-table > div > div:last-child button,
                .pos-owners-table > div > div:last-child input {
                    background-color: #ffffff !important;
                    color: #374151 !important;
                }
                .dark .pos-owners-table > div > div:last-child {
                    background-color: #0b1526 !important;
                    color: #93c5fd !important;
                    border-top-color: #166534;
                }
                .dark .pos-owners-table > div > div:last-child button,
                .dark .pos-owners-table > div > div:last-child input {
                    background-color: #0b1526 !important;
                    color: #93c5fd !important;
                }
            `}</style>
        </div>
    );
};

export default PosOwnersList;
