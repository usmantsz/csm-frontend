/**
 * Support UI lives under /support (main app) or /pos/support (POS layout).
 * API paths stay /api/support/... for both.
 */
export function getSupportBasePath(): string {
    if (typeof window === 'undefined') return '/support';
    return localStorage.getItem('loginSource') === 'pos' ? '/pos/support' : '/support';
}

export function getAppDashboardPath(): string {
    if (typeof window === 'undefined') return '/dashboard';
    return localStorage.getItem('loginSource') === 'pos' ? '/pos/dashboard' : '/dashboard';
}
