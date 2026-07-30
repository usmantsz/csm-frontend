import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { DataTable, DataTableColumn, DataTableSortStatus } from 'mantine-datatable';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import axios from 'axios';
import Swal from 'sweetalert2';
import IconSearch from '../../components/Icon/IconSearch';
import PageHeader from '../../components/Agricultural/PageHeader';

const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

type ViewRecordItem = {
    _id: string;
    receiptNumber: string;
    customerName: string;
    customerCNIC: string;
    status: string;
    totalAmount?: number;
    createdAt: string;
    finaceId?: { finaceCropId?: { _id: string; cropName?: string } | string };
    cropName?: string;
};

const PosViewRecordPage = () => {
    const dispatch = useDispatch();
    const { shopOwnerId } = useParams<{ shopOwnerId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const state = location.state as { shopOwnerName?: string; shopName?: string } | null;

    const [list, setList] = useState<ViewRecordItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCropId, setSelectedCropId] = useState<string | null>(() => {
        const p = new URLSearchParams(location.search);
        return p.get('cropId');
    });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus<ViewRecordItem>>({
        columnAccessor: 'createdAt',
        direction: 'desc',
    });
    const [fulfillId, setFulfillId] = useState<string | null>(null);

    useEffect(() => {
        dispatch(setPageTitle('View Record'));
    }, [dispatch]);

    useEffect(() => {
        if (!token || !shopOwnerId) {
            setList([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        axios
            .get(`${ServerSetting.apiUrl}/shop-owner-pos/requests/view-record`, {
                params: { shopOwnerId },
                headers: { Authorization: `Bearer ${token}` },
                validateStatus: () => true,
            })
            .then((r) => {
                if (r.data?.data) setList(r.data.data);
                else setList([]);
            })
            .catch(() => setList([]))
            .finally(() => setLoading(false));
    }, [token, shopOwnerId]);

    const cropGroups = useMemo(() => {
        const byCrop = new Map<string, { cropId: string; cropName: string; records: ViewRecordItem[] }>();
        list.forEach((r) => {
            const finaceCrop = r.finaceId?.finaceCropId;
            const cropId = finaceCrop
                ? typeof finaceCrop === 'object'
                    ? (finaceCrop._id ?? 'loan')
                    : String(finaceCrop)
                : r.finaceId
                    ? 'loan'
                    : 'other';
            const cropName = (typeof finaceCrop === 'object' && finaceCrop?.cropName) ? finaceCrop.cropName : (r.cropName || '—');
            if (!byCrop.has(cropId)) byCrop.set(cropId, { cropId, cropName, records: [] });
            byCrop.get(cropId)!.records.push(r);
        });
        return Array.from(byCrop.values()).sort((a, b) => b.records.length - a.records.length);
    }, [list]);

    const filteredByCrop = useMemo(() => {
        if (!selectedCropId) return [];
        return list.filter((r) => {
            const finaceCrop = r.finaceId?.finaceCropId;
            const cid = finaceCrop ? (typeof finaceCrop === 'object' ? finaceCrop._id : finaceCrop) : (r.finaceId ? 'loan' : 'other');
            return (cid ?? 'other') === selectedCropId;
        });
    }, [list, selectedCropId]);

    const searchLower = search.trim().toLowerCase();
    const filteredRecords = useMemo(() => {
        if (!searchLower) return filteredByCrop;
        return filteredByCrop.filter(
            (r) =>
                (r.receiptNumber || '').toLowerCase().includes(searchLower) ||
                (r.customerName || '').toLowerCase().includes(searchLower) ||
                (r.customerCNIC || '').replace(/\D/g, '').includes(searchLower.replace(/\D/g, '')) ||
                (r.status || '').toLowerCase().includes(searchLower)
        );
    }, [filteredByCrop, searchLower]);

    const sortedRecords = useMemo(() => {
        const sorted = [...filteredRecords];
        const col = sortStatus.columnAccessor as keyof ViewRecordItem;
        const dir = sortStatus.direction === 'asc' ? 1 : -1;
        sorted.sort((a, b) => {
            let va: string | number | undefined = a[col];
            let vb: string | number | undefined = b[col];
            if (col === 'createdAt') {
                va = new Date(a.createdAt).getTime();
                vb = new Date(b.createdAt).getTime();
            }
            if (va === vb) return 0;
            if (va == null) return dir;
            if (vb == null) return -dir;
            return (va < vb ? -1 : 1) * dir;
        });
        return sorted;
    }, [filteredRecords, sortStatus]);

    const totalRecords = sortedRecords.length;
    const from = (page - 1) * pageSize;
    const to = Math.min(from + pageSize, totalRecords);
    const pageRecords = sortedRecords.slice(from, to);

    const selectedCropName = selectedCropId ? cropGroups.find((g) => g.cropId === selectedCropId)?.cropName ?? 'Crop' : null;

    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        const d = new Date(dateString);
        return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const handleFulfill = (id: string) => {
        if (!token) return;
        setFulfillId(id);
        Swal.fire({
            title: 'Deliver products',
            html: `
                <p class="text-left mb-2">Add remarks (what was given, any note):</p>
                <textarea id="swal-remarks" class="swal2-textarea w-full border rounded p-2" rows="3" placeholder="e.g. All items handed over to customer."></textarea>
            `,
            showCancelButton: true,
            confirmButtonText: 'Submit (products delivered)',
            cancelButtonText: 'Cancel',
            preConfirm: () => (document.getElementById('swal-remarks') as HTMLTextAreaElement)?.value ?? '',
        }).then((result) => {
            if (!result.isConfirmed) {
                setFulfillId(null);
                return;
            }
            const rem = (result.value || '').trim();
            axios
                .patch(
                    `${ServerSetting.apiUrl}/shop-owner-pos/requests/${id}/fulfill`,
                    { remarks: rem },
                    { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
                )
                .then((res) => {
                    if (res.data.status === 200) {
                        Swal.fire({ title: 'Done', text: res.data.message || 'Shop owner has been notified.', icon: 'success' });
                        setList((prev) => prev.map((r) => (r._id === id ? { ...r, status: 'fulfilled' } : r)));
                    } else {
                        Swal.fire({ title: 'Error', text: res.data.message || 'Failed.', icon: 'error' });
                    }
                })
                .catch(() => Swal.fire({ title: 'Error', text: 'Request failed.', icon: 'error' }))
                .finally(() => setFulfillId(null));
        });
    };

    const columns: DataTableColumn<ViewRecordItem>[] = [
        { accessor: 'receiptNumber', title: 'Receipt', sortable: true, render: (r) => <span className="font-mono font-medium text-gray-900 dark:text-white">{r.receiptNumber}</span> },
        { accessor: 'customerName', title: 'Customer', sortable: true, render: (r) => <span className="text-gray-800 dark:text-gray-200">{r.customerName} ({r.customerCNIC})</span> },
        {
            accessor: 'totalAmount',
            title: 'Amount',
            sortable: true,
            render: (r) => (r.totalAmount != null ? `Rs ${Number(r.totalAmount).toLocaleString()}` : '—'),
        },
        {
            accessor: 'status',
            title: 'Status',
            sortable: true,
            render: (r) => (
                <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        r.status === 'fulfilled'
                            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                            : r.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                    }`}
                >
                    {r.status}
                </span>
            ),
        },
        { accessor: 'createdAt', title: 'Date', sortable: true, render: (r) => formatDate(r.createdAt) },
        {
            accessor: 'actions',
            title: 'Action',
            width: 140,
            render: (r) => (
                <div className="flex items-center gap-2">
                    {r.status === 'pending' && (
                        <button
                            type="button"
                            onClick={() => handleFulfill(r._id)}
                            disabled={fulfillId !== null}
                            className="btn btn-primary btn-sm text-xs py-1.5 px-3 rounded-lg disabled:opacity-50"
                        >
                            {fulfillId === r._id ? '...' : 'Fulfill'}
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const backUrl = '/pos/commission-shop-management';
    const title = state?.shopOwnerName ? `View Record — ${state.shopOwnerName}` : 'View Record';
    const description = selectedCropName
        ? `Requests from shop owner for crop: ${selectedCropName}`
        : 'Select a crop to see POS requests from this shop owner.';

    return (
        <div>
            <PageHeader
                title={selectedCropName ? `View Record — ${selectedCropName}` : title}
                description={description}
                onBack={() => (selectedCropId ? setSelectedCropId(null) : navigate(backUrl))}
                backLabel={selectedCropId ? 'Back to crops' : 'Back to Connections'}
            />

            {loading ? (
                <div className="panel p-12 flex justify-center">
                    <span className="animate-spin inline-block w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full" />
                </div>
            ) : !selectedCropId ? (
                <div className="panel bg-white dark:bg-[#0e1726] p-6 rounded-2xl border border-white-dark/10 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Select a crop to see its related POS requests:</p>
                    {cropGroups.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No requests or records for this shop owner.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cropGroups.map((g) => (
                                <button
                                    key={g.cropId}
                                    type="button"
                                    onClick={() => setSelectedCropId(g.cropId)}
                                    className="flex items-center justify-between p-5 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 text-left transition"
                                >
                                    <span className="font-semibold text-gray-900 dark:text-white">{g.cropName}</span>
                                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">{g.records.length} request(s)</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="panel bg-white dark:bg-[#0e1726] p-5 rounded-2xl border border-white-dark/10 shadow-sm">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="flex-1 min-w-[200px] relative">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search by receipt, customer, CNIC or status..."
                                className="form-input w-full pl-10 rounded-lg"
                            />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {totalRecords} record(s)
                        </div>
                    </div>
                    <div className="datatables">
                        <DataTable
                            withTableBorder
                            borderRadius="md"
                            striped
                            highlightOnHover
                            records={pageRecords}
                            columns={columns}
                            totalRecords={totalRecords}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={(size) => {
                                setPageSize(size);
                                setPage(1);
                            }}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords: total }) => `Showing ${from} to ${to} of ${total}`}
                            noRecordsText="No records for this crop."
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PosViewRecordPage;
