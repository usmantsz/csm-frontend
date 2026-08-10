import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Swal from 'sweetalert2';
import { DataTable } from 'mantine-datatable';
import { ServerSetting } from '../../helperComponents/ServerSetting';

type TargetType = 'pos_user' | 'shop_owner';

type UserInfo = {
    _id: string;
    userNameF?: string;
    userNameL?: string;
    userCNIC?: number | string;
    userEmail?: string;
    userPhone?: number | string;
    userProvince?: string;
    userCity?: string;
    userAdress?: string;
};

type RequestItem = {
    _id: string;
    fromUserId: UserInfo;
    toUserId: UserInfo;
    status: string;
    createdAt?: string;
    otherName?: string;
    otherShopName?: string;
    otherCNIC?: string;
    otherUser?: UserInfo;
};

type ConnectionItem = {
    _id: string;
    fromUserId: UserInfo;
    toUserId: UserInfo;
    status: string;
    otherUser?: UserInfo;
    otherName?: string;
    otherShopName?: string;
    otherCNIC?: string;
    respondedAt?: string;
    createdAt?: string;
};

type BlockedListItem = {
    blockedUserId: string;
    name: string;
    shopName: string;
    blockedAt?: string;
};

type TableRow = {
    id: string;
    name: string;
    shopName: string;
    cnic: string;
    type: 'Received' | 'Sent' | 'Connected';
    status: string;
    rowDate: string;
    otherUser?: UserInfo;
    request?: RequestItem;
    connection?: ConnectionItem;
};

const PAGE_SIZES = [10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

type Props = {
    targetType: TargetType;
    targetLabel: string;
};

const ConnectionsPanel = ({ targetType, targetLabel }: Props) => {
    const { t } = useTranslation();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const [requests, setRequests] = useState<{ received: RequestItem[]; sent: RequestItem[] }>({ received: [], sent: [] });
    const [connections, setConnections] = useState<ConnectionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [respondId, setRespondId] = useState<string | null>(null);
    const [rejectRemarks, setRejectRemarks] = useState('');
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [search, setSearch] = useState('');
    const [detailsRow, setDetailsRow] = useState<TableRow | null>(null);
    const navigate = useNavigate();

    // Add New modal
    const [modalOpen, setModalOpen] = useState(false);
    const [cnic, setCnic] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupResult, setLookupResult] = useState<{ name: string; shopName: string; userId: string; alreadyConnected?: boolean; pendingRequest?: boolean } | null>(null);
    const [sending, setSending] = useState(false);
    const [blockedList, setBlockedList] = useState<BlockedListItem[]>([]);

    const fetchBlocks = () => {
        if (!token) return;
        axios
            .get(`${ServerSetting.apiUrl}/connections/blocks`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((r) => {
                if (r.data?.status === 200 && Array.isArray(r.data.data)) setBlockedList(r.data.data);
                else setBlockedList([]);
            })
            .catch(() => setBlockedList([]));
    };

    const fetchData = () => {
        if (!token) return;
        setLoading(true);
        Promise.all([
            axios.get(`${ServerSetting.apiUrl}/connections/requests`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
            axios.get(`${ServerSetting.apiUrl}/connections/list`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }),
        ])
            .then(([reqRes, listRes]) => {
                if (reqRes.data?.data) setRequests(reqRes.data.data);
                if (listRes.data?.data) setConnections(listRes.data.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
        fetchBlocks();
    }, [token]);

    const formatShortDate = (iso?: string) => {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return '—';
        }
    };

    const rows: TableRow[] = [];
    const fallbackName = (parts: (string | undefined)[]) =>
        (parts.filter(Boolean).join(' ').trim() || '—');

    requests.received?.forEach((r) => {
        const other = r.fromUserId;
        rows.push({
            id: r._id,
            name: r.otherName ?? fallbackName([other?.userNameF, other?.userNameL]),
            shopName: r.otherShopName ?? '—',
            cnic: r.otherCNIC ?? (other?.userCNIC != null ? String(other.userCNIC) : '—'),
            type: 'Received',
            status: 'Pending',
            rowDate: formatShortDate(r.createdAt),
            otherUser: other,
            request: r,
        });
    });
    requests.sent?.forEach((r) => {
        const other = r.toUserId;
        rows.push({
            id: r._id,
            name: r.otherName ?? fallbackName([other?.userNameF, other?.userNameL]),
            shopName: r.otherShopName ?? '—',
            cnic: r.otherCNIC ?? (other?.userCNIC != null ? String(other.userCNIC) : '—'),
            type: 'Sent',
            status: 'Pending',
            rowDate: formatShortDate(r.createdAt),
            otherUser: other,
            request: r,
        });
    });
    connections?.forEach((c) => {
        const other = c.otherUser;
        rows.push({
            id: c._id,
            name: c.otherName ?? fallbackName([other?.userNameF, other?.userNameL]),
            shopName: c.otherShopName ?? '—',
            cnic: c.otherCNIC ?? (other?.userCNIC != null ? String(other.userCNIC) : '—'),
            type: 'Connected',
            status: 'Accepted',
            rowDate: formatShortDate(c.respondedAt || c.createdAt),
            otherUser: other,
            connection: c,
        });
    });

    const searchLower = search.trim().toLowerCase();
    const filteredRows = searchLower
        ? rows.filter(
            (row) =>
                row.name.toLowerCase().includes(searchLower) ||
                row.shopName.toLowerCase().includes(searchLower) ||
                row.cnic.replace(/\D/g, '').includes(searchLower.replace(/\D/g, ''))
        )
        : rows;

    const totalRows = filteredRows.length;
    const currentPage = Math.min(page, Math.max(1, Math.ceil(totalRows / pageSize)));
    const start = (currentPage - 1) * pageSize;
    const paginatedRows = filteredRows.slice(start, start + pageSize);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    const handleLookup = () => {
        const cnicTrim = cnic.replace(/\D/g, '').trim();
        if (cnicTrim.length < 10) {
            setError(t('valid_cnic_required'));
            return;
        }
        if (!token) return;
        setError('');
        setLookupResult(null);
        setLookupLoading(true);
        axios
            .get(`${ServerSetting.apiUrl}/connections/lookup`, {
                params: { targetCNIC: cnicTrim, targetType },
                headers: { Authorization: `Bearer ${token}` },
                validateStatus: () => true,
            })
            .then((res) => {
                if (res.data?.status === 200 && res.data?.data) {
                    setLookupResult(res.data.data);
                } else {
                    setError(res.data?.message || t('user_not_found'));
                }
            })
            .catch(() => setError(t('lookup_failed')))
            .finally(() => setLookupLoading(false));
    };

    const handleConfirmSend = () => {
        if (!lookupResult || !token) return;
        const cnicTrim = cnic.replace(/\D/g, '').trim();
        setSending(true);
        axios
            .post(
                `${ServerSetting.apiUrl}/connections/request`,
                { targetCNIC: cnicTrim, targetType },
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            )
            .then((res) => {
                if (res.data?.status === 201) {
                    Swal.fire({ title: t('saved'), text: t('request_sent_success'), icon: 'success', timer: 2000, showConfirmButton: false });
                    setModalOpen(false);
                    setCnic('');
                    setLookupResult(null);
                    fetchData();
                } else {
                    Swal.fire({ title: t('error'), text: res.data?.message || t('request_failed'), icon: 'error' });
                }
            })
            .catch(() => Swal.fire({ title: t('error'), text: t('request_failed'), icon: 'error' }))
            .finally(() => setSending(false));
    };

    const openSendConfirm = () => {
        if (!lookupResult) return;
        Swal.fire({
            title: t('confirm_send_request'),
            html: `
                <p class="text-left mb-2"><strong>${targetLabel} ${t('name')}:</strong> ${lookupResult.name}</p>
                <p class="text-left mb-2"><strong>${t('shop_name')}:</strong> ${lookupResult.shopName}</p>
                <p class="text-gray-600 dark:text-gray-400 text-sm">${t('send_request_confirm_prompt', { label: targetLabel })}</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: t('yes_send_request'),
        }).then((result) => {
            if (result.isConfirmed) handleConfirmSend();
        });
    };

    const handleRespond = (id: string, action: 'accept' | 'reject') => {
        if (!token) return;
        if (action === 'reject') {
            Swal.fire({
                title: t('reject_request'),
                input: 'textarea',
                inputLabel: t('remarks_required'),
                inputPlaceholder: t('remarks_placeholder'),
                inputAttributes: { maxlength: '500' },
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: t('reject'),
            }).then((result) => {
                if (result.isConfirmed && result.value && String(result.value).trim()) {
                    doRespond(id, 'reject', String(result.value).trim());
                } else if (result.isConfirmed) {
                    Swal.fire({ title: t('required'), text: t('remarks_required_reject'), icon: 'warning' });
                }
            });
            return;
        }
        doRespond(id, 'accept', '');
    };

    const doRespond = (id: string, action: 'accept' | 'reject', remarks: string) => {
        if (!token) return;
        setRespondId(id);
        axios
            .patch(
                `${ServerSetting.apiUrl}/connections/${id}/respond`,
                { action, remarks },
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            )
            .then((res) => {
                if (res.data?.status === 200) {
                    Swal.fire({ title: action === 'accept' ? t('accepted') : t('rejected'), text: res.data.message, icon: 'success', timer: 2000, showConfirmButton: false });
                    setRespondId(null);
                    fetchData();
                } else {
                    Swal.fire({ title: t('error'), text: res.data?.message || t('action_failed'), icon: 'error' });
                }
            })
            .catch(() => Swal.fire({ title: t('error'), text: t('action_failed'), icon: 'error' }))
            .finally(() => setRespondId(null));
    };

    const handleBlockConnected = (row: TableRow) => {
        const bid = row.otherUser?._id;
        if (!bid || !token) return;
        Swal.fire({
            title: t('connections_block_user'),
            text: t('connections_block_confirm'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
        }).then((result) => {
            if (!result.isConfirmed) return;
            axios
                .post(
                    `${ServerSetting.apiUrl}/connections/block`,
                    { blockedUserId: bid },
                    { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
                )
                .then((res) => {
                    if (res.data?.status === 200) {
                        Swal.fire({ title: t('saved'), text: t('connections_blocked_ok'), icon: 'success', timer: 2000, showConfirmButton: false });
                        fetchBlocks();
                    } else {
                        Swal.fire({ title: t('error'), text: res.data?.message || t('request_failed'), icon: 'error' });
                    }
                })
                .catch(() => Swal.fire({ title: t('error'), text: t('request_failed'), icon: 'error' }));
        });
    };

    const handleUnblock = (blockedUserId: string) => {
        if (!token) return;
        axios
            .delete(`${ServerSetting.apiUrl}/connections/block/${blockedUserId}`, {
                headers: { Authorization: `Bearer ${token}` },
                validateStatus: () => true,
            })
            .then((res) => {
                if (res.data?.status === 200) {
                    Swal.fire({ title: t('saved'), text: t('connections_unblocked_ok'), icon: 'success', timer: 1800, showConfirmButton: false });
                    fetchBlocks();
                } else {
                    Swal.fire({ title: t('error'), text: res.data?.message || t('action_failed'), icon: 'error' });
                }
            })
            .catch(() => Swal.fire({ title: t('error'), text: t('action_failed'), icon: 'error' }));
    };

    return (
        <div className="panel bg-white dark:bg-[#0e1726] p-5 sm:p-6 rounded-2xl border border-gray-300 dark:border-white/5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shadow-lg shadow-gray-600/40 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 shrink-0">
                        <svg className="w-4 h-4 shadow-lg shadow-gray-600/40 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 3v-2a4 4 0 00-3-3.87M7 10a4 4 0 108 0 4 4 0 00-8 0z" />
                        </svg>
                    </span>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('connect_with_target', { label: targetLabel })}</h2>
                </div>
                <button
    type="button"
    onClick={() => { setModalOpen(true); setCnic(''); setLookupResult(null); setError(''); }}
    className="btn bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white border-0 px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-[#16a34a]/20 transition-colors"
>
    {t('add_new')}
</button>
            </div>

            {blockedList.length > 0 && (
                <div className="mb-6 p-4 rounded-2xl border border-amber-300 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 shadow-sm">
                    <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-3">{t('connections_blocked_list')}</h3>
                    <ul className="space-y-2">
                        {blockedList.map((b) => (
                            <li key={b.blockedUserId} className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-white/5 border border-amber-200 dark:border-transparent rounded-xl px-3 py-2 text-sm shadow-sm hover:shadow-md transition-shadow">
                                <span className="text-gray-800 dark:text-gray-200">
                                    <span className="font-medium">{b.name}</span>
                                    <span className="text-gray-400 dark:text-gray-500"> — {b.shopName}</span>
                                </span>
                                <button type="button" onClick={() => handleUnblock(b.blockedUserId)} className="btn btn-outline-secondary text-xs py-1 px-3 rounded-lg">
                                    {t('connections_unblock')}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Add New Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]" onClick={() => !sending && setModalOpen(false)}>
                    <div className="bg-white dark:bg-[#0e1726] rounded-2xl shadow-2xl border border-gray-300 dark:border-white/10 w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('send_request_to', { label: targetLabel })}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label text-sm font-medium">CNIC</label>
                                <input
                                    type="text"
                                    value={cnic}
                                    onChange={(e) => setCnic(e.target.value)}
                                    placeholder="3310112345678"
                                    className="form-input w-full rounded-xl"
                                    maxLength={20}
                                    disabled={!!lookupResult}
                                />
                            </div>
                            {error && (
                                <p className="text-danger text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}
                            {lookupResult && (
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 space-y-2 shadow-sm">
                                    <p><strong>{t('name')}:</strong> {lookupResult.name}</p>
                                    <p><strong>{t('shop_name')}:</strong> {lookupResult.shopName}</p>
                                    {lookupResult.alreadyConnected && (
                                        <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm mt-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2">
                                            {t('already_connected_msg', { label: targetLabel })}
                                        </p>
                                    )}
                                    {lookupResult.pendingRequest && !lookupResult.alreadyConnected && (
                                        <p className="text-amber-600 dark:text-amber-400 font-medium text-sm mt-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
                                            {t('request_pending_msg', { label: targetLabel })}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="flex gap-2 flex-wrap pt-1">
                                {!lookupResult ? (
                                    <button type="button" onClick={handleLookup} disabled={lookupLoading} className="btn bg-primary text-white border-0 px-4 py-2 rounded-xl disabled:opacity-50">
                                        {lookupLoading ? t('looking_up') : t('lookup')}
                                    </button>
                                ) : (lookupResult.alreadyConnected || lookupResult.pendingRequest) ? (
                                    <button type="button" disabled className="btn bg-gray-400 dark:bg-gray-600 text-white border-0 px-4 py-2 rounded-xl cursor-not-allowed opacity-75">
                                        {lookupResult.alreadyConnected ? t('already_connected') : t('request_pending')}
                                    </button>
                                ) : (
                                    <button type="button" onClick={openSendConfirm} disabled={sending} className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-0 px-4 py-2 rounded-xl disabled:opacity-50">
                                        {sending ? t('sending') : t('confirm_send')}
                                    </button>
                                )}
                                <button type="button" onClick={() => { setModalOpen(false); setLookupResult(null); setError(''); }} disabled={sending} className="btn btn-outline-secondary px-4 py-2 rounded-xl">
                                    {t('cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-14">
                    <span className="animate-spin inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder={t('search_by_name_shop_cnic')}
                                className="form-input w-full rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="datatables rounded-xl overflow-hidden border border-gray-300 dark:border-white/5 shadow-sm relative">
                        {totalRows === 0 && (
                            <div className="absolute inset-x-0 top-[52px] z-10 flex flex-col items-center justify-center gap-2 py-10 pointer-events-none">
                                <span className="text-3xl">📭</span>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {rows.length === 0 ? t('no_requests_or_connections') : t('no_results_match_search')}
                                </p>
                            </div>
                        )}
                        <DataTable
                            idAccessor="id"
                            className="whitespace-nowrap table-hover"
                            highlightOnHover
                            records={paginatedRows.map((row, idx) => ({ ...row, __rowNum: start + idx + 1 }))}
                            columns={[
                                { accessor: '__rowNum', title: '#', width: 60, render: (r) => (r as TableRow & { __rowNum: number }).__rowNum },
                                { accessor: 'name', title: t('name'), render: (r) => <span className="font-medium text-gray-800 dark:text-white">{r.name}</span> },
                                { accessor: 'cnic', title: 'CNIC', render: (r) => <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{r.cnic}</span> },
                                { accessor: 'shopName', title: t('shop_name'), render: (r) => <span className="text-gray-700 dark:text-gray-300">{r.shopName}</span> },
                                { accessor: 'rowDate', title: t('connections_table_date'), render: (r) => <span className="text-gray-600 dark:text-gray-400 text-sm">{r.rowDate}</span> },
                                {
                                    accessor: 'type',
                                    title: t('type'),
                                    render: (r) => (
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.type === 'Received' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : r.type === 'Sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                                            {r.type === 'Received' ? t('received') : r.type === 'Sent' ? t('sent') : t('connected')}
                                        </span>
                                    ),
                                },
                                { accessor: 'status', title: t('status') },
                                {
                                    accessor: 'actions',
                                    title: t('actions'),
                                    render: (row) => (
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <button type="button" onClick={() => setDetailsRow(row)} className="btn bg-primary/90 hover:bg-primary text-white text-xs py-1.5 px-3 rounded-lg transition-colors">
                                                {t('view_details_btn')}
                                            </button>
                                            {targetType === 'shop_owner' && row.otherUser?._id && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/pos/view-record/' + row.otherUser!._id, { state: { shopOwnerName: row.name, shopName: row.shopName } })}
                                                    className="btn btn-outline-secondary text-xs py-1.5 px-3 rounded-lg"
                                                >
                                                    {t('view_record')}
                                                </button>
                                            )}
                                            {row.type === 'Received' && row.request && (
                                                <>
                                                    <button type="button" onClick={() => handleRespond(row.id, 'accept')} disabled={respondId !== null} className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3 rounded-lg disabled:opacity-50 transition-colors">
                                                        {t('accept')}
                                                    </button>
                                                    <button type="button" onClick={() => handleRespond(row.id, 'reject')} disabled={respondId !== null} className="btn btn-outline-danger text-xs py-1.5 px-3 rounded-lg disabled:opacity-50">
                                                        {t('reject')}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ),
                                },
                            ]}
                            totalRecords={totalRows}
                            recordsPerPage={pageSize}
                            page={currentPage}
                            onPageChange={setPage}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={(size) => { setPageSize(size); setPage(1); }}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) =>
                                totalRecords === 0 ? '' : `Showing ${from} to ${to} of ${totalRecords}`
                            }
                            noRecordsText=""
                        />
                    </div>

                    {/* View Details Modal - rendered via portal so it shows above layout on /pos-shop-management */}
                    {detailsRow && createPortal(
                        (() => {
                            const u = detailsRow.otherUser ?? detailsRow.request?.fromUserId ?? detailsRow.request?.toUserId ?? detailsRow.connection?.otherUser;
                            const val = (v: string | number | null | undefined) => (v !== undefined && v !== null && String(v).trim() !== '' ? String(v).trim() : '—');
                            return (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]" onClick={() => setDetailsRow(null)}>
                                    <div className="bg-white dark:bg-[#0e1726] rounded-2xl shadow-2xl border border-gray-300 dark:border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between sticky top-0 bg-white dark:bg-[#0e1726]">
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('target_details', { label: targetLabel })}</h3>
                                            <button type="button" onClick={() => setDetailsRow(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors">×</button>
                                        </div>
                                        <div className="p-6 space-y-6">
                                            <div>
                                                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">{t('personal_details')}</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400 mb-0.5">{t('name')}</p>
                                                        <p className="text-gray-800 dark:text-white font-medium">{detailsRow.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400 mb-0.5">CNIC</p>
                                                        <p className="text-gray-800 dark:text-white font-mono">{detailsRow.cnic}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400 mb-0.5">{t('email')}</p>
                                                        <p className="text-gray-800 dark:text-white break-all">{val(u?.userEmail)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400 mb-0.5">{t('phone')}</p>
                                                        <p className="text-gray-800 dark:text-white">{u?.userPhone !== undefined && u?.userPhone !== null ? String(u.userPhone) : '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400 mb-0.5">{t('province')}</p>
                                                        <p className="text-gray-800 dark:text-white">{val(u?.userProvince)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400 mb-0.5">{t('city')}</p>
                                                        <p className="text-gray-800 dark:text-white">{val(u?.userCity)}</p>
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <p className="text-gray-500 dark:text-gray-400 mb-0.5">{t('address')}</p>
                                                        <p className="text-gray-800 dark:text-white">{val(u?.userAdress)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="border-t border-gray-200 dark:border-white/10 pt-5">
                                                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">{t('shop_details')}</h4>
                                                <div className="text-sm">
                                                    <p className="text-gray-500 dark:text-gray-400 mb-0.5">{t('shop_name')}</p>
                                                    <p className="text-gray-800 dark:text-white font-medium">{detailsRow.shopName || '—'}</p>
                                                </div>
                                            </div>
                                            {detailsRow.request?.createdAt && (
                                                <div className="text-sm border-t border-gray-200 dark:border-white/10 pt-5">
                                                    <p className="text-gray-500 dark:text-gray-400 mb-0.5">{t('connections_table_date')}</p>
                                                    <p className="text-gray-800 dark:text-white">{formatShortDate(detailsRow.request.createdAt)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })(),
                        document.body
                    )}

                </>
            )}
        </div>
    );
};

export default ConnectionsPanel;
