import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { Notification } from '../../helperComponents/Notification';
import { getSupportBasePath } from '../../utils/supportPaths';
import IconPaperclip from '../../components/Icon/IconPaperclip';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import SupportRichEditor from '../../components/SupportRichEditor';

// Shared style tokens — matched to AddNewCrop.tsx so this page stays visually
// consistent with the rest of the app.
const card =
    'rounded-[2rem] border border-white-light bg-white/95 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#0b1526]/85';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20';
const inputBase =
    'form-input w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-white/5 dark:text-white';
const inputOk = 'border-gray-300 focus:border-primary dark:border-white/10 dark:focus:border-primary';
const labelCls = 'mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200';
const errorCls = 'mt-1 block text-sm text-red-500';

const MAX_REF_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

const CreateTicket = () => {
    const { t, i18n } = useTranslation();
    const supportBase = getSupportBasePath();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('general');
    const [priority, setPriority] = useState(1);
    const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [subjectError, setSubjectError] = useState('');

    const CATEGORIES = useMemo(
        () => [
            { value: 'general', label: t('support_cat_general') },
            { value: 'ios_issue', label: t('support_cat_ios') },
            { value: 'android', label: t('support_cat_android') },
            { value: 'payment', label: t('support_cat_payment') },
            { value: 'subscription', label: t('support_cat_subscription') },
            { value: 'other', label: t('support_cat_other') },
        ],
        [t, i18n.language]
    );
    const PRIORITIES = useMemo(
        () => [
            { value: 0, label: t('support_pri_low') },
            { value: 1, label: t('support_pri_medium') },
            { value: 2, label: t('support_pri_high') },
            { value: 3, label: t('support_pri_urgent') },
        ],
        [t, i18n.language]
    );

    useEffect(() => {
        dispatch(setPageTitle(t('support_page_new_ticket')));
    }, [dispatch, t, i18n.language]);

    const validateFile = (file: File): string | null => {
        if (file.size > MAX_FILE_SIZE) return t('support_file_too_large', { name: file.name });
        const ext = file.name.replace(/^.*\./, '').toLowerCase();
        const typeOk = ALLOWED_TYPES.includes(file.type) || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(ext);
        if (!typeOk) return t('support_file_not_allowed', { name: file.name });
        return null;
    };

    const onRefFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        const next: File[] = [];
        for (let i = 0; i < files.length && referenceFiles.length + next.length < MAX_REF_FILES; i++) {
            const err = validateFile(files[i]);
            if (err) {
                Notification({ text: err, color: 'warning' });
                continue;
            }
            next.push(files[i]);
        }
        if (next.length) setReferenceFiles((prev) => [...prev, ...next].slice(0, MAX_REF_FILES));
        e.target.value = '';
    };

    const removeRefFile = (index: number) => setReferenceFiles((prev) => prev.filter((_, i) => i !== index));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim()) {
            setSubjectError(t('support_subject_required'));
            Notification({ text: t('support_subject_required'), color: 'warning' });
            return;
        }
        setSubjectError('');
        const descTrimmed = description.replace(/<p><br><\/p>/g, '').trim();
        setSubmitting(true);
        axios
            .post(
                `${ServerSetting.apiUrl}/support/tickets`,
                { subject: subject.trim(), description: descTrimmed || '', category, priority },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then(async (res) => {
                if (!res.data?.success || !res.data?.data?._id) {
                    Notification({ text: res.data?.message || t('support_create_failed'), color: 'danger' });
                    return;
                }
                const ticketId = res.data.data._id;
                let attachmentFilenames: string[] = [];
                if (referenceFiles.length > 0 && token) {
                    try {
                        const formData = new FormData();
                        referenceFiles.forEach((f) => formData.append('attachments', f));
                        const up = await axios.post(
                            `${ServerSetting.apiUrl}/support/tickets/${ticketId}/upload`,
                            formData,
                            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
                        );
                        if (up.data?.success && up.data?.data?.files) attachmentFilenames = up.data.data.files;
                    } catch (err: any) {
                        Notification({ text: err.response?.data?.message || t('support_upload_failed'), color: 'warning' });
                    }
                    await axios.post(
                        `${ServerSetting.apiUrl}/support/tickets/${ticketId}/messages`,
                        {
                            message: descTrimmed || 'Reference images attached.',
                            attachments: attachmentFilenames.length ? attachmentFilenames : undefined,
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                }
                Notification({ text: res.data.message || t('support_ticket_created'), color: 'success' });
                navigate(`${supportBase}/ticket/${ticketId}`);
            })
            .catch((err) => {
                Notification({ text: err.response?.data?.message || t('support_create_failed'), color: 'danger' });
            })
            .finally(() => setSubmitting(false));
    };

    return (
        <div className="space-y-6">
            <button
                type="button"
                onClick={() => navigate(`${supportBase}/list`)}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
            >
                <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('support_back_tickets')}
            </button>

            <div className={`${card} mx-auto max-w-md`}>
                <div className="space-y-5">
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-success sm:text-2xl">{t('support_create_title')}</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('support_create_desc')}</p>
                    </div>

                    {/* Subject */}
                    <div className="flex flex-col">
                        <label htmlFor="subject" className={labelCls}>
                            {t('support_subject')}
                        </label>
                        <input
                            id="subject"
                            name="subject"
                            type="text"
                            placeholder={t('support_subject_ph')}
                            className={`${inputBase} ${subjectError ? 'border-red-400 focus:border-red-500 dark:border-red-500/70' : inputOk}`}
                            value={subject}
                            onChange={(e) => {
                                setSubject(e.target.value);
                                if (subjectError) setSubjectError('');
                            }}
                        />
                        {subjectError && <span className={errorCls}>{subjectError}</span>}
                    </div>

                    {/* Category + Priority */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col">
                            <label htmlFor="category" className={labelCls}>
                                {t('support_category')}
                            </label>
                            <select
                                id="category"
                                name="category"
                                className={`form-select ${inputBase} ${inputOk}`}
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="priority" className={labelCls}>
                                {t('support_priority')}
                            </label>
                            <select
                                id="priority"
                                name="priority"
                                className={`form-select ${inputBase} ${inputOk}`}
                                value={priority}
                                onChange={(e) => setPriority(Number(e.target.value))}
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col">
                        <label className={labelCls}>{t('support_description')}</label>
                        <div className="overflow-hidden rounded-2xl border border-gray-300 dark:border-white/10">
                            <SupportRichEditor
                                value={description}
                                onChange={setDescription}
                                placeholder={t('support_desc_placeholder')}
                                minHeight="140px"
                            />
                        </div>
                    </div>

                    {/* Reference files */}
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                        <label className={labelCls}>{t('support_ref_files_optional')}</label>
                        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                            {t('support_ref_files_hint', { max: MAX_REF_FILES })}
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.jpg,.jpeg,.png,.gif,.webp,.pdf"
                            multiple
                            onChange={onRefFilesChange}
                        />
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={referenceFiles.length >= MAX_REF_FILES}
                        >
                            <IconPaperclip className="w-4 h-4 shrink-0" />
                            {t('support_add_ref_images')}
                        </button>
                        {referenceFiles.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-3">
                                {referenceFiles.map((file, i) => (
                                    <div
                                        key={i}
                                        className="relative overflow-hidden rounded-2xl border border-white-light bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
                                    >
                                        {file.type.startsWith('image/') ? (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt=""
                                                className="h-20 w-20 object-cover"
                                                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                                            />
                                        ) : (
                                            <div className={`${iconBadge} m-2 h-16 w-16 rounded-2xl text-2xl`}>📎</div>
                                        )}
                                        <span className="block max-w-[100px] truncate px-2 py-1 text-xs" title={file.name}>
                                            {file.name}
                                        </span>
                                        <button
                                            type="button"
                                            className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-bl-lg bg-danger/90 text-sm text-white transition-colors hover:bg-danger"
                                            onClick={() => removeRefFile(i)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                        <button
                            type="button"
                            className="flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
                            onClick={() => navigate(supportBase)}
                        >
                            {t('support_cancel')}
                        </button>
                        <button
                            type="button"
                            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl bg-success px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-success/90 ${submitting ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting && (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            )}
                            {submitting ? t('support_creating') : t('support_create_ticket_btn')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTicket;