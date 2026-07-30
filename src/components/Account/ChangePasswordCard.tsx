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
        <div
            className={`rounded-2xl border border-white-dark/15 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0e1726] ${className}`}
        >
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 text-amber-700 dark:text-amber-400">
                    <IconLockDots className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{resolvedTitle}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{resolvedDescription}</p>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('current_password')}</label>
                    <input
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="form-input w-full rounded-xl border-gray-200 dark:border-white/10"
                        required
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('new_password')}</label>
                    <input
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="form-input w-full rounded-xl border-gray-200 dark:border-white/10"
                        minLength={6}
                        required
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('confirm_new_password')}</label>
                    <input
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="form-input w-full rounded-xl border-gray-200 dark:border-white/10"
                        minLength={6}
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="btn w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 font-semibold text-white shadow-md hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 sm:w-auto"
                >
                    {submitting ? t('updating') : t('update_password')}
                </button>
            </form>
        </div>
    );
}
