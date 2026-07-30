import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { Notification } from '../../helperComponents/Notification';
import PerfectScrollbar from 'react-perfect-scrollbar';
import IconMail from '../../components/Icon/IconMail';
import IconSend from '../../components/Icon/IconSend';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconUser from '../../components/Icon/IconUser';
import IconPaperclip from '../../components/Icon/IconPaperclip';
import IconPlus from '../../components/Icon/IconPlus';
import IconRefresh from '../../components/Icon/IconRefresh';
import { Link } from 'react-router-dom';
import { getSupportBasePath, getAppDashboardPath } from '../../utils/supportPaths';
import SupportRichEditor from '../../components/SupportRichEditor';
import MessageContent from '../../components/MessageContent';

// Layout stays the newer card design; colors follow the original template
// palette (primary/gray/warning/secondary) instead of hardcoded hex.
const card =
    'rounded-[2rem] border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300';
const sectionHeading = 'text-lg font-semibold text-gray-900 dark:text-white';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    description?: string;
    status: number;
    priority: number;
    category?: string;
    createdAt: string;
    userId?: { _id?: string; userNameF?: string; userNameL?: string; userEmail?: string; userPhone?: string; userProfileImage?: string; userCNIC?: string | number };
    shopId?: { shopName?: string; shopNumber?: string; shopAddress?: string; shopCity?: string; shopProvince?: string; shopRegistrationNumber?: string };
}

interface Message {
    _id: string;
    message: string;
    senderType: string;
    senderId?: { userNameF?: string; userNameL?: string };
    attachments?: string[];
    createdAt: string;
}

