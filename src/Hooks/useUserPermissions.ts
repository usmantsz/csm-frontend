import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, PermissionKey } from '../constants/permissions';

const PERMISSION_VALUES = new Set([
    'add_team_member', 'remove_team_member', 'edit_team_permissions', 'view_team',
    'view_shops', 'add_shop_owner', 'edit_shop_owner', 'block_shop_owner', 'view_shop_owners',
    'view_all_tickets', 'assign_ticket', 'close_ticket', 'reply_ticket',
    'manage_subscriptions', 'view_admin_dashboard', 'view_reports',
]);

function normalizePermissionList(arr: unknown): string[] {
    if (!Array.isArray(arr)) return [];
    return arr
        .filter((p): p is string => typeof p === 'string' && p.length > 0)
        .map((p) => p.toLowerCase().trim())
        .filter((p) => PERMISSION_VALUES.has(p));
}

function readFromStorage(): { userRole: string | null; permissions: string[] } {
    let userRole: string | null = null;
    let permissions: string[] = [];
    try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('userInformation') : null;
        if (raw) {
            const parsed = JSON.parse(raw);
            const data = parsed?.data ?? parsed;
            if (data && typeof data === 'object') {
                const r = data.userRole;
                userRole = r !== undefined && r !== null ? String(r) : null;
                const rawPerms = data.permissions ?? data.permission_list ?? data.perms;
                permissions = normalizePermissionList(rawPerms);
                // Team member (role 2 or 3) with no permissions from API – use defaults so they don't see "no permissions"
                if ((userRole === '2' || userRole === '3') && permissions.length === 0) {
                    const roleNum = Number(userRole);
                    const defaults = DEFAULT_ROLE_PERMISSIONS[roleNum];
                    if (Array.isArray(defaults)) permissions = defaults;
                }
            }
        }
    } catch {
        // ignore
    }
    return { userRole, permissions };
}

/**
 * Returns current user role and permissions from localStorage (userInformation).
 * For team members (role 2, 3), permissions are set by API on login.
 * Re-reads on each call so it stays in sync after login.
 */
export function useUserPermissions(): {
    userRole: string | null;
    permissions: string[];
    isTeamMember: boolean;
    hasPermission: (key: PermissionKey | string) => boolean;
    canViewShops: boolean;
    canViewTeam: boolean;
    canViewShopOwners: boolean;
    canManageSubscriptions: boolean;
    canViewTickets: boolean;
    canViewAdminDashboard: boolean;
    canViewReports: boolean;
} {
    const { userRole, permissions } = readFromStorage();
    const isTeamMember = userRole === '2' || userRole === '3';

    const hasPermission = (key: PermissionKey | string): boolean => {
        if (userRole === '0') return true; // Super Admin has all
        return permissions.includes(key);
    };

    const canViewShops = hasPermission(PERMISSIONS.VIEW_SHOPS);
    const canViewTeam =
        hasPermission(PERMISSIONS.VIEW_TEAM) ||
        hasPermission(PERMISSIONS.ADD_TEAM_MEMBER) ||
        hasPermission(PERMISSIONS.EDIT_TEAM_PERMISSIONS);
    const canViewShopOwners =
        hasPermission(PERMISSIONS.VIEW_SHOP_OWNERS) ||
        hasPermission(PERMISSIONS.ADD_SHOP_OWNER) ||
        hasPermission(PERMISSIONS.EDIT_SHOP_OWNER) ||
        hasPermission(PERMISSIONS.BLOCK_SHOP_OWNER);
    const canManageSubscriptions = hasPermission(PERMISSIONS.MANAGE_SUBSCRIPTIONS);
    const canViewTickets =
        hasPermission(PERMISSIONS.VIEW_ALL_TICKETS) ||
        hasPermission(PERMISSIONS.ASSIGN_TICKET) ||
        hasPermission(PERMISSIONS.REPLY_TICKET) ||
        hasPermission(PERMISSIONS.CLOSE_TICKET);
    const canViewAdminDashboard = hasPermission(PERMISSIONS.VIEW_ADMIN_DASHBOARD);
    const canViewReports = hasPermission(PERMISSIONS.VIEW_REPORTS);

    return {
        userRole,
        permissions,
        isTeamMember,
        hasPermission,
        canViewShops,
        canViewTeam,
        canViewShopOwners,
        canManageSubscriptions,
        canViewTickets,
        canViewAdminDashboard,
        canViewReports,
    };
}
