import Swal from 'sweetalert2';

/**
 * SweetAlert Utility Helper
 * Provides reusable functions for confirmations, success, error, and info messages
 */

interface ConfirmOptions {
    title?: string;
    text?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    icon?: 'warning' | 'error' | 'info' | 'question';
    showCancelButton?: boolean;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
}

interface AlertOptions {
    title?: string;
    text?: string;
    icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
    timer?: number;
    showConfirmButton?: boolean;
    confirmButtonText?: string;
}

/**
 * Show confirmation dialog before performing destructive actions
 */
export const showConfirmDialog = async (options: ConfirmOptions = {}): Promise<boolean> => {
    const result = await Swal.fire({
        title: options.title || 'Are you sure?',
        text: options.text || 'This action cannot be undone!',
        icon: options.icon || 'warning',
        showCancelButton: options.showCancelButton !== false,
        confirmButtonColor: options.confirmButtonColor || '#d33',
        cancelButtonColor: options.cancelButtonColor || '#3085d6',
        confirmButtonText: options.confirmButtonText || 'Yes, proceed!',
        cancelButtonText: options.cancelButtonText || 'Cancel',
        reverseButtons: true,
    });

    return result.isConfirmed;
};

/**
 * Show confirmation for delete action
 * @param itemName - name of item to delete (or full custom text if options.text is not provided, options overrides are used)
 * @param options - optional overrides for title, text, confirmButtonText, cancelButtonText (for i18n)
 */
export const confirmDelete = async (itemName: string = 'this item', options?: Partial<ConfirmOptions>): Promise<boolean> => {
    return showConfirmDialog({
        title: options?.title ?? 'Delete Confirmation',
        text: options?.text ?? `Are you sure you want to delete ${itemName}? This action cannot be undone!`,
        icon: 'warning',
        confirmButtonText: options?.confirmButtonText ?? 'Yes, delete it!',
        cancelButtonText: options?.cancelButtonText ?? 'Cancel',
    });
};

/**
 * Show confirmation for update/edit action
 */
export const confirmUpdate = async (itemName: string = 'this item'): Promise<boolean> => {
    return showConfirmDialog({
        title: 'Update Confirmation',
        text: `Are you sure you want to update ${itemName}?`,
        icon: 'question',
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3085d6',
    });
};

/**
 * Show confirmation for create/add action
 * @param options - optional overrides for title, text, confirmButtonText, cancelButtonText (for i18n)
 */
export const confirmCreate = async (itemName: string = 'this item', options?: Partial<ConfirmOptions>): Promise<boolean> => {
    return showConfirmDialog({
        title: options?.title ?? 'Create Confirmation',
        text: options?.text ?? `Are you sure you want to create ${itemName}?`,
        icon: 'question',
        confirmButtonText: options?.confirmButtonText ?? 'Yes, create it!',
        cancelButtonText: options?.cancelButtonText ?? 'Cancel',
        confirmButtonColor: '#10b981',
    });
};

/**
 * Show success message
 */
export const showSuccess = (message: string, title: string = 'Success!') => {
    Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        timer: 3000,
        showConfirmButton: true,
        confirmButtonColor: '#10b981',
    });
};

/**
 * Show error message
 */
export const showError = (message: string, title: string = 'Error!') => {
    Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        showConfirmButton: true,
        confirmButtonColor: '#ef4444',
    });
};

/**
 * Show warning message
 */
export const showWarning = (message: string, title: string = 'Warning!') => {
    Swal.fire({
        icon: 'warning',
        title: title,
        text: message,
        showConfirmButton: true,
        confirmButtonColor: '#f59e0b',
    });
};

/**
 * Show info message
 */
export const showInfo = (message: string, title: string = 'Info') => {
    Swal.fire({
        icon: 'info',
        title: title,
        text: message,
        showConfirmButton: true,
        confirmButtonColor: '#3b82f6',
    });
};

/**
 * Show toast notification (non-blocking)
 */
export const showToast = (message: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success', timer: number = 3000) => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        },
    });

    Toast.fire({
        icon: icon,
        title: message,
    });
};

/**
 * Show loading state
 */
export const showLoading = (message: string = 'Processing...') => {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
};

/**
 * Close current SweetAlert
 */
export const closeAlert = () => {
    Swal.close();
};

/**
 * Show confirmation for account deletion
 */
export const confirmAccountDeletion = async (): Promise<boolean> => {
    return showConfirmDialog({
        title: 'Delete Account?',
        text: 'Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone!',
        icon: 'warning',
        confirmButtonText: 'Yes, delete my account!',
        cancelButtonText: 'Cancel',
    });
};

/**
 * Show confirmation for status change (block/unblock)
 */
export const confirmStatusChange = async (action: string, itemName: string = 'this item'): Promise<boolean> => {
    return showConfirmDialog({
        title: `${action} Confirmation`,
        text: `Are you sure you want to ${action.toLowerCase()} ${itemName}?`,
        icon: 'question',
        confirmButtonText: `Yes, ${action} it!`,
        cancelButtonText: 'Cancel',
        confirmButtonColor: action.toLowerCase() === 'block' ? '#f59e0b' : '#3085d6',
    });
};

/**
 * Show subscription expired alert - user cannot access system, must renew. Data is saved.
 * @param customMessage - Optional message from API (e.g. POS subscription expired).
 */
export const showSubscriptionExpired = (customMessage?: string | null) => {
    const defaultHtml = 'Your subscription has expired. You cannot access the system.<br/><br/>To access again you need to <strong>renew your subscription</strong>. Your data is saved; you just need to renew. Please contact Support to renew.';
    const html = customMessage ? customMessage.replace(/\n/g, '<br/>') : defaultHtml;
    Swal.fire({
        icon: 'error',
        title: 'Subscription Expired',
        html,
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444',
        allowOutsideClick: false,
        showCloseButton: true,
    });
};

/**
 * Show subscription expiring soon notification (within 7 days).
 * Message: renew subscription and contact Support.
 */
export const showSubscriptionExpiringSoon = (expireDate?: string | null, daysLeft?: number) => {
    const dateStr = expireDate ? new Date(expireDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '';
    const daysText = typeof daysLeft === 'number' && daysLeft >= 0
        ? (daysLeft === 0 ? 'Your subscription expires today.' : `Your subscription expires in ${daysLeft} day(s).`)
        : 'Your subscription is expiring soon.';
    const text = dateStr
        ? `${daysText} Expiry date: ${dateStr}. Please renew your subscription. Contact Support to renew.`
        : `${daysText} Please renew your subscription. Contact Support to renew.`;

    Swal.fire({
        icon: 'warning',
        title: 'Subscription Expiring Soon',
        html: text,
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
        showCloseButton: true,
    });
};