const SupportMailbox = () => {
    const { t, i18n } = useTranslation();
    const supportBase = getSupportBasePath();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    const isStaff = userRole === '0' || userRole === '2' || userRole === '3';
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingTicket, setLoadingTicket] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const statusLabel = useCallback(
        (s: number) => {
            switch (s) {
                case 0:
                    return t('support_st_open');
                case 1:
                    return t('support_st_progress');
                case 2:
                    return t('support_st_resolved');
                case 3:
                    return t('support_st_closed');
                default:
                    return String(s);
            }
        },
        [t, i18n.language]
    );

    // Restored to the original scheme: warning for open, secondary for closed,
    // primary for everything else.
    const statusBadgeClass = (s: number): string => {
        if (s === 0) return 'bg-warning';
        if (s === 3) return 'bg-secondary';
        return 'bg-primary';
    };

    const STATUS_TABS = useMemo(
        () => [
            { value: '', label: t('support_all_tab') },
            { value: '0', label: t('support_st_open') },
            { value: '1', label: t('support_st_progress') },
            { value: '2', label: t('support_st_resolved') },
            { value: '3', label: t('support_st_closed') },
        ],
        [t, i18n.language]
    );

    useEffect(() => {
        dispatch(setPageTitle(t('support_mailbox_title')));
    }, [dispatch, t, i18n.language]);

    const fetchTickets = () => {
        setLoading(true);
        const params: Record<string, string | number> = { page: 1, limit: 50 };
        if (statusFilter !== '') params.status = statusFilter;
        axios
            .get(`${ServerSetting.apiUrl}/support/tickets`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            })
            .then((res) => {
                if (res.data?.success && res.data?.data) {
                    setTickets(res.data.data.tickets || []);
                }
            })
            .catch(() => Notification({ text: t('support_load_failed'), color: 'danger' }))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (token) fetchTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, statusFilter]);

    const selectTicket = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setMessages([]);
        setReply('');
        setAttachments([]);
        if (!ticket || !token) return;
        setLoadingTicket(true);
        axios
            .get(`${ServerSetting.apiUrl}/support/tickets/${ticket._id}`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: 1, limit: 100 },
            })
            .then((res) => {
                if (res.data?.success && res.data?.data) {
                    setMessages(res.data.data.messages || []);
                }
            })
            .catch(() => Notification({ text: 'Failed to load ticket', color: 'danger' }))
            .finally(() => setLoadingTicket(false));
    };

    const refetchSelectedTicketMessages = () => {
        if (!selectedTicket || !token) return;
        axios
            .get(`${ServerSetting.apiUrl}/support/tickets/${selectedTicket._id}`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: 1, limit: 100 },
            })
            .then((res) => {
                if (res.data?.success && res.data?.data) {
                    setMessages(res.data.data.messages || []);
                }
            })
            .catch(() => {});
    };

    useEffect(() => {
        if (!selectedTicket || !token) return;
        const interval = setInterval(refetchSelectedTicketMessages, 12000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTicket?._id, token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const validateFile = (file: File): string | null => {
        if (file.size > MAX_FILE_SIZE) return `"${file.name}" is too large (max 5MB).`;
        const ext = file.name.replace(/^.*\./, '').toLowerCase();
        const typeOk = ALLOWED_IMAGE_TYPES.includes(file.type) || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(ext);
        if (!typeOk) return `"${file.name}" is not allowed. Use images (JPG, PNG, GIF, WebP) or PDF.`;
        return null;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length || !selectedTicket || !token) return;
        const currentTotal = attachments.length;
        if (currentTotal + files.length > MAX_FILES) {
            Notification({ text: `Max ${MAX_FILES} files. You have ${currentTotal} attached.`, color: 'warning' });
            e.target.value = '';
            return;
        }
        const toUpload: File[] = [];
        for (let i = 0; i < files.length && toUpload.length + currentTotal < MAX_FILES; i++) {
            const err = validateFile(files[i]);
            if (err) {
                Notification({ text: err, color: 'warning' });
                continue;
            }
            toUpload.push(files[i]);
        }
        if (!toUpload.length) {
            e.target.value = '';
            return;
        }
        setUploading(true);
        const formData = new FormData();
        toUpload.forEach((f) => formData.append('attachments', f));
        axios
            .post(`${ServerSetting.apiUrl}/support/tickets/${selectedTicket._id}/upload`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            })
            .then((res) => {
                if (res.data?.success && res.data?.data?.files) {
                    setAttachments((prev) => [...prev, ...res.data.data.files]);
                    Notification({ text: 'File(s) attached', color: 'success' });
                }
            })
            .catch((err) => {
                const msg = err.response?.data?.message || err.message || 'Upload failed.';
                Notification({ text: msg, color: 'danger' });
            })
            .finally(() => {
                setUploading(false);
                e.target.value = '';
            });
    };

    const sendReply = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedReply = reply.replace(/<p><br><\/p>/g, '').trim();
        if (!selectedTicket || !token || (!trimmedReply && attachments.length === 0)) {
            Notification({ text: 'Type a message or attach a file', color: 'warning' });
            return;
        }
        setSending(true);
        axios
            .post(
                `${ServerSetting.apiUrl}/support/tickets/${selectedTicket._id}/messages`,
                { message: trimmedReply || '(Attachment)', attachments: attachments.length ? attachments : undefined },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((res) => {
                if (res.data?.success && res.data?.data) {
                    setMessages((prev) => [...prev, res.data.data]);
                    setReply('');
                    setAttachments([]);
                }
            })
            .catch(() => Notification({ text: 'Failed to send', color: 'danger' }))
            .finally(() => setSending(false));
    };

    const formatDate = (d: string) => {
        if (!d) return '';
        const dt = new Date(d);
        return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isImage = (filename: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
    const attachmentUrl = (filename: string) => `${ServerSetting.serUrl}/ticket/${encodeURIComponent(filename)}`;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-start">
                <Link
                    to={getAppDashboardPath()}
                    className="flex items-center gap-2 rounded-2xl bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
                >
                    <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    {t('support_back_dashboard')}
                </Link>
            </div>

            <div className="relative flex min-h-[500px] gap-5 sm:h-[calc(100vh_-_220px)]">
                {/* Left panel - Mailbox style */}
                <div className={`${card} flex w-[280px] max-w-full flex-none flex-col space-y-3 p-4`}>
                    <Link
                        to={`${supportBase}/new`}
                        className="btn btn-primary w-full rounded-2xl"
                    >
                        <IconPlus className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                        {t('support_new_ticket')}
                    </Link>
                    <div className="flex min-h-0 flex-1 flex-col space-y-1">
                        {STATUS_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => setStatusFilter(tab.value)}
                                className={`flex h-10 w-full items-center justify-between rounded-xl p-2.5 font-medium transition-colors ${
                                    statusFilter === tab.value
                                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                                }`}
                            >
                                <span className="flex items-center">
                                    <IconMail className="w-5 h-5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                    {tab.label}
                                </span>
                                {tab.value === '' && (
                                    <span className="badge bg-primary/20 text-primary text-xs">{tickets.length}</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={fetchTickets}
                        className="btn btn-outline-primary btn-sm w-full rounded-2xl"
                    >
                        <IconRefresh className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
                        Refresh
                    </button>
                </div>

                {/* Center - Ticket list (Mailbox inbox list style) */}
                <div className={`${card} flex min-w-0 flex-1 flex-col overflow-hidden p-0`}>
                    {!selectedTicket ? (
                        <>
                            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                                <h5 className="font-semibold text-lg text-gray-900 dark:text-white">{t('my_tickets')}</h5>
                            </div>
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="grid min-h-[300px] place-content-center p-6 text-center">
                                    <IconMail className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
                                    <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">{t('support_mailbox_no_tickets_title')}</p>
                                    <p className="mt-1 text-gray-500 dark:text-gray-500">{t('support_mailbox_no_tickets_hint')}</p>
                                    <Link
                                        to={`${supportBase}/new`}
                                        className="btn btn-primary mt-4 rounded-2xl"
                                    >
                                        {t('support_new_ticket')}
                                    </Link>
                                </div>
                            ) : (
                                <PerfectScrollbar className="grow overflow-y-auto">
                                    <table className="w-full">
                                        <tbody>
                                            {tickets.map((ticket) => (
                                                <tr
                                                    key={ticket._id}
                                                    className="cursor-pointer border-b border-gray-200 transition-colors hover:bg-primary/5 dark:border-gray-700 dark:hover:bg-gray-800/50"
                                                    onClick={() => selectTicket(ticket)}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                                <IconUser className="w-5 h-5" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-medium text-gray-900 dark:text-white">{ticket.subject}</div>
                                                                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                                    {ticket.ticketNumber} · {formatDate(ticket.createdAt)}
                                                                </div>
                                                                <div className="mt-1">
                                                                    <span className={`badge text-xs ${statusBadgeClass(ticket.status)}`}>
                                                                        {statusLabel(ticket.status)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </PerfectScrollbar>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Right - Selected ticket view (Mailbox mail view style) */}
                            <div className="flex flex-wrap items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTicket(null)}
                                        className="btn btn-sm btn-outline-secondary rounded-xl"
                                    >
                                        <IconArrowLeft className="w-4 h-4" />
                                    </button>
                                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{selectedTicket.subject}</h4>
                                    <span className={`badge ${statusBadgeClass(selectedTicket.status)}`}>
                                        {statusLabel(selectedTicket.status)}
                                    </span>
                                </div>
                            </div>
                            <div className="border-b border-gray-200 bg-gray-50/50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/40">
                                <div className="flex items-start gap-3">
                                    {isStaff && selectedTicket.userId && (
                                        <div className="shrink-0">
                                            <img
                                                src={selectedTicket.userId.userProfileImage ? `${ServerSetting.serUrl}/profile/${selectedTicket.userId.userProfileImage}` : '/assets/images/profile-34.jpeg'}
                                                alt=""
                                                className="h-12 w-12 rounded-full border-2 border-white object-cover shadow dark:border-gray-900"
                                            />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <span>
                                                From: {selectedTicket.userId ? `${selectedTicket.userId.userNameF || ''} ${selectedTicket.userId.userNameL || ''}`.trim() || '—' : '—'}
                                            </span>
                                            <span>·</span>
                                            <span>{formatDate(selectedTicket.createdAt)}</span>
                                        </div>
                                        {isStaff && selectedTicket.userId && (selectedTicket.userId.userEmail || selectedTicket.userId.userPhone || selectedTicket.userId.userCNIC != null) && (
                                            <div className="mt-2 space-y-1 text-xs">
                                                {(selectedTicket.userId.userCNIC != null && selectedTicket.userId.userCNIC !== '') && (
                                                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                        <span className="shrink-0 text-gray-500 dark:text-gray-500">CNIC:</span>
                                                        <span className="font-mono font-medium text-gray-800 dark:text-gray-200">{String(selectedTicket.userId.userCNIC)}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const cnic = String(selectedTicket.userId!.userCNIC);
                                                                navigator.clipboard.writeText(cnic).then(() => Notification({ text: 'CNIC copied!', color: 'success' })).catch(() => Notification({ text: 'Copy failed', color: 'warning' }));
                                                            }}
                                                            className="rounded p-1 text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                                                            title="Copy CNIC"
                                                        >
                                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                        </button>
                                                    </div>
                                                )}
                                                {selectedTicket.userId.userEmail && (
                                                    <div>
                                                        <span className="shrink-0 text-gray-500 dark:text-gray-500">Email:</span>
                                                        <a href={`mailto:${selectedTicket.userId.userEmail}`} className="text-primary hover:underline ltr:ml-1.5 rtl:mr-1.5 break-all">
                                                            {selectedTicket.userId.userEmail}
                                                        </a>
                                                    </div>
                                                )}
                                                {selectedTicket.userId.userPhone && (
                                                    <div>
                                                        <span className="shrink-0 text-gray-500 dark:text-gray-500">Phone:</span>
                                                        <a href={`tel:${selectedTicket.userId.userPhone}`} className="text-primary hover:underline ltr:ml-1.5 rtl:mr-1.5">
                                                            {selectedTicket.userId.userPhone}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {isStaff && selectedTicket.shopId && (selectedTicket.shopId.shopName || selectedTicket.shopId.shopNumber) && (
                                            <div className="mt-2 border-t border-gray-200/50 pt-2 dark:border-gray-700">
                                                <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Shop</p>
                                                <p className="text-xs text-gray-700 dark:text-gray-300">
                                                    {selectedTicket.shopId.shopName && <span>{selectedTicket.shopId.shopName}</span>}
                                                    {selectedTicket.shopId.shopNumber && <span className="ltr:ml-1 rtl:mr-1"> ({selectedTicket.shopId.shopNumber})</span>}
                                                </p>
                                                {(selectedTicket.shopId.shopAddress || selectedTicket.shopId.shopCity) && (
                                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                        {[selectedTicket.shopId.shopAddress, selectedTicket.shopId.shopCity, selectedTicket.shopId.shopProvince].filter(Boolean).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {selectedTicket.description && (
                                            <div className="mt-2"><MessageContent message={selectedTicket.description} className="text-sm text-gray-600 dark:text-gray-400" /></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {loadingTicket ? (
                                <div className="flex justify-center py-12">
                                    <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            ) : (
                                <>
                                    <PerfectScrollbar className="flex-1 min-h-[200px] max-h-[calc(100vh-420px)] overflow-y-auto p-4">
                                        {messages.length === 0 ? (
                                            <p className="py-6 text-center text-gray-500 dark:text-gray-400">No messages yet. Start the conversation below.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {messages.map((m) => (
                                                    <div
                                                        key={m._id}
                                                        className={`flex ${m.senderType === 'support' ? 'justify-start' : 'justify-end'}`}
                                                    >
                                                        <div
                                                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                                                m.senderType === 'support'
                                                                    ? 'bg-primary text-white'
                                                                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
                                                            }`}
                                                        >
                                                            <p className="text-xs opacity-80">
                                                                {m.senderType === 'support' ? 'Support' : 'You'}
                                                                {m.senderId?.userNameF && ` · ${m.senderId.userNameF} ${m.senderId.userNameL || ''}`}
                                                                <span className="ltr:ml-2 rtl:mr-2">{formatDate(m.createdAt)}</span>
                                                            </p>
                                                            <div className="mt-1"><MessageContent message={m.message} className="text-sm" light={m.senderType === 'support'} /></div>
                                                            {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                                                                <div className="mt-3">
                                                                    <p className="mb-1.5 text-xs font-medium opacity-80">Attachments</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {m.attachments.map((att, i) => (
                                                                            <span key={i}>
                                                                                {isImage(att) ? (
                                                                                    <a
                                                                                        href={attachmentUrl(att)}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="block max-w-[200px] overflow-hidden rounded-lg border border-white/20"
                                                                                    >
                                                                                        <img
                                                                                            src={attachmentUrl(att)}
                                                                                            alt="Attachment"
                                                                                            className="max-h-32 w-full object-cover"
                                                                                            onError={(e) => {
                                                                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect fill="%23ddd" width="120" height="80"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="10">Image unavailable</text></svg>';
                                                                                                (e.target as HTMLImageElement).onerror = null;
                                                                                            }}
                                                                                        />
                                                                                    </a>
                                                                                ) : (
                                                                                    <a
                                                                                        href={attachmentUrl(att)}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="inline-flex items-center gap-1 text-xs underline opacity-90"
                                                                                    >
                                                                                        📎 {att}
                                                                                    </a>
                                                                                )}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        )}
                                    </PerfectScrollbar>
                                    <form ref={formRef} onSubmit={sendReply} className="border-t border-gray-200 p-4 dark:border-gray-700">
                                        {attachments.length > 0 && (
                                            <div className="mb-2 flex flex-wrap gap-2">
                                                {attachments.map((att, i) => (
                                                    <span key={i} className="relative inline-flex items-center gap-1 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                                                        {isImage(att) ? (
                                                            <img
                                                                src={attachmentUrl(att)}
                                                                alt=""
                                                                className="h-12 w-12 object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                    (e.target as HTMLImageElement).onerror = null;
                                                                }}
                                                            />
                                                        ) : null}
                                                        <span className="max-w-[120px] truncate px-2 py-1 text-xs text-gray-600 dark:text-gray-300" title={att}>
                                                            {isImage(att) ? '🖼 ' : '📎 '}{att.length > 15 ? att.slice(0, 12) + '…' : att}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                                                            className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl bg-danger/80 text-xs text-white hover:bg-danger"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-2">
                                            <div
                                                className="min-w-0 flex-1"
                                                onKeyDownCapture={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        const trimmed = reply.replace(/<p><br><\/p>/g, '').trim();
                                                        if ((trimmed || attachments.length > 0) && !sending) {
                                                            formRef.current?.requestSubmit();
                                                        }
                                                    }
                                                }}
                                            >
                                                <SupportRichEditor
                                                    value={reply}
                                                    onChange={setReply}
                                                    placeholder="Type your message... Enter to send, Shift+Enter for new line."
                                                    minHeight="100px"
                                                    disabled={sending}
                                                />
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.jpg,.jpeg,.png,.gif,.webp,.pdf"
                                                    multiple
                                                    onChange={handleFileSelect}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploading || attachments.length >= MAX_FILES}
                                                    title={`Attach reference images (JPG, PNG, GIF, WebP, PDF). Max ${MAX_FILES} files, 5MB each.`}
                                                    className="btn btn-outline-secondary shrink-0 rounded-2xl"
                                                >
                                                    {uploading ? (
                                                        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                    ) : (
                                                        <IconPaperclip className="w-5 h-5" />
                                                    )}
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={sending || (!reply.replace(/<p><br><\/p>/g, '').trim() && attachments.length === 0)}
                                                    className="btn btn-primary shrink-0 rounded-2xl"
                                                >
                                                    <IconSend className="w-5 h-5 ltr:mr-1 rtl:ml-1" />
                                                    Send
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportMailbox;
