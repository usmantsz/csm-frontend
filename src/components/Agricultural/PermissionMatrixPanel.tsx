import { useState } from 'react';
import IconCaretDown from '../Icon/IconCaretDown';

const ROLE_LABELS: Record<string, string> = {
    '0': 'Super Admin',
    '1': 'Shop Owner',
    '2': 'Sub Admin',
    '3': 'Team Member',
};

export default function PermissionMatrixPanel() {
    const [open, setOpen] = useState(false);

    return (
        <div className="overflow-hidden rounded-[2rem] border border-primary-200 bg-white/95 shadow-sm transition-shadow hover:shadow-md dark:border-primary-800 dark:bg-gray-900/85">
            <button
                type="button"
                className="flex w-full items-center justify-between gap-3 p-5 text-left"
                onClick={() => setOpen(!open)}
            >
                <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xl ring-1 ring-gray-100 text-primary dark:bg-primary/20 dark:text-primary-light dark:shadow-none dark:ring-0">
                           <span aria-hidden>📋</span>
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">Who can access which page &amp; actions</span>
                </span>
                <span className={`text-gray-400 transition-transform dark:text-gray-500 ${open ? 'rotate-180' : ''}`}>
                    <IconCaretDown />
                </span>
            </button>
            {open && (
                <div className="space-y-4 border-t border-primary-100 px-5 pb-5 pt-4 dark:border-white/10">
                    <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        Team Member (3) can never Block/Delete shop owners or Remove team members — only Super Admin &amp; Sub Admin can.
                    </p>
                    <div className="overflow-x-auto rounded-2xl border border-primary-100 dark:border-white/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-primary-100 bg-primary-50 dark:border-white/10 dark:bg-white/5">
                                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Page</th>
                                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">View</th>
                                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Add</th>
                                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Edit</th>
                                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Block / Delete / Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-primary-100 transition-colors hover:bg-primary-50 dark:border-white/10 dark:hover:bg-white/5">
                                    <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">Shops</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">Admin, Sub Admin, Team (with view_shops)</td>
                                    <td className="px-3 py-2.5 text-gray-400 dark:text-gray-500">—</td>
                                    <td className="px-3 py-2.5 text-gray-400 dark:text-gray-500">—</td>
                                    <td className="px-3 py-2.5 text-gray-400 dark:text-gray-500">—</td>
                                </tr>
                                <tr className="border-t border-primary-100 transition-colors hover:bg-primary-50 dark:border-white/10 dark:hover:bg-white/5">
                                    <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">Shop Owners</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">Admin, Sub Admin, Team (with view_shop_owners)</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">Admin, Sub Admin, Team (with add_shop_owner)</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">Admin, Sub Admin, Team (with edit_shop_owner)</td>
                                    <td className="px-3 py-2.5 font-semibold text-red-600 dark:text-red-400">Only Admin &amp; Sub Admin</td>
                                </tr>
                                <tr className="border-t border-primary-100 transition-colors hover:bg-primary-50 dark:border-white/10 dark:hover:bg-white/5">
                                    <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">Team</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">Admin, Sub Admin, Team (with view_team)</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">Admin, Sub Admin, Team (with add_team_member)</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">Admin, Sub Admin, Team (with edit_team_permissions)</td>
                                    <td className="px-3 py-2.5 font-semibold text-red-600 dark:text-red-400">Only Admin &amp; Sub Admin</td>
                                </tr>
                                <tr className="border-t border-primary-100 transition-colors hover:bg-primary-50 dark:border-white/10 dark:hover:bg-white/5">
                                    <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">Subscriptions</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">Admin, Sub Admin, Team (with manage_subscriptions)</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">Admin, Sub Admin, Team (with manage_subscriptions)</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">Admin, Sub Admin, Team (with manage_subscriptions)</td>
                                    <td className="px-3 py-2.5 text-gray-400 dark:text-gray-500">—</td>
                                </tr>
                                <tr className="border-t border-primary-100 transition-colors last:border-b-0 hover:bg-primary-50 dark:border-white/10 dark:hover:bg-white/5">
                                    <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">Support</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">All with view_all_tickets</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">Create ticket</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">Reply, Assign, Close (by permission)</td>
                                    <td className="px-3 py-2.5 text-gray-400 dark:text-gray-500">—</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        Roles: {Object.entries(ROLE_LABELS).map(([k, v]) => `${k}=${v}`).join(', ')}. Team Member (3) sees only permitted pages; URL without permission shows 404.
                    </p>
                </div>
            )}
        </div>
    );
}
