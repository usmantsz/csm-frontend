/**
 * Permission keys – must match API constants/roles.js PERMISSIONS
 * Used for sidebar and dashboard visibility for team members (role 2, 3).
 */
export const PERMISSIONS = {
    ADD_TEAM_MEMBER: 'add_team_member',
    REMOVE_TEAM_MEMBER: 'remove_team_member',
    EDIT_TEAM_PERMISSIONS: 'edit_team_permissions',
    VIEW_TEAM: 'view_team',
    VIEW_SHOPS: 'view_shops',
    ADD_SHOP_OWNER: 'add_shop_owner',
    EDIT_SHOP_OWNER: 'edit_shop_owner',
    BLOCK_SHOP_OWNER: 'block_shop_owner',
    VIEW_SHOP_OWNERS: 'view_shop_owners',
    VIEW_ALL_TICKETS: 'view_all_tickets',
    ASSIGN_TICKET: 'assign_ticket',
    CLOSE_TICKET: 'close_ticket',
    REPLY_TICKET: 'reply_ticket',
    MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
    VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
    VIEW_REPORTS: 'view_reports',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Block, Delete, Remove type actions – only Super Admin (0) and Sub Admin (2).
 * Team Member (3) can never block/delete shop owners or remove team members.
 */
export function canPerformRestrictedActions(userRole: string | null): boolean {
    return userRole === '0' || userRole === '2';
}

/** Who can access which page and which actions – for UI and docs */
export const PERMISSION_MATRIX = {
    shops: {
        page: '/shop',
        view: { roles: ['0', '2', '3'], permission: 'view_shops' },
        viewDetails: { roles: ['0', '2', '3'], permission: 'view_shops' },
    },
    shopOwners: {
        page: '/shopowner',
        view: { roles: ['0', '2', '3'], permission: 'view_shop_owners' },
        add: { roles: ['0', '2', '3'], permission: 'add_shop_owner' },
        edit: { roles: ['0', '2', '3'], permission: 'edit_shop_owner' },
        blockDelete: { roles: ['0', '2'] }, // only Admin & Sub Admin
    },
    team: {
        page: '/admin/team',
        view: { roles: ['0', '2', '3'], permission: 'view_team' },
        add: { roles: ['0', '2', '3'], permission: 'add_team_member' },
        editPermissions: { roles: ['0', '2', '3'], permission: 'edit_team_permissions' },
        remove: { roles: ['0', '2'] }, // only Admin & Sub Admin
    },
    subscriptions: {
        page: '/subcriptions',
        view: { roles: ['0', '2', '3'], permission: 'manage_subscriptions' },
        add: { roles: ['0', '2', '3'], permission: 'manage_subscriptions' },
        edit: { roles: ['0', '2', '3'], permission: 'manage_subscriptions' },
        sensitiveActions: { roles: ['0', '2'] }, // cancel/delete only Admin & Sub Admin if we add later
    },
    support: {
        page: '/support',
        view: { roles: ['0', '1', '2', '3'], permission: 'view_all_tickets' },
        assign: { roles: ['0', '2', '3'], permission: 'assign_ticket' },
        reply: { roles: ['0', '1', '2', '3'], permission: 'reply_ticket' },
        close: { roles: ['0', '2', '3'], permission: 'close_ticket' },
    },
} as const;

/** Default permissions per role when API sends none – must match API constants/roles.js */
export const DEFAULT_ROLE_PERMISSIONS: Record<number, string[]> = {
    0: Object.values(PERMISSIONS),
    2: [
        PERMISSIONS.VIEW_TEAM,
        PERMISSIONS.ADD_TEAM_MEMBER,
        PERMISSIONS.REMOVE_TEAM_MEMBER,
        PERMISSIONS.EDIT_TEAM_PERMISSIONS,
        PERMISSIONS.VIEW_SHOPS,
        PERMISSIONS.VIEW_SHOP_OWNERS,
        PERMISSIONS.ADD_SHOP_OWNER,
        PERMISSIONS.EDIT_SHOP_OWNER,
        PERMISSIONS.VIEW_ALL_TICKETS,
        PERMISSIONS.ASSIGN_TICKET,
        PERMISSIONS.CLOSE_TICKET,
        PERMISSIONS.REPLY_TICKET,
        PERMISSIONS.VIEW_ADMIN_DASHBOARD,
        PERMISSIONS.VIEW_REPORTS,
    ],
    3: [
        PERMISSIONS.VIEW_ALL_TICKETS,
        PERMISSIONS.ASSIGN_TICKET,
        PERMISSIONS.CLOSE_TICKET,
        PERMISSIONS.REPLY_TICKET,
    ],
};
