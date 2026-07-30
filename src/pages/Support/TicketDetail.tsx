import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { Notification } from '../../helperComponents/Notification';
import PageHeader from '../../components/Agricultural/PageHeader';
import { getSupportBasePath } from '../../utils/supportPaths';
import SupportRichEditor from '../../components/SupportRichEditor';
import MessageContent from '../../components/MessageContent';

interface Message {
    _id: string;
    message: string;
    senderType: 'shop_owner' | 'support';
    senderId?: { userNameF?: string; userNameL?: string };
    attachments?: string[];
    createdAt: string;
}

interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    description?: string;
    status: number;
    priority: number;
    category?: string;
    assignedTo?: { _id: string; userNameF?: string; userNameL?: string } | null;
    userId?: { _id?: string; userNameF?: string; userNameL?: string; userEmail?: string; userPhone?: string; userProfileImage?: string; userCNIC?: string | number };
    shopId?: { shopName?: string; shopNumber?: string; shopAddress?: string; shopCity?: string; shopProvince?: string; shopRegistrationNumber?: string };
    createdAt: string;
}

const TicketDetail = () => {
    const { t, i18n } = useTranslation();
    const supportBase = getSupportBasePath();
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token, user } = useAuthToken();

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

    const STATUS_OPTIONS = useMemo(
        () => [0, 1, 2, 3].map((k) => ({ value: k, label: statusLabel(k) })),
        [statusLabel]
    );
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    const isStaff = userRole === '0' || userRole === '2' || userRole === '3';

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [teamList, setTeamList] = useState<{ _id: string; userNameF?: string; userNameL?: string }[]>([]);
    const [assigning, setAssigning] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const fetchTicket = (silent = false) => {
        if (!id || !token) return;
        if (!silent) setLoading(true);
        axios
            .get(`${ServerSetting.apiUrl}/support/tickets/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: 1, limit: 100 },
            })
            .then((res) => {
                if (res.data?.success && res.data?.data) {
                    setTicket(res.data.data.ticket);
                    setMessages(res.data.data.messages || []);
                }
            })
            .catch((err) => {
                if (!silent) {
                    Notification({ text: err.response?.data?.message || t('support_load_failed'), color: 'danger' });
                    if (err.response?.status === 403 || err.response?.status === 404) navigate(supportBase);
                }
            })
            .finally(() => {
                if (!silent) setLoading(false);
            });
    };

    useEffect(() => {
        dispatch(setPageTitle(t('support_ticket_page_title')));
    }, [dispatch, t, i18n.language]);

    useEffect(() => {
        if (token && id) fetchTicket();
    }, [token, id]);

    useEffect(() => {
        if (!id || !token) return;
        const interval = setInterval(() => fetchTicket(true), 12000);
        return () => clearInterval(interval);
    }, [id, token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isStaff && token) {
            axios
                .get(`${ServerSetting.apiUrl}/admin/team`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 200 } })
                .then((res) => {
                    if (res.data?.success && res.data?.data?.team) {
                        setTeamList(res.data.data.team);
                    }
                })
                .catch(() => {});
        }
    }, [isStaff, token]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedReply = reply.replace(/<p><br><\/p>/g, '').trim();
        if (!trimmedReply || !id || !token) return;
        setSending(true);
        axios
            .post(
                `${ServerSetting.apiUrl}/support/tickets/${id}/messages`,
                { message: trimmedReply },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((res) => {
                if (res.data?.success && res.data?.data) {
                    setMessages((prev) => [...prev, res.data.data]);
                    setReply('');
                    fetchTicket();
                }
            })
            .catch((err) => Notification({ text: err.response?.data?.message || 'Failed to send', color: 'danger' }))
            .finally(() => setSending(false));
    };

    const assignTo = (userId: string | null) => {
        if (!id || !token) return;
        setAssigning(true);
        axios
            .patch(
                `${ServerSetting.apiUrl}/support/tickets/${id}/assign`,
                { assignedTo: userId || null },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((res) => {
                if (res.data?.success && res.data?.data) setTicket(res.data.data);
                Notification({ text: 'Ticket assigned', color: 'success' });
            })
            .catch((err) => Notification({ text: err.response?.data?.message || 'Failed to assign', color: 'danger' }))
            .finally(() => setAssigning(false));
    };

    const updateStatus = (status: number) => {
        if (!id || !token) return;
        setUpdatingStatus(true);
        axios
            .patch(
                `${ServerSetting.apiUrl}/support/tickets/${id}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((res) => {
                if (res.data?.success && res.data?.data) setTicket(res.data.data);
                Notification({ text: 'Status updated', color: 'success' });
            })
            .catch((err) => Notification({ text: err.response?.data?.message || 'Failed to update', color: 'danger' }))
            .finally(() => setUpdatingStatus(false));
    };

    const formatDate = (d: string) => {
        if (!d) return '';
        const dt = new Date(d);
        return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const attachmentUrl = (filename: string) => `${ServerSetting.serUrl}/ticket/${encodeURIComponent(filename)}`;
    const isImage = (filename: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

    if (loading || !ticket) {
        return (
            <div className="panel mt-6 flex justify-center py-12">
                <span className="animate-spin border-2 border-primary border-t-transparent rounded-full w-10 h-10 inline-block" />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title={`${ticket.ticketNumber} – ${ticket.subject}`}
                description={t('support_ticket_header_desc', { cat: ticket.category || 'general', date: formatDate(ticket.createdAt) })}
                onBack={() => navigate(-1)}
                backLabel={t('support_back_list')}
                rightContent={
                    <>
                        <span className={`badge ${ticket.status === 0 ? 'bg-warning' : ticket.status === 3 ? 'bg-secondary' : 'bg-primary'} bg-white/20 border border-white/40`}>
                            {statusLabel(ticket.status)}
                        </span>
                        {isStaff && (
                            <>
                                <select
                                    className="form-select w-40 min-w-[120px] bg-white/95 border-white text-gray-800"
                                    value={ticket.status}
                                    onChange={(e) => updateStatus(Number(e.target.value))}
                                    disabled={updatingStatus}
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                <select
                                    className="form-select w-48 min-w-[140px] bg-white/95 border-white text-gray-800"
                                    value={ticket.assignedTo?._id || ''}
                                    onChange={(e) => assignTo(e.target.value || null)}
                                    disabled={assigning}
                                >
                                    <option value="">Unassigned</option>
                                    {teamList.map((u) => (
                                        <option key={u._id} value={u._id}>{u.userNameF} {u.userNameL}</option>
                                    ))}
                                </select>
                            </>
                        )}
                    </>
                }
                icon={<span className="text-4xl">🎫</span>}
            />
            <div className="panel mt-6">
                {isStaff && ticket.userId && (
                    <div className="mb-4 p-4 rounded-lg border border-white-light dark:border-dark/50 bg-white dark:bg-dark/20 flex flex-wrap items-center gap-4">
                        <div className="shrink-0">
                            <img
                                src={ticket.userId.userProfileImage ? `${ServerSetting.serUrl}/profile/${ticket.userId.userProfileImage}` : '/assets/images/profile-34.jpeg'}
                                alt=""
                                className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-dark shadow"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h6 className="font-semibold text-sm text-gray-700 dark:text-white mb-1">Shop Owner / Reporter</h6>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {[ticket.userId.userNameF, ticket.userId.userNameL].filter(Boolean).join(' ') || '—'}
                            </p>
                            <div className="mt-2 space-y-1.5 text-sm">
                                {(ticket.userId.userCNIC != null && ticket.userId.userCNIC !== '') && (
                                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                        <span className="text-gray-500 dark:text-gray-500 shrink-0">CNIC:</span>
                                        <span className="font-mono font-medium text-gray-800 dark:text-gray-200">{String(ticket.userId.userCNIC)}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const cnic = String(ticket.userId!.userCNIC);
                                                navigator.clipboard.writeText(cnic).then(() => Notification({ text: 'CNIC copied!', color: 'success' })).catch(() => Notification({ text: 'Copy failed', color: 'warning' }));
                                            }}
                                            className="p-1.5 rounded hover:bg-primary/10 text-primary dark:hover:bg-primary/20"
                                            title="Copy CNIC"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        </button>
                                    </div>
                                )}
                                {ticket.userId.userEmail && (
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-500 shrink-0 text-xs">Email:</span>
                                        <a href={`mailto:${ticket.userId.userEmail}`} className="ltr:ml-1.5 rtl:mr-1.5 text-primary hover:underline break-all">
                                            {ticket.userId.userEmail}
                                        </a>
                                    </div>
                                )}
                                {ticket.userId.userPhone && (
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-500 shrink-0 text-xs">Phone:</span>
                                        <a href={`tel:${ticket.userId.userPhone}`} className="ltr:ml-1.5 rtl:mr-1.5 text-primary hover:underline">
                                            {ticket.userId.userPhone}
                                        </a>
                                    </div>
                                )}
                            </div>
                            {ticket.shopId && (ticket.shopId.shopName || ticket.shopId.shopNumber) && (
                                <div className="mt-3 pt-3 border-t border-white-light dark:border-dark/50">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Shop</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">
                                        {ticket.shopId.shopName && <span>{ticket.shopId.shopName}</span>}
                                        {ticket.shopId.shopNumber && <span className="ltr:ml-1 rtl:mr-1"> ({ticket.shopId.shopNumber})</span>}
                                    </p>
                                    {(ticket.shopId.shopAddress || ticket.shopId.shopCity) && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {[ticket.shopId.shopAddress, ticket.shopId.shopCity, ticket.shopId.shopProvince].filter(Boolean).join(', ')}
                                        </p>
                                    )}
                                    {ticket.shopId.shopRegistrationNumber && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Reg: {ticket.shopId.shopRegistrationNumber}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {ticket.description && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-dark/30 rounded-lg">
                        <MessageContent message={ticket.description} className="text-sm text-gray-700 dark:text-gray-300" />
                    </div>
                )}

                <div className="border border-gray-200 dark:border-dark/50 rounded-lg overflow-hidden">
                    <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-dark/20">
                        {messages.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No messages yet. Start the conversation below.</p>
                        ) : (
                            messages.map((m) => (
                                <div
                                    key={m._id}
                                    className={`flex ${m.senderType === 'support' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                            m.senderType === 'support'
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-200 dark:bg-dark/50 text-gray-800 dark:text-white'
                                        }`}
                                    >
                                        <p className="text-sm font-medium opacity-80">
                                            {m.senderType === 'support' ? 'Support' : 'You'}
                                            {m.senderId?.userNameF && ` · ${m.senderId.userNameF} ${m.senderId.userNameL || ''}`}
                                        </p>
                                        <div className="mt-1"><MessageContent message={m.message} className="text-sm" light={m.senderType === 'support'} /></div>
                                        {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {m.attachments.map((att, i) => (
                                                    <span key={i}>
                                                        {isImage(att) ? (
                                                            <a
                                                                href={attachmentUrl(att)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block rounded-lg overflow-hidden border border-white/20 dark:border-white/20 max-w-[200px]"
                                                            >
                                                                <img
                                                                    src={attachmentUrl(att)}
                                                                    alt="Attachment"
                                                                    className="max-h-32 object-cover w-full"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect fill="%23ddd" width="120" height="80"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="10">Image unavailable</text></svg>';
                                                                        (e.target as HTMLImageElement).onerror = null;
                                                                    }}
                                                                />
                                                            </a>
                                                        ) : (
                                                            <a
                                                                href={attachmentUrl(att)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs underline opacity-90 inline-flex items-center gap-1"
                                                            >
                                                                📎 {att}
                                                            </a>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-xs opacity-70 mt-1">{formatDate(m.createdAt)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form ref={formRef} onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-dark/50">
                        <div className="flex flex-col gap-2">
                            <div
                                onKeyDownCapture={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const trimmed = reply.replace(/<p><br><\/p>/g, '').trim();
                                        if (trimmed && !sending) {
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
                            <div className="flex justify-end">
                                <button type="submit" className="btn btn-primary" disabled={sending || !reply.replace(/<p><br><\/p>/g, '').trim()}>
                                    {sending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;
