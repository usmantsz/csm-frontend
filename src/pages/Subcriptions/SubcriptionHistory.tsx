import { useState, useEffect } from 'react';
import { DataTableSortStatus } from 'mantine-datatable';
import { useTranslation } from 'react-i18next';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconUser from '../../components/Icon/IconUser';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconMenuInvoice from '../../components/Icon/Menu/IconMenuInvoice';
import IconCircleCheck from '../../components/Icon/IconCircleCheck';
import IconXCircle from '../../components/Icon/IconXCircle';
import axios from 'axios';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { showSuccess, showError } from '../../utils/sweetAlert';
import { downloadExcel } from 'react-export-table-to-excel';
import TableCard from './../../components/Agricultural/TableCard';

const col = ['id', 'status', 'subNameHistory', 'subPriceHistory', 'userNameF', 'userNameL', 'userCNIC', 'subName', 'subPrice', 'startDateHistory', 'expireDateHistory', 'paymentMethod', 'remarks', 'transactionId'];

const SubscriptionHistory = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token, user } = useAuthToken();
    const isShopOwner = user?.userRole === 1 || user?.userRole === '1';

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [rowData, setRowData] = useState([]); // Initializing rowData
    const [initialRecords, setInitialRecords] = useState([]);
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'expireDateHistory', direction: 'desc' });
    const [totalPrice, setTotalPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showFindByCNIC, setShowFindByCNIC] = useState(false);
    const [cnicInput, setCnicInput] = useState('');
    const [findLoading, setFindLoading] = useState(false);
    const [findResult, setFindResult] = useState<any>(null);
    const [showRenewForm, setShowRenewForm] = useState(false);
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [showChangePlanForm, setShowChangePlanForm] = useState(false);
    const [renewForm, setRenewForm] = useState({ months: 1, paymentMethod: 'bank', remarks: '', transactionId: '' });
    const [updateForm, setUpdateForm] = useState({ subscriptionId: '', startDate: '', expireDate: '', status: 'active' });
    const [changePlanForm, setChangePlanForm] = useState({ newSubId: '', months: 1, paymentMethod: 'bank', remarks: '', transactionId: '' });
    const [subPlans, setSubPlans] = useState<any[]>([]);

    const fetchHistory = () => {
        if (!token) return;
        setIsLoading(true);
        // Shop owner: backend forces own userId; admin/team may omit userId for full list or pass userId to filter
        const body =
            isShopOwner && (user as { _id?: string })?._id
                ? { userId: (user as { _id: string })._id }
                : {};
        axios.post(`${ServerSetting.apiUrl}/getSubscriptionHistory`, body, { headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                if (response.data.status === 200) {
                    const now = new Date();
                    const data = response.data.data.map((item: any) => {
                        const expireDate = item.expireDateHistory ? new Date(item.expireDateHistory) : null;
                        const status = expireDate && expireDate < now ? 'Expired' : 'Active';
                        return {
                            id: item._id,
                            createdAt: item.createdAt,
                            status,
                            subNameHistory: item.subNameHistory,
                            subPriceHistory: item.subPriceHistory,
                            userNameF: item.userIdHistory?.userNameF,
                            userNameL: item.userIdHistory?.userNameL,
                            userCNIC: item.userIdHistory?.userCNIC,
                            subName: item.subIdHistory?.subName,
                            subPrice: item.subIdHistory?.subPrice,
                            startDateHistory: item.startDateHistory,
                            expireDateHistory: item.expireDateHistory,
                            paymentMethod: item.paymentMethod || '',
                            remarks: item.remarks || '',
                            transactionId: item.transactionId || '',
                        };
                    });
                    setRowData(data);
                    setInitialRecords(data);
                    const total = data.reduce((sum: any, item: any) => sum + parseFloat(item.subPriceHistory || item.subPrice || 0), 0);
                    setTotalPrice(total);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        dispatch(setPageTitle(t('subscription_history_page')));
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when role/user known
    }, [dispatch, t, token, isShopOwner, user?._id]);

    const fetchSubscriptionPlans = () => {
        axios.get(`${ServerSetting.serUrl}/api/viewsub`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                const list = res?.data?.data;
                if (Array.isArray(list)) setSubPlans(list);
            })
            .catch(() => {});
    };

    useEffect(() => {
        if (token) fetchSubscriptionPlans();
    }, [token]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        let filtered = initialRecords;
        if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter((item: any) => {
                const pay = (item.paymentMethod || '').toLowerCase();
                const rem = (item.remarks || '').toLowerCase();
                const tx = (item.transactionId || '').toLowerCase();
                return (
                    item.id.toString().includes(s) ||
                    (item.subNameHistory || '').toLowerCase().includes(s) ||
                    (item.subPriceHistory || '').toString().toLowerCase().includes(s) ||
                    (item.userNameF || '').toLowerCase().includes(s) ||
                    (item.userNameL || '').toLowerCase().includes(s) ||
                    (item.subName || '').toLowerCase().includes(s) ||
                    (item.userCNIC || '').toString().toLowerCase().includes(s) ||
                    (item.subPrice || '').toString().toLowerCase().includes(s) ||
                    (item.startDateHistory || '').toString().toLowerCase().includes(s) ||
                    (item.expireDateHistory || '').toString().toLowerCase().includes(s) ||
                    pay.includes(s) || rem.includes(s) || tx.includes(s) ||
                    (item.status || '').toLowerCase().includes(s)
                );
            });
        }
        const sorted = sortBy(filtered, sortStatus.columnAccessor);
        const finalData = sortStatus.direction === 'desc' ? sorted.reverse() : sorted;
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...finalData.slice(from, to)]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, initialRecords, page, pageSize, sortStatus]);

    const formatDate = (date: any) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    const handleDownloadExcel = () => {
        downloadExcel({
            fileName: 'table',
            sheet: 'react-export-table-to-excel',
            tablePayload: {
                header: col,
                body: rowData,
            },
        });
    };
    const exportTable = (type: any) => {
        let columns: any = col;
        let records = rowData;
        let filename = 'table';

        let newVariable: any;
        newVariable = window.navigator;

        if (type === 'csv') {
            let coldelimiter = ';';
            let linedelimiter = '\n';
            let result = columns
                .map((d: any) => {
                    return capitalize(d);
                })
                .join(coldelimiter);
            result += linedelimiter;
            // eslint-disable-next-line array-callback-return
            records.map((item: any) => {
                // eslint-disable-next-line array-callback-return
                columns.map((d: any, index: any) => {
                    if (index > 0) {
                        result += coldelimiter;
                    }
                    let val = item[d] ? item[d] : '';
                    result += val;
                });
                result += linedelimiter;
            });

            if (result == null) return;
            if (!result.match(/^data:text\/csv/i) && !newVariable.msSaveOrOpenBlob) {
                var data = 'data:application/csv;charset=utf-8,' + encodeURIComponent(result);
                var link = document.createElement('a');
                link.setAttribute('href', data);
                link.setAttribute('download', filename + '.csv');
                link.click();
            } else {
                var blob = new Blob([result]);
                if (newVariable.msSaveOrOpenBlob) {
                    newVariable.msSaveBlob(blob, filename + '.csv');
                }
            }
        } else if (type === 'print') {
            var rowhtml = '<p>' + filename + '</p>';
            rowhtml +=
                '<table style="width: 100%; " cellpadding="0" cellcpacing="0"><thead><tr style="color: #515365; background: #eff5ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; "> ';
            // eslint-disable-next-line array-callback-return
            columns.map((d: any) => {
                rowhtml += '<th>' + capitalize(d) + '</th>';
            });
            rowhtml += '</tr></thead>';
            rowhtml += '<tbody>';

            // eslint-disable-next-line array-callback-return
            records.map((item: any) => {
                rowhtml += '<tr>';
                // eslint-disable-next-line array-callback-return
                columns.map((d: any) => {
                    let val = item[d] ? item[d] : '';
                    rowhtml += '<td>' + val + '</td>';
                });
                rowhtml += '</tr>';
            });
            rowhtml +=
                '<style>body {font-family:Arial; color:#495057;}p{text-align:center;font-size:18px;font-weight:bold;margin:15px;}table{ border-collapse: collapse; border-spacing: 0; }th,td{font-size:12px;text-align:left;padding: 4px;}th{padding:8px 4px;}tr:nth-child(2n-1){background:#f7f7f7; }</style>';
            rowhtml += '</tbody></table>';
            var winPrint: any = window.open('', '', 'left=0,top=0,width=1000,height=600,toolbar=0,scrollbars=0,status=0');
            winPrint.document.write('<title>Print</title>' + rowhtml);
            winPrint.document.close();
            winPrint.focus();
            winPrint.print();
        } else if (type === 'txt') {
            let coldelimiter = ',';
            let linedelimiter = '\n';
            let result = columns
                .map((d: any) => {
                    return capitalize(d);
                })
                .join(coldelimiter);
            result += linedelimiter;
            // eslint-disable-next-line array-callback-return
            records.map((item: any) => {
                // eslint-disable-next-line array-callback-return
                columns.map((d: any, index: any) => {
                    if (index > 0) {
                        result += coldelimiter;
                    }
                    let val = item[d] ? item[d] : '';
                    result += val;
                });
                result += linedelimiter;
            });

            if (result == null) return;
            if (!result.match(/^data:text\/txt/i) && !newVariable.msSaveOrOpenBlob) {
                var data1 = 'data:application/txt;charset=utf-8,' + encodeURIComponent(result);
                var link1 = document.createElement('a');
                link1.setAttribute('href', data1);
                link1.setAttribute('download', filename + '.txt');
                link1.click();
            } else {
                var blob1 = new Blob([result]);
                if (newVariable.msSaveOrOpenBlob) {
                    newVariable.msSaveBlob(blob1, filename + '.txt');
                }
            }
        }
    };
    const capitalize = (text: any) => {
        return text
            .replace('_', ' ')
            .replace('-', ' ')
            .toLowerCase()
            .split(' ')
            .map((s: any) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' ');
    };

    const handleFindByCNIC = () => {
        if (!cnicInput.trim()) return;
        setFindLoading(true);
        setFindResult(null);
        axios.post(`${ServerSetting.serUrl}/api/subscription/getByCNIC`, { userCNIC: cnicInput.trim() }, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (res.data.status === 200) setFindResult(res.data.data);
                else showError(res.data.message || t('not_found'));
            })
            .catch(() => showError(t('failed_fetch_check_cnic')))
            .finally(() => setFindLoading(false));
    };

    const handleRenew = () => {
        const user = findResult?.user;
        const sub = Array.isArray(findResult?.subscriptions) ? findResult.subscriptions[0] : findResult?.subscriptions;
        const subId = sub?.subId?._id || sub?.subId;
        const userId = user?.userId || user?._id;
        if (!userId || !subId) { showError(t('no_subscription_to_renew')); return; }
        axios.post(`${ServerSetting.serUrl}/api/renew`, {
            userId,
            subId,
            months: renewForm.months,
            paymentMethod: renewForm.paymentMethod,
            remarks: renewForm.remarks,
            transactionId: renewForm.transactionId,
        }, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (res.data.status === 200) { showSuccess(t('subscription_renewed')); setShowRenewForm(false); setShowFindByCNIC(false); fetchHistory(); }
                else showError(res.data.message || t('renew_failed'));
            })
            .catch(() => showError(t('renew_failed')));
    };

    const handleUpdateSubscription = () => {
        if (!updateForm.subscriptionId) { showError(t('select_a_subscription')); return; }
        const body: any = { subscriptionId: updateForm.subscriptionId };
        if (updateForm.startDate) body.startDate = updateForm.startDate;
        if (updateForm.expireDate) body.expireDate = updateForm.expireDate;
        if (updateForm.status) body.status = updateForm.status;
        axios.post(`${ServerSetting.serUrl}/api/subscription/updateUserSubscription`, body, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (res.data.status === 200) { showSuccess(t('subscription_updated')); setShowUpdateForm(false); setShowFindByCNIC(false); fetchHistory(); }
                else showError(res.data.message || t('update_failed'));
            })
            .catch(() => showError(t('update_failed')));
    };

    const handleChangePlan = () => {
        const user = findResult?.user;
        const userId = user?.userId || user?._id;
        if (!userId || !changePlanForm.newSubId) { showError(t('select_a_new_plan')); return; }
        axios.post(`${ServerSetting.serUrl}/api/subscription/changePlan`, {
            userId,
            newSubId: changePlanForm.newSubId,
            months: changePlanForm.months,
            paymentMethod: changePlanForm.paymentMethod,
            remarks: changePlanForm.remarks,
            transactionId: changePlanForm.transactionId,
        }, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (res.data.status === 200) { showSuccess(t('subscription_plan_changed')); setShowChangePlanForm(false); setShowFindByCNIC(false); fetchHistory(); }
                else showError(res.data.message || t('failed'));
            })
            .catch(() => showError(t('failed_change_plan')));
    };

    const activeCount = rowData.filter((r: any) => r.status === 'Active').length;
    const expiredCount = rowData.filter((r: any) => r.status === 'Expired').length;

    const columns = [
        { accessor: '', title: '#', sortable: true, render: (_: any, index: number) => <span className="font-medium">{(page - 1) * pageSize + index + 1}</span> },
        {
            accessor: 'status',
            title: t('status'),
            sortable: true,
            render: ({ status }: any) => (
                <span className={`badge ${status === 'Active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                    {status === 'Active' ? t('active') : t('expired')}
                </span>
            ),
        },
        { accessor: 'subNameHistory', title: t('table_plan_name'), sortable: true },
        { accessor: 'subPriceHistory', title: t('table_price_pkr'), sortable: true },
        { accessor: 'userNameF', title: t('table_shop_owner'), sortable: true, render: ({ userNameF, userNameL }: any) => <span>{userNameF} {userNameL}</span> },
        { accessor: 'userCNIC', title: t('cnic_column'), sortable: true },
        { accessor: 'startDateHistory', title: t('table_start'), sortable: true, render: ({ startDateHistory }: any) => formatDate(startDateHistory) },
        { accessor: 'expireDateHistory', title: t('table_expire'), sortable: true, render: ({ expireDateHistory }: any) => formatDate(expireDateHistory) },
        { accessor: 'paymentMethod', title: t('table_payment'), sortable: true, render: ({ paymentMethod }: any) => <span>{(paymentMethod || '').replace('_', ' ') || '-'}</span> },
        { accessor: 'remarks', title: t('table_remarks'), sortable: true, render: ({ remarks }: any) => <span className="max-w-[120px] truncate block" title={remarks}>{remarks || '-'}</span> },
        { accessor: 'transactionId', title: t('table_txn_id'), sortable: true, render: ({ transactionId }: any) => <span className="max-w-[100px] truncate block" title={transactionId}>{transactionId || '-'}</span> },
    ];

    return (
        <div className="space-y-6">
            <div className="w-full flex justify-end">
        <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
        >
            <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t('back_to_dashboard')}
        </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-gradient-to-br from-primary/10 to-primary/5 p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <span className="inline-flex h-11 w-11 shadow-gray-500/40 shadow-lg shrink-0 items-center justify-center rounded-xl dark:shadow-none text-primary">
            <IconMenuInvoice className="w-5 h-5" />
        </span>
        <div className="min-w-0">
            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">{t('exp_total_records')}</p>
            <p className="text-2xl font-bold text-primary">{rowData.length}</p>
        </div>
    </div>
    <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-gradient-to-br from-success/10 to-success/5 p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <span className="inline-flex h-11 w-11 dark:shadow-none shadow-gray-500/40 shadow-lg shrink-0 items-center justify-center rounded-xl text-success">
            <IconCircleCheck className="w-5 h-5" />
        </span>
        <div className="min-w-0">
            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">{t('active')}</p>
            <p className="text-2xl font-bold text-success">{activeCount}</p>
        </div>
    </div>
    <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-gradient-to-br from-danger/10 to-danger/5 p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <span className="inline-flex h-11 w-11 dark:shadow-none shadow-gray-500/40 shadow-lg shrink-0 items-center justify-center rounded-xl bg-danger/15 text-danger">
            <IconXCircle className="w-5 h-5" />
        </span>
        <div className="min-w-0">
            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">{t('expired')}</p>
            <p className="text-2xl font-bold text-danger">{expiredCount}</p>
        </div>
    </div>
</div>

            <TableCard
                title={t('subscription_history_page')}
                description={t('subscription_history_desc')}
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
                emptyMessage={t('no_record_found')}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder={t('search_placeholder')}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {!isShopOwner && (
                            <button type="button" onClick={() => { setShowFindByCNIC(true); setFindResult(null); setCnicInput(''); setShowChangePlanForm(false); }} className="btn btn-sm rounded-xl shadow-none flex items-center !bg-[#16a34a] !text-white !border-[#16a34a] hover:!bg-[#15803d]">
<IconUser duotone={false} className="w-5 h-5 ltr:mr-1.5 rtl:ml-1.5" />                                {t('find_by_cnic')}
                            </button>
                        )}
                        <button type="button" onClick={() => exportTable('csv')} className="btn btn-outline-success btn-sm rounded-xl">{t('csv')}</button>
                        <button type="button" onClick={() => exportTable('txt')} className="btn btn-outline-success btn-sm rounded-xl">{t('txt')}</button>
                        <button type="button" onClick={handleDownloadExcel} className="btn btn-outline-success btn-sm rounded-xl">{t('excel')}</button>
                        <button type="button" onClick={() => exportTable('print')} className="btn btn-outline-success btn-sm rounded-xl">{t('print')}</button>
                        
                    </div>
                }
            />

            <div className="rounded-2xl border border-[#c7ddf7] dark:border-[#1f3d7f] bg-white dark:bg-[#0b1526]/60 p-5 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-stone-600 dark:text-stone-400">{t('sorted_by_expire_date')}</p>
                <p className="font-semibold">{t('total_subscription_value')}: <span className="text-primary">{totalPrice.toFixed(2)} PKR</span></p>
            </div>

            {/* Find by CNIC Modal */}
            {showFindByCNIC && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="rounded-2xl border border-[#c7ddf7] dark:border-[#1f3d7f] bg-white dark:bg-[#0b1526] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4 gap-2">
                            <h5 className="text-lg font-semibold truncate">{t('find_shop_owner_by_cnic')}</h5>
                            <button type="button" className="btn btn-sm btn-outline-danger rounded-xl shrink-0" onClick={() => { setShowFindByCNIC(false); setShowRenewForm(false); setShowUpdateForm(false); setShowChangePlanForm(false); setFindResult(null); }}>{t('close')}</button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 mb-4">
                            <input type="text" className="form-input flex-1 min-w-0" placeholder={t('enter_shop_owner_cnic')} value={cnicInput} onChange={e => setCnicInput(e.target.value)} />
                            <button type="button" className="btn btn-primary rounded-xl shrink-0" onClick={handleFindByCNIC} disabled={findLoading}>{findLoading ? t('searching') : t('search')}</button>
                        </div>
                        {findResult && (
                            <>
                                <div className="border border-[#c7ddf7] dark:border-[#1f3d7f] rounded-xl p-4 mb-4 space-y-2 bg-[#f8fbff] dark:bg-white/[0.02]">
                                    <h6 className="font-semibold text-primary">{t('shop_owner')}</h6>
                                    <p className="break-words"><strong>{t('name')}:</strong> {findResult.user?.userNameF} {findResult.user?.userNameL}</p>
                                    <p className="break-words"><strong>{t('cnic_label')}:</strong> {findResult.user?.userCNIC}</p>
                                    <p className="break-words"><strong>{t('email')}:</strong> {findResult.user?.userEmail}</p>
                                    <p className="break-words"><strong>{t('phone')}:</strong> {findResult.user?.userPhone}</p>
                                    <p className="break-words"><strong>{t('address')}:</strong> {findResult.user?.userAddress}</p>
                                </div>
                                {findResult.shop && (
                                    <div className="border border-[#c7ddf7] dark:border-[#1f3d7f] rounded-xl p-4 mb-4 bg-[#f8fbff] dark:bg-white/[0.02]">
                                        <h6 className="font-semibold text-primary">{t('shop')}</h6>
                                        <p className="break-words"><strong>{t('name')}:</strong> {findResult.shop.shopName}</p>
                                        <p className="break-words"><strong>{t('number')}:</strong> {findResult.shop.shopNumber}</p>
                                        <p className="break-words"><strong>{t('address')}:</strong> {findResult.shop.shopAddress}</p>
                                    </div>
                                )}
                                <div className="border border-[#c7ddf7] dark:border-[#1f3d7f] rounded-xl p-4 mb-4 bg-[#f8fbff] dark:bg-white/[0.02]">
                                    <h6 className="font-semibold text-primary">{t('subscriptions')}</h6>
                                    {findResult.subscriptions?.length ? (
                                        <ul className="list-disc list-inside space-y-1">
                                            {findResult.subscriptions.map((s: any, i: number) => (
                                                <li key={i} className="break-words">
                                                    {t('plan')}: {s.subId?.subName || s.subId} | {t('status')}: {s.status} | {t('table_expires')}: {formatDate(s.expireDate)}
                                                    {s._id && <span className="ml-2 text-stone-500">({t('id')}: {s._id})</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-stone-500">{t('no_subscription_record')}</p>
                                    )}
                                </div>
                                {findResult.subscriptionHistory?.length > 0 && (
                                    <div className="border border-[#c7ddf7] dark:border-[#1f3d7f] rounded-xl p-4 mb-4 bg-[#f8fbff] dark:bg-white/[0.02]">
                                        <h6 className="font-semibold text-primary">{t('recent_history')}</h6>
                                        <ul className="text-sm space-y-1">
                                            {findResult.subscriptionHistory.slice(0, 5).map((h: any, i: number) => (
                                                <li key={i} className="break-words">{formatDate(h.startDateHistory)} - {formatDate(h.expireDateHistory)} | {t('table_payment')}: {h.paymentMethod || '-'} | {h.transactionId ? `${t('txn')}: ${h.transactionId}` : ''}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" className="btn btn-success flex-1 sm:flex-none rounded-xl" onClick={() => { setShowRenewForm(true); setShowUpdateForm(false); setShowChangePlanForm(false); }}>{t('renew_subscription')}</button>
                                    <button type="button" className="btn btn-warning flex-1 sm:flex-none rounded-xl" onClick={() => { setShowChangePlanForm(true); setShowRenewForm(false); setShowUpdateForm(false); setChangePlanForm({ newSubId: '', months: 1, paymentMethod: 'bank', remarks: '', transactionId: '' }); if (subPlans.length === 0) fetchSubscriptionPlans(); }}>{t('change_plan_new_subscription')}</button>
                                    <button type="button" className="btn btn-outline-primary flex-1 sm:flex-none rounded-xl" onClick={() => { setShowUpdateForm(true); setShowRenewForm(false); setShowChangePlanForm(false); setUpdateForm({ subscriptionId: findResult.subscriptions?.[0]?._id || '', startDate: '', expireDate: '', status: 'active' }); }}>{t('update_dates_status')}</button>
                                </div>
                                {showRenewForm && (
                                    <div className="mt-4 p-4 border border-success/30 rounded-xl bg-success/5 dark:bg-success/10">
                                        <h6 className="font-semibold mb-3">{t('renew_with_payment_details')}</h6>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="min-w-0">
                                                <label className="form-label">{t('months')}</label>
                                                <input type="number" min={1} className="form-input w-full" value={renewForm.months} onChange={e => setRenewForm(f => ({ ...f, months: parseInt(e.target.value, 10) || 1 }))} />
                                            </div>
                                            <div className="min-w-0">
                                                <label className="form-label">{t('payment_method')}</label>
                                                <select className="form-select w-full" value={renewForm.paymentMethod} onChange={e => setRenewForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                                                    <option value="bank">{t('bank')}</option>
                                                    <option value="cash">{t('cash')}</option>
                                                    <option value="mobile_wallet">{t('mobile_wallet')}</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2 min-w-0">
                                                <label className="form-label">{t('remarks')}</label>
                                                <input type="text" className="form-input w-full" placeholder={t('remarks')} value={renewForm.remarks} onChange={e => setRenewForm(f => ({ ...f, remarks: e.target.value }))} />
                                            </div>
                                            <div className="md:col-span-2 min-w-0">
                                                <label className="form-label">{t('transaction_id')}</label>
                                                <input type="text" className="form-input w-full" placeholder={t('transaction_id')} value={renewForm.transactionId} onChange={e => setRenewForm(f => ({ ...f, transactionId: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <button type="button" className="btn btn-success flex-1 sm:flex-none rounded-xl" onClick={handleRenew}>{t('confirm_renew')}</button>
                                            <button type="button" className="btn btn-outline-secondary flex-1 sm:flex-none rounded-xl" onClick={() => setShowRenewForm(false)}>{t('cancel')}</button>
                                        </div>
                                    </div>
                                )}
                                {showChangePlanForm && (
                                    <div className="mt-4 p-4 border border-warning/30 rounded-xl bg-warning/5 dark:bg-warning/10">
                                        <h6 className="font-semibold mb-3 text-warning">{t('change_plan_desc')}</h6>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="md:col-span-2 min-w-0">
                                                <label className="form-label">{t('new_plan')}</label>
                                                <select className="form-select w-full" value={changePlanForm.newSubId} onChange={e => setChangePlanForm(f => ({ ...f, newSubId: e.target.value }))} required>
                                                    <option value="">{subPlans.length === 0 ? t('loading_plans') : t('select_plan')}</option>
                                                    {subPlans.map((p: any) => (
                                                        <option key={p._id || p.id} value={String(p._id || p.id)}>{p.subName || p.subscriptionName} - {p.subPrice != null ? p.subPrice : ''} PKR</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="min-w-0">
                                                <label className="form-label">{t('months')}</label>
                                                <input type="number" min={1} className="form-input w-full" value={changePlanForm.months} onChange={e => setChangePlanForm(f => ({ ...f, months: parseInt(e.target.value, 10) || 1 }))} />
                                            </div>
                                            <div className="min-w-0">
                                                <label className="form-label">{t('payment_method')}</label>
                                                <select className="form-select w-full" value={changePlanForm.paymentMethod} onChange={e => setChangePlanForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                                                    <option value="bank">{t('bank')}</option>
                                                    <option value="cash">{t('cash')}</option>
                                                    <option value="mobile_wallet">{t('mobile_wallet')}</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2 min-w-0">
                                                <label className="form-label">{t('remarks')}</label>
                                                <input type="text" className="form-input w-full" placeholder={t('remarks')} value={changePlanForm.remarks} onChange={e => setChangePlanForm(f => ({ ...f, remarks: e.target.value }))} />
                                            </div>
                                            <div className="md:col-span-2 min-w-0">
                                                <label className="form-label">{t('transaction_id')}</label>
                                                <input type="text" className="form-input w-full" placeholder={t('transaction_id')} value={changePlanForm.transactionId} onChange={e => setChangePlanForm(f => ({ ...f, transactionId: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <button type="button" className="btn btn-warning flex-1 sm:flex-none rounded-xl" onClick={handleChangePlan}>{t('confirm_change_plan')}</button>
                                            <button type="button" className="btn btn-outline-secondary flex-1 sm:flex-none rounded-xl" onClick={() => setShowChangePlanForm(false)}>{t('cancel')}</button>
                                        </div>
                                    </div>
                                )}
                                {showUpdateForm && (
                                    <div className="mt-4 p-4 border border-primary/30 rounded-xl bg-primary/5 dark:bg-primary/10">
                                        <h6 className="font-semibold mb-3">{t('update_dates_status')}</h6>
                                        <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">{t('update_dates_status_desc')}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="md:col-span-2 min-w-0">
                                                <label className="form-label">{t('select_subscription_to_update')}</label>
                                                <select className="form-select w-full" value={updateForm.subscriptionId} onChange={e => setUpdateForm(f => ({ ...f, subscriptionId: e.target.value }))}>
                                                    <option value="">{t('select_subscription')}</option>
                                                    {findResult.subscriptions?.map((s: any) => (
                                                        <option key={s._id} value={String(s._id)}>{s.subId?.subName || t('plan')} - {s.status} ({t('table_expires')}: {formatDate(s.expireDate)})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="min-w-0">
                                                <label className="form-label">{t('table_start_date')}</label>
                                                <input type="date" className="form-input w-full" value={updateForm.startDate} onChange={e => setUpdateForm(f => ({ ...f, startDate: e.target.value }))} />
                                            </div>
                                            <div className="min-w-0">
                                                <label className="form-label">{t('table_expire_date')}</label>
                                                <input type="date" className="form-input w-full" value={updateForm.expireDate} onChange={e => setUpdateForm(f => ({ ...f, expireDate: e.target.value }))} />
                                            </div>
                                            <div className="min-w-0">
                                                <label className="form-label">{t('status')}</label>
                                                <select className="form-select w-full" value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}>
                                                    <option value="active">{t('active')}</option>
                                                    <option value="expired">{t('expired')}</option>
                                                    <option value="canceled">{t('canceled')}</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <button type="button" className="btn btn-primary flex-1 sm:flex-none rounded-xl" onClick={handleUpdateSubscription}>{t('update')}</button>
                                            <button type="button" className="btn btn-outline-secondary flex-1 sm:flex-none rounded-xl" onClick={() => setShowUpdateForm(false)}>{t('cancel')}</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionHistory;
