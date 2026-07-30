/**
 * For team members (role 2, 3): which path requires which permissions.
 * User must have AT LEAST ONE of the listed permissions to access the route.
 * If path is not listed, no permission check (e.g. dashboard).
 */
import { PERMISSIONS } from '../constants/permissions';

type PathRule = { pattern: RegExp | string; permissions: string[] };

const PATH_PERMISSION_RULES: PathRule[] = [
    // Shops – view shops list and details
    { pattern: /^\/shop(\/|$)/, permissions: [PERMISSIONS.VIEW_SHOPS] },
    
    // Shop Owners – granular: view list, add, edit separately
    { pattern: /^\/shopowner$/, permissions: [PERMISSIONS.VIEW_SHOP_OWNERS] }, // View list
    { pattern: /^\/creatshopowner(\/|$)/, permissions: [PERMISSIONS.ADD_SHOP_OWNER] }, // Add new
    { pattern: /^\/editshopowner\//, permissions: [PERMISSIONS.EDIT_SHOP_OWNER] }, // Edit existing
    
    // Subscriptions – all need manage_subscriptions
    { pattern: /^\/subcriptions(\/|$)/, permissions: [PERMISSIONS.MANAGE_SUBSCRIPTIONS] },
    { pattern: /^\/addsubcription(\/|$)/, permissions: [PERMISSIONS.MANAGE_SUBSCRIPTIONS] },
    { pattern: /^\/editsubcription\//, permissions: [PERMISSIONS.MANAGE_SUBSCRIPTIONS] },
    { pattern: /^\/SubcriptionHistory(\/|$)/, permissions: [PERMISSIONS.MANAGE_SUBSCRIPTIONS] },
    { pattern: /^\/viewHistoryspecifc\//, permissions: [PERMISSIONS.MANAGE_SUBSCRIPTIONS] },
    
    // Team – granular: view list, add member, edit permissions
    { pattern: /^\/admin\/team$/, permissions: [PERMISSIONS.VIEW_TEAM] }, // View team list
    { pattern: /^\/admin\/team\/add$/, permissions: [PERMISSIONS.ADD_TEAM_MEMBER] }, // Add member
    
    // Support – any ticket permission allows access
    { pattern: /^\/support(\/|$)/, permissions: [PERMISSIONS.VIEW_ALL_TICKETS, PERMISSIONS.ASSIGN_TICKET, PERMISSIONS.REPLY_TICKET, PERMISSIONS.CLOSE_TICKET] },
    
    // Dashboard overview – need view_admin_dashboard for stats
    // (Dashboard route itself is open to all team, but stats API checks this)
];

/**
 * Returns required permission keys for this path (for team members).
 * User must have at least one. Returns null if path has no permission requirement.
 */
export function getRequiredPermissionsForPath(pathname: string): string[] | null {
    const normalized = (pathname || '/').replace(/\/$/, '') || '/';
    for (const { pattern, permissions } of PATH_PERMISSION_RULES) {
        const matches = typeof pattern === 'string' ? normalized === pattern : pattern.test(normalized);
        if (matches) return permissions;
    }
    return null;
}
