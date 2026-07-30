import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { Notification } from '../../helperComponents/Notification';
import { getSupportBasePath, getAppDashboardPath } from '../../utils/supportPaths';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconMenuChat from '../../components/Icon/Menu/IconMenuChat';

// Shared style tokens — matched to AddNewCrop.tsx / CreateTicket.tsx so this
// page stays visually consistent with the rest of the app (green theme).
const card =
    'rounded-[2rem] border border-white-light bg-white/95 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#0b1526]/85';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-success/10 text-success dark:bg-success/20';
const sectionHeading = 'text-lg font-semibold text-gray-900 dark:text-white';

interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    description?: string;
    status: number;
    priority: number;
    category?: string;
    createdAt: string;
    userId?: { userNameF?: string; userNameL?: string };
}

const MyTickets = () => {
    const { t, i18n } = useTranslation();
    const supportBase = getSupportBasePath();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        dispatch(setPageTitle('My Support Tickets'));
    }, [dispatch]);

    // Status: 0=Open, 1=In Progress, 2=Resolved, 3=Closed
    const statusLabel = (status: number): string => {
        switch (status) {
            case 0: return t('support_status_open', 'Open');
            case 1: return t('support_status_in_progress', 'In Progress');
            case 2: return t('support_status_resolved', 'Resolved');
            case 3: return t('support_status_closed', 'Closed');
            default: return t('support_status_unknown', 'Unknown');
        }
    };

    // Priority: 0=Low, 1=Medium, 2=High, 3=Urgent
    const priorityLabel = (priority: number): string => {
        switch (priority) {
            case 0: return t('support_pri_low', 'Low');
            case 1: return t('support_pri_medium', 'Medium');
            case 2: return t('support_pri_high', 'High');
            case 3: return t('support_pri_urgent', 'Urgent');
            default: return t('support_pri_unknown', 'Unknown');
        }
    };

    const statusBadgeClass = (status: number): string => {
        switch (status) {
            case 0: return 'bg-warning/15 text-warning dark:bg-warning/20';
            case 1: return 'bg-success/10 text-success dark:bg-success/20';
            case 2: return 'bg-success/15 text-success dark:bg-success/20';
            case 3: return 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300';
        }
    };

    const fetchTickets = () => {
        setLoading(true);
        const params: Record<string, string | number> = { page, limit: 20 };
        if (statusFilter !== '') params.status = statusFilter;
        axios
            .get(`${ServerSetting.apiUrl}/support/tickets`, {
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
                Notification({ text: err.response?.data?.message || t('support_load_failed'), color: 'danger' });
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (token) fetchTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, page, statusFilter]);

    const formatDate = (d: string) => {
        if (!d) return '';
        const dt = new Date(d);
        return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <button
                type="button"
                onClick={() => window.location.assign(getAppDashboardPath())}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
            >
                <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('support_back_dashboard')}
            </button>

            <div className={card}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className={iconBadge}>
                            <span className="text-lg">🎫</span>
                        </span>
                        <div>
                            <h2 className={sectionHeading}>{t('support_my_tickets_title')}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('support_my_tickets_desc')}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            className="rounded-2xl border border-gray-300 bg-white/80 px-3 py-2 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#0b1526]/60 dark:text-gray-200"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">{t('support_all_status')}</option>
                            {[0, 1, 2, 3].map((k) => (
                                <option key={k} value={k}>
                                    {statusLabel(k)}
                                </option>
                            ))}
                        </select>
                        <Link
                            to={`${supportBase}/new`}
                            className="flex items-center gap-2 rounded-2xl bg-success px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-success/90"
                        >
                            {t('support_new_ticket')}
                        </Link>
                    </div>
                </div>
            </div>

            <div className={card}>
                {loading ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-success border-t-transparent"></div>
                        <p className="text-gray-500 dark:text-gray-400">{t('loading')}</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/5">
                            <IconMenuChat className="w-7 h-7 text-success/60" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">{t('support_no_tickets')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white-light dark:border-white/10">
                        <table className="w-full table-auto text-sm">
                            <thead>
                                <tr className="border-b border-white-light bg-gray-50 dark:border-white/10 dark:bg-white/5">
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">{t('support_col_ticket')}</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">{t('support_col_subject')}</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">{t('support_col_status')}</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">{t('support_col_priority')}</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">{t('support_col_category')}</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">{t('support_col_created')}</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-500 dark:text-gray-400">{t('support_col_action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket) => (
                                    <tr key={ticket._id} className="border-b border-white-light transition-colors last:border-0 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5">
                                        <td className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300">{ticket.ticketNumber}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{ticket.subject}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${statusBadgeClass(ticket.status)}`}>
                                                {statusLabel(ticket.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{priorityLabel(ticket.priority)}</td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{ticket.category || 'general'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(ticket.createdAt)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                to={`${supportBase}/ticket/${ticket._id}`}
                                                className="inline-flex items-center rounded-xl border-2 border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                                            >
                                                {t('support_view_chat')}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-white-light px-4 py-3 dark:border-white/10">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="rounded-xl border-2 border-green-600 px-3 py-1.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                                >
                                    {t('support_page_prev')}
                                </button>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('support_page_of', { page, total: totalPages })}</span>
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="rounded-xl border-2 border-green-600 px-3 py-1.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                                >
                                    {t('support_page_next')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTickets;