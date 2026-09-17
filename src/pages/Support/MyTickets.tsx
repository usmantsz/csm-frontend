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

// Shared style tokens — dark variant matched to the Stitch "Support Tickets"
// design (obsidian panels / emerald accents); light mode keeps the app's
// existing look so nothing breaks outside dark mode.
const card =
    'rounded-2xl border border-white-light bg-white/95 shadow-sm transition-shadow hover:shadow-md dark:border-[#152436] dark:bg-[#0c1724] dark:shadow-xl';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-success/10 text-success dark:bg-success/20';
const sectionHeading = 'text-lg font-semibold text-gray-900 dark:text-white';

// Status: 0=Open, 1=In Progress, 2=Resolved, 3=Closed
const STATUS_FILTER_ICONS: Record<string, JSX.Element> = {
    '': (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    '0': (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    '1': (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    '2': (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    '3': (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
    ),
};

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

    const FILTERS: { value: string; label: string }[] = [
        { value: '', label: t('support_all_status') },
        { value: '0', label: statusLabel(0) },
        { value: '1', label: statusLabel(1) },
        { value: '2', label: statusLabel(2) },
        { value: '3', label: statusLabel(3) },
    ];

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
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-emerald-500/30 dark:bg-[#0d2222]/50 dark:text-emerald-400 dark:hover:border-emerald-500/60 dark:hover:bg-[#0d2222] dark:hover:text-emerald-400"
            >
                <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('support_back_dashboard')}
            </button>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* LEFT: filter & actions panel */}
                <div className="lg:col-span-4">
                    <div className={`${card} flex h-full flex-col p-5`}>
                        <Link
                            to={`${supportBase}/new`}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-success px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-success/90 dark:bg-emerald-600 dark:shadow-emerald-950/50 dark:hover:bg-emerald-500"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            {t('support_new_ticket')}
                        </Link>

                        <div className="mt-6 flex-1 space-y-2">
                            {FILTERS.map((f) => {
                                const active = statusFilter === f.value;
                                return (
                                    <button
                                        key={f.value || 'all'}
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter(f.value);
                                            setPage(1);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                                            active
                                                ? 'bg-success/10 text-success dark:border dark:border-emerald-500/30 dark:bg-[#112436]/90 dark:text-emerald-400'
                                                : 'text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-[#0f1d2c] dark:hover:text-white'
                                        }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className={active ? 'text-success dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'}>
                                                {STATUS_FILTER_ICONS[f.value]}
                                            </span>
                                            {f.label}
                                        </span>
                                        {active && (
                                            <span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-semibold text-success dark:border-emerald-500/20 dark:bg-[#0a1824] dark:text-emerald-400">
                                                {tickets.length}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="border-t border-white-light pt-4 dark:border-[#152436]">
                            <button
                                type="button"
                                onClick={fetchTickets}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-success/30 px-4 py-2.5 text-xs font-medium text-success transition-colors hover:bg-success/10 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:border-emerald-500/60 dark:hover:bg-emerald-950/30"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {t('support_refresh', 'Refresh')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: tickets list / empty state */}
                <div className="lg:col-span-8">
                    <div className={`${card} flex h-full flex-col overflow-hidden`}>
                        <div className="flex items-center justify-between border-b border-white-light px-6 py-4 dark:border-[#152436]">
                            <h1 className="text-base font-bold text-gray-900 dark:text-white">{t('support_my_tickets_title')}</h1>
                            <span className="text-xs text-gray-500 dark:text-slate-500">
                                {t('support_showing_count', { count: tickets.length, defaultValue: `Showing ${tickets.length}` })}
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                                <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-success border-t-transparent dark:border-emerald-500 dark:border-t-transparent"></div>
                                <p className="text-gray-500 dark:text-slate-400">{t('loading')}</p>
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-50 shadow-inner dark:border dark:border-[#1a2f44] dark:bg-[#102030]">
                                    <IconMenuChat className="h-9 w-9 text-success/60 dark:text-slate-500" />
                                </div>
                                <h2 className="mb-2 text-xl font-bold text-gray-800 dark:text-slate-200">{t('support_no_tickets')}</h2>
                                <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-slate-400">{t('support_my_tickets_desc')}</p>
                                <Link
                                    to={`${supportBase}/new`}
                                    className="rounded-full bg-success px-8 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-success/90 dark:bg-emerald-600 dark:shadow-emerald-950/60 dark:hover:bg-emerald-500"
                                >
                                    {t('support_new_ticket')}
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col overflow-x-auto">
                                <table className="w-full table-auto text-sm">
                                    <thead>
                                        <tr className="border-b border-white-light bg-gray-50 dark:border-[#152436] dark:bg-white/[0.02]">
                                            <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-500">{t('support_col_ticket')}</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-500">{t('support_col_subject')}</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-500">{t('support_col_status')}</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-500">{t('support_col_priority')}</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-500">{t('support_col_category')}</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-500">{t('support_col_created')}</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-500 dark:text-slate-500">{t('support_col_action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tickets.map((ticket) => (
                                            <tr key={ticket._id} className="border-b border-white-light transition-colors last:border-0 hover:bg-gray-50 dark:border-[#152436] dark:hover:bg-white/[0.03]">
                                                <td className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-slate-300">{ticket.ticketNumber}</td>
                                                <td className="px-4 py-3 font-medium text-gray-800 dark:text-slate-200">{ticket.subject}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${statusBadgeClass(ticket.status)}`}>
                                                        {statusLabel(ticket.status)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{priorityLabel(ticket.priority)}</td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{ticket.category || 'general'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-500">{formatDate(ticket.createdAt)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        to={`${supportBase}/ticket/${ticket._id}`}
                                                        className="inline-flex items-center rounded-xl border-2 border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-emerald-500/40 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                                                    >
                                                        {t('support_view_chat')}
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between border-t border-white-light px-4 py-3 dark:border-[#152436]">
                                        <button
                                            type="button"
                                            disabled={page <= 1}
                                            onClick={() => setPage((p) => p - 1)}
                                            className="rounded-xl border-2 border-green-600 px-3 py-1.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500/40 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                                        >
                                            {t('support_page_prev')}
                                        </button>
                                        <span className="text-sm text-gray-500 dark:text-slate-400">{t('support_page_of', { page, total: totalPages })}</span>
                                        <button
                                            type="button"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage((p) => p + 1)}
                                            className="rounded-xl border-2 border-green-600 px-3 py-1.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500/40 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                                        >
                                            {t('support_page_next')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyTickets;
