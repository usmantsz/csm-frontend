import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { Notification } from '../../helperComponents/Notification';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';

interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    status: number;
    priority: number;
    category?: string;
    createdAt: string;
    userId?: { userNameF?: string; userNameL?: string; userEmail?: string };
    assignedTo?: { userNameF?: string; userNameL?: string } | null;
}

const SupportTicketsAll = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Recomputed on every language change (i18n.language in the deps) so it
    // never gets "frozen" on whatever language was active when the file
    // first loaded — this was the root cause of needing a refresh.
    const STATUS_MAP: Record<number, string> = useMemo(
        () => ({
            0: t('support_st_open'),
            1: t('support_st_progress'),
            2: t('support_st_resolved'),
            3: t('support_st_closed'),
        }),
        [t, i18n.language]
    );

    useEffect(() => {
        dispatch(setPageTitle('All Support Tickets'));
    }, [dispatch]);

    const fetchTickets = () => {
        setLoading(true);
        const params: Record<string, string | number> = { page, limit: 20 };
        if (statusFilter !== '') params.status = statusFilter;
        axios
            .get(`${ServerSetting.apiUrl}/support/tickets/all`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            })
            .then((res) => {
                if (res.data?.success && res.data?.data) {
                    setTickets(res.data.data.tickets || []);
                    setTotalPages(res.data.data.pagination?.totalPages || 1);
                }
            })
            .catch((err) => {
                Notification({ text: err.response?.data?.message || 'Failed to load tickets', color: 'danger' });
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (token) fetchTickets();
    }, [token, page, statusFilter]);

    const formatDate = (d: string) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString() + ' ' + new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const statusBadgeClass = (status: number) => {
        if (status === 0) return 'bg-warning/15 text-warning border border-warning/30';
        if (status === 3) return 'bg-gray-200 text-gray-700 border border-gray-300 dark:bg-white/10 dark:text-gray-300 dark:border-white/10';
        return 'bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                >
                    <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    {t('back_to_dashboard')}
                </button>

                <select
                    className="form-select w-full sm:w-48"
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">{t('support_all_status')}</option>
                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
            </div>

            <div className="rounded-[2rem] border border-white-light bg-white/95 dark:bg-[#0b1526]/85 dark:border-white/10 p-6 shadow-sm transition-shadow hover:shadow-md">
                <h1 className="mb-4 text-xl font-bold text-success sm:text-2xl">{t('all_support_tickets')}</h1>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <span className="animate-spin border-2 border-primary border-t-transparent rounded-full w-8 h-8 inline-block" />
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary dark:bg-primary/20">
                            🎫
                        </span>
                        <h2 className="mt-2 text-lg font-bold text-gray-700 dark:text-gray-200">{t('support_no_tickets_found')}</h2>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table-auto w-full">
                            <thead>
                                <tr className="border-b border-white-light dark:border-white/10">
                                    <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400 font-semibold">Ticket #</th>
                                    <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400 font-semibold">Subject</th>
                                    <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400 font-semibold">Shop Owner</th>
                                    <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400 font-semibold">Status</th>
                                    <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400 font-semibold">Assigned To</th>
                                    <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400 font-semibold">Created</th>
                                    <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400 font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket) => (
                                    <tr key={ticket._id} className="border-b border-white-light dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                                        <td className="px-4 py-3 font-mono text-sm">{ticket.ticketNumber}</td>
                                        <td className="px-4 py-3 max-w-[220px] truncate" title={ticket.subject}>{ticket.subject}</td>
                                        <td className="px-4 py-3 truncate max-w-[160px]">
                                            {ticket.userId ? `${ticket.userId.userNameF || ''} ${ticket.userId.userNameL || ''}` : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`badge ${statusBadgeClass(ticket.status)}`}>
                                                {STATUS_MAP[ticket.status] ?? ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 truncate max-w-[160px]">
                                            {ticket.assignedTo ? `${ticket.assignedTo.userNameF || ''} ${ticket.assignedTo.userNameL || ''}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(ticket.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <Link to={`/support/ticket/${ticket._id}`} className="btn btn-sm btn-outline-primary rounded-xl whitespace-nowrap">
                                                View / Reply
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary rounded-xl"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary rounded-xl"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportTicketsAll;
