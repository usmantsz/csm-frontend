import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getRequiredPermissionsForPath } from './routePermissions';
import { DEFAULT_ROLE_PERMISSIONS } from '../constants/permissions';

interface PrivateRouteProps {
    element: JSX.Element;
    allowedRoles?: string[];
}

const VALID_PERMISSIONS = new Set([
    'add_team_member', 'remove_team_member', 'edit_team_permissions', 'view_team',
    'view_shops', 'add_shop_owner', 'edit_shop_owner', 'block_shop_owner', 'view_shop_owners',
    'view_all_tickets', 'assign_ticket', 'close_ticket', 'reply_ticket',
    'manage_subscriptions', 'view_admin_dashboard', 'view_reports',
]);

function normalizePermissions(arr: unknown): string[] {
    if (!Array.isArray(arr)) return [];
    return arr
        .filter((p): p is string => typeof p === 'string' && p.length > 0)
        .map((p) => p.toLowerCase().trim())
        .filter((p) => VALID_PERMISSIONS.has(p));
}

function getStoredRoleAndPermissions(): { userRole: string | null; permissions: string[] } {
    let userRole: string | null = null;
    let permissions: string[] = [];
    try {
        const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        if (role !== null && role !== '') userRole = role;
        const raw = typeof window !== 'undefined' ? localStorage.getItem('userInformation') : null;
        if (raw) {
            const parsed = JSON.parse(raw);
            const data = parsed?.data ?? parsed;
            if (data && typeof data === 'object') {
                if (userRole === null) {
                    const r = data.userRole;
                    if (r !== undefined && r !== null) userRole = String(r);
                }
                const rawPerms = data.permissions ?? data.permission_list ?? data.perms;
                permissions = normalizePermissions(rawPerms);
                if ((userRole === '2' || userRole === '3') && permissions.length === 0) {
                    const defaults = DEFAULT_ROLE_PERMISSIONS[Number(userRole)];
                    if (Array.isArray(defaults)) permissions = defaults;
                }
            }
        }
    } catch {
        // ignore
    }
    return { userRole, permissions };
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element, allowedRoles = [] }) => {
    const location = useLocation();
    const pathname = location.pathname || '/';
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const { userRole, permissions } = getStoredRoleAndPermissions();

    if (!isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    const loginSource = typeof window !== 'undefined' ? localStorage.getItem('loginSource') : null;
    if (loginSource === 'pos' && (pathname === '/' || pathname === '/dashboard')) {
        return <Navigate to="/pos/dashboard" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole || '')) {
        return <Navigate to="/pages/error404" replace />;
    }

    // POS app routes (/pos/... only): only for users who logged in via POS (loginSource === 'pos')
    // Do not match /pos-shop-management (Commission Shop page for shop owner)
    if (pathname.startsWith('/pos/') || pathname === '/pos') {
        const loginSource = typeof window !== 'undefined' ? localStorage.getItem('loginSource') : null;
        if (loginSource !== 'pos') {
            return <Navigate to="/dashboard" replace />;
        }
    }

    // Team members (2, 3): must have at least one required permission for this path – block direct URL access without permission
    if (userRole === '2' || userRole === '3') {
        const required = getRequiredPermissionsForPath(pathname);
        if (required && required.length > 0) {
            const hasAny = required.some((p) => permissions.includes(p));
            if (!hasAny) {
                return <Navigate to="/pages/error404" replace />;
            }
        }
    }

    return element;
};

export default PrivateRoute;
