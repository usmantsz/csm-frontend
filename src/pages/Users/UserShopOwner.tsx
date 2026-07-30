import { useEffect, useState, Fragment } from 'react';
import sortBy from 'lodash/sortBy';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { FaEye, FaEdit, FaTrashAlt, FaBan, FaHistory } from 'react-icons/fa';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { Notification } from './../../helperComponents/Notification';
import { confirmStatusChange, confirmDelete, showSuccess, showError, showLoading, closeAlert } from '../../utils/sweetAlert';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../components/Icon/IconX';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { useUserPermissions } from '../../Hooks/useUserPermissions';
import { canPerformRestrictedActions, PERMISSIONS } from '../../constants/permissions';
import TableCard from '../../components/Agricultural/TableCard';
import { useTranslation } from 'react-i18next';

interface User {
    _id: string;
    userNameF: string;
    userNameL: string;
    userPhone: string | number;
    userEmail: string;
    userCNIC: string | number;
    userProvince: string;
    userCity: string;
    userAdress: string;
    userStatus: number; // 1 = Active, 0 = Blocked
    userProfileImage: string;
    createdAt: string;
    updatedAt: string;
}

// Small rounded "chip" action button so all row actions share one consistent look
const actionChip =
    'inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors';

const UserShopOwner = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const { userRole, hasPermission } = useUserPermissions();
    const canBlockOrDelete = canPerformRestrictedActions(userRole);
    const canEditShopOwner = userRole === '0' || userRole === '2' || hasPermission(PERMISSIONS.EDIT_SHOP_OWNER);
    const canBlockShopOwner = canBlockOrDelete && (userRole === '0' || hasPermission(PERMISSIONS.BLOCK_SHOP_OWNER));
    const [isLoading, setIsLoading] = useState(false); // New state for loading indicator
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<User[]>([]);
    const [recordsData, setRecordsData] = useState<User[]>(initialRecords);
    const [search, setSearch] = useState('');
    const [viewTaskModal, setViewTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState({
        userStatus: 0,
        userNameF: "",
        userNameL: "",
        userCNIC: "",
        userProvince: "",
        userCity: "",
        userEmail: "",
        userPhone: "",
        userProfileImage: "",
        userAdress: "",
    });
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'userNameF',
        direction: 'asc',
    });
    const [showSubHistoryModal, setShowSubHistoryModal] = useState(false);
    const [subHistoryUserId, setSubHistoryUserId] = useState<string | null>(null);
    const [subHistoryUserName, setSubHistoryUserName] = useState('');
    const [currentSubscription, setCurrentSubscription] = useState<any>(null);
    const [subscriptionHistoryList, setSubscriptionHistoryList] = useState<any[]>([]);
    const [loadingSubHistory, setLoadingSubHistory] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setIsLoading(true); // Show loading during update
        getAllUserOwner()
    }, []);

    useEffect(() => {
        const filteredRecords = initialRecords.filter((item) => {
            return (
                item.userNameF?.toLowerCase().includes(search.toLowerCase()) ||
                item.userNameL?.toLowerCase().includes(search.toLowerCase()) ||
                item.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
                item.userPhone?.toString().toLowerCase().includes(search.toLowerCase()) ||
                item.userCNIC?.toString().toLowerCase().includes(search.toLowerCase())
            );
        });
        setRecordsData(filteredRecords);
    }, [search, initialRecords]);

    useEffect(() => {
        const sortedData = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? sortedData.reverse() : sortedData);
        setPage(1);
    }, [sortStatus]);

    const formatDate = (date: any) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };
    const getAllUserOwner = () => {
        axios.get(`${ServerSetting.serUrl}/api/getAllUser?role=1&status=2`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(response => {
                const { data } = response;
                if (data.status === 200) {
                    setInitialRecords(data.data);
                    setIsLoading(false); // Stop loading
                }
            })
            .catch(error => {
                setIsLoading(false); // Stop loading
                console.error('Error fetching data:', error);
            });
    }
    const handleAction = async (action: string, userId: string, userStatus: Number) => {
        if (action == "block") {
            const actionText = userStatus == 0 ? "Block" : "Unblock";
            const confirmed = await confirmStatusChange(actionText, "this user");
            if (!confirmed) return;

            if (userStatus == 0) {
                await updateUserStatus(userId, 1);
            } else {
                await updateUserStatus(userId, 0);
            }
        } else if (action == "delete") {
            const confirmed = await confirmDelete("this user");
            if (!confirmed) return;
            await updateUserStatus(userId, 2);
        } else if (action == "edit") {
            console.log('[UserShopOwner] Edit clicked, navigating to:', `/editshopowner/${userId}`);
            navigate(`/editshopowner/${userId}`);
        } else {
            // Other actions
        }
    };

    const updateUserStatus = async (userId: string, userStatus: Number) => {
        setIsLoading(true);
        showLoading('Updating user status...');

        try {
            const response = await axios.post(`${ServerSetting.serUrl}/api/userStatusUpdate`, {
                userId: userId,
                status: userStatus
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const { data } = response;
            if (data.status === 200) {
                closeAlert();
                showSuccess(data.message || 'User status updated successfully!');
                getAllUserOwner();
            } else {
                closeAlert();
                showError(data.message || 'Failed to update user status');
            }
        } catch (error: any) {
            console.error('Error updating user status:', error);
            closeAlert();
            showError(error.response?.data?.message || 'Error updating user status');
            getAllUserOwner();
        } finally {
            setIsLoading(false);
        }
    }
    const addCustomer = () => {
        // Logic to add a customer, e.g., open a modal or navigate to a customer form page
        console.log('Add Customer button clicked');
    };

    const viewTask = (item: any = null) => {
        setSelectedTask(item);
        setTimeout(() => {
            setViewTaskModal(true);
        });
    };

    const openSubscriptionHistory = (userId: string, userName: string) => {
        setSubHistoryUserId(userId);
        setSubHistoryUserName(userName);
        setCurrentSubscription(null);
        setSubscriptionHistoryList([]);
        setShowSubHistoryModal(true);
        setLoadingSubHistory(true);
        axios.post(`${ServerSetting.serUrl}/api/getActiveSubscription`, { userId }, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (res.data?.data) setCurrentSubscription(res.data.data);
            })
            .catch(() => setCurrentSubscription(null))
            .finally(() => {});
        axios.post(`${ServerSetting.serUrl}/api/getSubscriptionHistory`, { userId }, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (res.data?.data && Array.isArray(res.data.data)) setSubscriptionHistoryList(res.data.data);
            })
            .catch(() => setSubscriptionHistoryList([]))
            .finally(() => setLoadingSubHistory(false));
    };

    const columns = [
        {
            accessor: 'userNameF',
            title: t('user_column'),
            sortable: true,
            render: ({ userNameF, userNameL, _id, userProfileImage }: User) => (
                <div className="flex items-center w-max">
                    <img
                        className="w-9 h-9 rounded-full ltr:mr-2 rtl:ml-2 object-cover"
                        src={userProfileImage ? `${ServerSetting.serUrl}/profile/${userProfileImage}` : '/assets/images/profile-34.jpeg'}
                        alt="User Profile"
                    />
                    <div className="font-medium text-gray-800 dark:text-gray-200">{userNameF + ' ' + userNameL}</div>
                </div>
            ),
        },
        { accessor: 'userCNIC', title: t('cnic_column'), sortable: true },
        { accessor: 'userProvince', title: t('province_column'), sortable: true },
        { accessor: 'userCity', title: t('city_column'), sortable: true },
        { accessor: 'userEmail', title: t('email_column'), sortable: true },
        { accessor: 'userPhone', title: t('phone_no'), sortable: true },
        {
            accessor: 'userStatus',
            title: t('status'),
            sortable: true,
            render: ({ userStatus }: User) => (
                userStatus === 1 ? (
                    <span className="badge badge-outline-success">{t('active')}</span>
                ) : (
                    <span className="badge badge-outline-danger">{t('blocked')}</span>
                )
            ),
        },
        {
            accessor: 'action',
            title: t('action_column'),
            textAlignment: 'right' as const,
            render: (record: User) => {
                const { _id, userStatus, userNameF, userNameL, userCNIC, userProvince, userCity, userEmail, userPhone, userProfileImage, userAdress } = record;
                return (
                    <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                        <button
                            type="button"
                            className={`${actionChip} bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20`}
                            onClick={() => viewTask({ userStatus, userNameF, userNameL, userCNIC, userProvince, userCity, userEmail, userPhone, userProfileImage, userAdress })}
                            title={t('view')}
                        >
                            <FaEye className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            className={`${actionChip} bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30`}
                            onClick={() => openSubscriptionHistory(_id, `${userNameF} ${userNameL}`)}
                            title={t('subscription_history_title')}
                        >
                            <FaHistory className="w-3.5 h-3.5" />
                        </button>
                        {canBlockShopOwner && (
                            <button
                                type="button"
                                className={`${actionChip} ${
                                    userStatus === 1
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20'
                                        : 'bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30'
                                }`}
                                onClick={() => handleAction('block', _id, userStatus)}
                                title={userStatus === 1 ? t('block') : t('unblock')}
                            >
                                <FaBan className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {canEditShopOwner && (
                            <Link
                                to={`/editshopowner/${_id}`}
                                className={`${actionChip} bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20`}
                                title={t('edit_shop_owner')}
                            >
                                <FaEdit className="w-3.5 h-3.5" />
                            </Link>
                        )}
                        {canBlockOrDelete && (
                            <button
                                type="button"
                                className={`${actionChip} bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20`}
                                onClick={() => handleAction('delete', _id, userStatus)}
                                title={t('delete_title')}
                            >
                                <FaTrashAlt className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div>
            <TableCard
                title={t('shop_owners')}
                description={t('manage_shop_owners_desc')}
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
                searchPlaceholder={t('search_placeholder')}
                actions={
                    <>
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30"
                        >
                            <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                            {t('back_to_dashboard')}
                        </button>
                        <Link
                            to="/creatshopowner"
                            onClick={addCustomer}
                            className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                        >
                            {t('add_shop_owner_btn')}
                        </Link>
                    </>
                }
            />

            <Transition appear show={viewTaskModal} as={Fragment}>
                <Dialog as="div" open={viewTaskModal} onClose={() => setViewTaskModal(false)} className="relative z-[51]">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white-light bg-white/95 text-gray-700 shadow-xl dark:border-white/10 dark:bg-[#0b1526]/95 dark:text-gray-300">
                                    <button
                                        type="button"
                                        onClick={() => setViewTaskModal(false)}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
                                    >
                                        <IconX />
                                    </button>

                                    <div className="flex items-center justify-center pt-8">
                                        <div className="w-full max-w-[30rem]">
                                            <div className="flex flex-col items-center p-6 sm:flex-row">
                                                <div className="mb-5 h-20 w-20 shrink-0 overflow-hidden rounded-full ring-4 ring-primary/10 dark:ring-primary/20">
                                                    <img src={selectedTask?.userProfileImage ? `${ServerSetting.serUrl}/profile/${selectedTask.userProfileImage}` : '/assets/images/profile-34.jpeg'} alt="profile" className="h-full w-full object-cover" />
                                                </div>
                                                <div className="flex-1 text-center ltr:sm:pl-5 rtl:sm:pr-5 sm:text-left">
                                                    <h5 className="mb-2 flex flex-wrap items-center justify-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-white sm:justify-start">
                                                        {selectedTask?.userNameF} {selectedTask?.userNameL}
                                                        {selectedTask.userStatus === 1 ? (
                                                            <span className="badge badge-outline-success">Active</span>
                                                        ) : (
                                                            <span className="badge badge-outline-danger">Blocked</span>
                                                        )}
                                                    </h5>
                                                    <p className="mb-1.5 text-sm text-gray-500 dark:text-gray-400">Phone: {selectedTask?.userPhone}</p>
                                                    <p className="mb-1.5 text-sm text-gray-500 dark:text-gray-400">CNIC: {selectedTask?.userCNIC}</p>
                                                    <p className="mb-1.5 text-sm text-gray-500 dark:text-gray-400">Email: {selectedTask?.userEmail}</p>
                                                    <p className="mt-4 text-sm font-semibold text-gray-600 dark:text-gray-300 sm:mt-6">
                                                        {`${selectedTask?.userProvince}, ${selectedTask?.userCity}, ${selectedTask?.userAdress}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end border-t border-white-light p-5 dark:border-white/10">
                                        <button
                                            type="button"
                                            className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
                                            onClick={() => setViewTaskModal(false)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Subscription History Modal */}
            <Transition appear show={showSubHistoryModal} as={Fragment}>
                <Dialog as="div" open={showSubHistoryModal} onClose={() => setShowSubHistoryModal(false)} className="relative z-[51]">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white-light bg-white/95 text-gray-700 shadow-xl dark:border-white/10 dark:bg-[#0b1526]/95 dark:text-gray-300">
                                    <div className="flex items-center justify-between border-b border-white-light p-5 dark:border-[#1b2e4b]">
                                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription History &ndash; {subHistoryUserName}</h5>
                                        <button
                                            type="button"
                                            onClick={() => setShowSubHistoryModal(false)}
                                            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
                                        >
                                            <IconX />
                                        </button>
                                    </div>
                                    <div className="max-h-[70vh] space-y-6 overflow-y-auto p-5">
                                        {loadingSubHistory ? (
                                            <div className="flex justify-center py-8">
                                                <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <h6 className="mb-3 font-semibold text-primary">Current Subscription</h6>
                                                    {currentSubscription ? (
                                                        <div className="rounded-2xl border border-white-light bg-gray-50 p-4 dark:border-[#1b2e4b] dark:bg-gray-800/50">
                                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                                <p><strong className="text-gray-800 dark:text-gray-100">Plan:</strong> {currentSubscription.subId?.subName || currentSubscription.subNameHistory || 'N/A'}</p>
                                                                <p><strong className="text-gray-800 dark:text-gray-100">Price:</strong> {currentSubscription.subId?.subPrice ?? currentSubscription.subPriceHistory ?? 'N/A'} PKR</p>
                                                                <p><strong className="text-gray-800 dark:text-gray-100">Status:</strong>{' '}
                                                                    <span className={`badge ${(currentSubscription.status === 'active' && !currentSubscription.isExpired) ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                                                        {(currentSubscription.status === 'active' && !currentSubscription.isExpired) ? 'Active' : 'Expired'}
                                                                    </span>
                                                                </p>
                                                                <p><strong className="text-gray-800 dark:text-gray-100">Start:</strong> {currentSubscription.startDate ? formatDate(currentSubscription.startDate) : 'N/A'}</p>
                                                                <p><strong className="text-gray-800 dark:text-gray-100">Expire:</strong> {currentSubscription.expireDate ? formatDate(currentSubscription.expireDate) : currentSubscription.expireDateHistory ? formatDate(currentSubscription.expireDateHistory) : 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500 dark:text-gray-400">No current subscription.</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <h6 className="mb-3 font-semibold text-primary">Previous History</h6>
                                                    {subscriptionHistoryList.length > 0 ? (
                                                        <div className="overflow-hidden rounded-2xl border border-white-light dark:border-[#1b2e4b]">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-gray-100 dark:bg-gray-800">
                                                                    <tr>
                                                                        <th className="p-2 text-left text-gray-500 dark:text-gray-400">Plan</th>
                                                                        <th className="p-2 text-left text-gray-500 dark:text-gray-400">Price</th>
                                                                        <th className="p-2 text-left text-gray-500 dark:text-gray-400">Start</th>
                                                                        <th className="p-2 text-left text-gray-500 dark:text-gray-400">Expire</th>
                                                                        <th className="p-2 text-left text-gray-500 dark:text-gray-400">Payment</th>
                                                                        <th className="p-2 text-left text-gray-500 dark:text-gray-400">Txn ID</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {subscriptionHistoryList.map((h: any, i: number) => (
                                                                        <tr key={h._id || i} className="border-t border-white-light text-gray-600 dark:border-[#1b2e4b] dark:text-gray-300">
                                                                            <td className="p-2">{h.subNameHistory || h.subIdHistory?.subName || '-'}</td>
                                                                            <td className="p-2">{h.subPriceHistory ?? h.subIdHistory?.subPrice ?? '-'}</td>
                                                                            <td className="p-2">{formatDate(h.startDateHistory)}</td>
                                                                            <td className="p-2">{formatDate(h.expireDateHistory)}</td>
                                                                            <td className="p-2">{(h.paymentMethod || '-').replace('_', ' ')}</td>
                                                                            <td className="p-2 max-w-[80px] truncate" title={h.transactionId}>{h.transactionId || '-'}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500 dark:text-gray-400">No previous history.</p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex justify-end border-t border-white-light p-5 dark:border-[#1b2e4b]">
                                        <button
                                            type="button"
                                            className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
                                            onClick={() => setShowSubHistoryModal(false)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default UserShopOwner;
