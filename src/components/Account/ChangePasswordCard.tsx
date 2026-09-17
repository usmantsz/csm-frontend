import { FormEvent, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import IconLockDots from '../Icon/IconLockDots';

type Props = {
    token: string | null;
    /** Optional title override */
    title?: string;
    /** Optional subtitle under title (e.g. i18n) */
    description?: string;
    className?: string;
};

// Small inline eye / eye-off icons so the show/hide toggle doesn't need a new dependency.
const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
    </svg>
);

const EyeOffIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.523 10.523 0 01-4.293 5.309M6.228 6.228A10.451 10.451 0 002.458 12c1.274 4.057 5.064 7 9.542 7 1.517 0 2.953-.34 4.243-.94"
        />
    </svg>
);

/**
 * Self-service password change (requires current password). Uses PATCH /api/change-password.
 */
export function ChangePasswordCard({
    token,
    title,
    description,
    className = '',
}: Props) {
    const { t } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const resolvedTitle = title ?? t('change_password');
    const resolvedDescription = description ?? t('change_password_desc');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) {
            Swal.fire({ title: t('session_expired'), text: t('please_sign_in_again'), icon: 'warning' });
            return;
        }
        if (newPassword.length < 6) {
            Swal.fire({ title: t('invalid_password'), text: t('password_min_6'), icon: 'warning' });
            return;
        }
        if (newPassword !== confirmPassword) {
            Swal.fire({ title: t('mismatch_title'), text: t('passwords_do_not_match'), icon: 'warning' });
            return;
        }
        setSubmitting(true);
        try {
            const res = await axios.patch(
                `${ServerSetting.apiUrl}/change-password`,
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            );
            if (res.data?.status === 200 || res.data?.success) {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                Swal.fire({ title: t('updated_title'), text: res.data?.message || t('password_changed_success'), icon: 'success', timer: 2200, showConfirmButton: false });
            } else {
                Swal.fire({ title: t('could_not_update'), text: res.data?.message || t('please_try_again'), icon: 'error' });
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Swal.fire({ title: t('error'), text: msg || t('network_error_try_again'), icon: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto flex w-full justify-center">
            <div
                className={`w-full rounded-2xl border border-white-dark/15 bg-white p-6 shadow-sm dark:border-[#172b40] dark:bg-[#0b1724] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.45)] sm:p-7 ${className}`}
            >
                <div className="flex items-start gap-4 border-b border-[#ebedf2] pb-6 dark:border-[#172b40]">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 text-amber-700 dark:border dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-500 dark:shadow-[0_0_22px_-3px_rgba(245,158,11,0.35)]">
                        <IconLockDots className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">{resolvedTitle}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-slate-400 sm:text-sm">{resolvedDescription}</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300">
                            {t('current_password')}
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="form-input w-full rounded-xl border-gray-200 pr-11 dark:border-[#172b40] dark:bg-[#07121c] dark:text-white dark:placeholder-slate-600 dark:focus:border-amber-500 dark:focus:ring-amber-500"
                                required
                            />
                            <button
                                type="button"
                                aria-label={t('toggle_password_visibility')}
                                onClick={() => setShowCurrent((v) => !v)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                            >
                                {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300">
                            {t('new_password')}
                        </label>
                        <div className="relative">
                            <input
                                type={showNew ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="form-input w-full rounded-xl border-gray-200 pr-11 dark:border-[#172b40] dark:bg-[#07121c] dark:text-white dark:placeholder-slate-600 dark:focus:border-amber-500 dark:focus:ring-amber-500"
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                aria-label={t('toggle_password_visibility')}
                                onClick={() => setShowNew((v) => !v)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                            >
                                {showNew ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300">
                            {t('confirm_new_password')}
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="form-input w-full rounded-xl border-gray-200 pr-11 dark:border-[#172b40] dark:bg-[#07121c] dark:text-white dark:placeholder-slate-600 dark:focus:border-amber-500 dark:focus:ring-amber-500"
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                aria-label={t('toggle_password_visibility')}
                                onClick={() => setShowConfirm((v) => !v)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                            >
                                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>
                    <div className="pt-1">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn w-full rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-5 py-3 font-semibold text-white shadow-md transition-all hover:from-amber-400 hover:to-orange-500 active:scale-[0.99] disabled:opacity-50 dark:shadow-[0_0_22px_-3px_rgba(245,158,11,0.35)] sm:w-auto"
                        >
                            {submitting ? t('updating') : t('update_password')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
