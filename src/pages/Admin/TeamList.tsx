import { useEffect, useState, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { useUserPermissions } from '../../Hooks/useUserPermissions';
import { canPerformRestrictedActions, PERMISSIONS } from '../../constants/permissions';
import { Notification } from '../../helperComponents/Notification';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../components/Icon/IconX';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconPlus from '../../components/Icon/IconPlus';
import IconMenuUsers from '../../components/Icon/Menu/IconMenuUsers';
import { confirmDelete } from '../../utils/sweetAlert';
import PermissionMatrixPanel from '../../components/Agricultural/PermissionMatrixPanel';
import IconArrowRight from '../../components/Icon/IconArrowRight';

const card =
    'rounded-[2rem] border border-primary-200 bg-white/95 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-primary-800 dark:bg-gray-900/85';
const actionChipWide =
    'inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-colors';

const ROLE_MAP: Record<number, string> = { 0: 'Super Admin', 1: 'Shop Owner', 2: 'Sub Admin', 3: 'Team Member' };

interface TeamMember {
    _id: string;
    userNameF: string;
    userNameL: string;
    userEmail: string;
    userPhone?: string;
    userCNIC?: string;
    userRole: number;
    userStatus: number;
    permissions?: string[];
    createdAt?: string;
}

const TeamList = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const { userRole, hasPermission } = useUserPermissions();
    const canRemoveMember = canPerformRestrictedActions(userRole) && hasPermission(PERMISSIONS.REMOVE_TEAM_MEMBER);
    const canEditPermissions = userRole === '0' || userRole === '2' || hasPermission(PERMISSIONS.EDIT_TEAM_PERMISSIONS);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [permissionList, setPermissionList] = useState<{ key: string; value: string }[]>([]);
    const [editModal, setEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
    const [savingPerms, setSavingPerms] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('team_members_page')));
    }, [dispatch, t]);

    const fetchTeam = () => {
        setLoading(true);
        const params: Record<string, string | number> = { page, limit: 20 };
        if (roleFilter !== '') params.role = roleFilter;
        axios
            .get(`${ServerSetting.apiUrl}/admin/team`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            })
            .then((res) => {
                if (res.data?.success && res.data?.data) {
                    setTeam(res.data.data.team || []);
                    setTotalPages(res.data.data.pagination?.totalPages || 1);
                }
            })
            .catch((err) => Notification({ text: err.response?.data?.message || 'Failed to load team', color: 'danger' }))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (token) fetchTeam();
    }, [token, page, roleFilter]);

    useEffect(() => {
        if (token) {
            axios
                .get(`${ServerSetting.apiUrl}/admin/team/permissions`, { headers: { Authorization: `Bearer ${token}` } })
                .then((res) => {
                    if (res.data?.success && res.data?.data?.permissions) {
                        setPermissionList(res.data.data.permissions);
                    }
                })
                .catch(() => {});
        }
    }, [token]);

    const openEditPermissions = (user: TeamMember) => {
        setSelectedUser(user);
        setSelectedPerms(user.permissions || []);
        setEditModal(true);
    };

    const togglePerm = (value: string) => {
        setSelectedPerms((prev) =>
            prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
        );
    };

    const savePermissions = () => {
        if (!selectedUser || !token) return;
        setSavingPerms(true);
        axios
            .patch(
                `${ServerSetting.apiUrl}/admin/team/${selectedUser._id}/permissions`,
                { permissions: selectedPerms },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((res) => {
                if (res.data?.success) {
                    Notification({ text: 'Permissions updated', color: 'success' });
                    setEditModal(false);
                    setSelectedUser(null);
                    fetchTeam();
                }
            })
            .catch((err) => Notification({ text: err.response?.data?.message || 'Failed to update', color: 'danger' }))
            .finally(() => setSavingPerms(false));
    };

    const removeMember = async (user: TeamMember) => {
        const ok = await confirmDelete(`${user.userNameF} ${user.userNameL}`);
        if (!ok || !token) return;
        axios
            .delete(`${ServerSetting.apiUrl}/admin/team/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (res.data?.success) {
                    Notification({ text: res.data.message || 'Team member removed', color: 'success' });
                    fetchTeam();
                }
            })
            .catch((err) => Notification({ text: err.response?.data?.message || 'Failed to remove', color: 'danger' }));
    };

    return (
        <div className="space-y-6">
            <div className='flex justify-end w-full'>
                <Link
                to="/dashboard"
className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"            >
                <IconArrowRight className="w-4 h-4 rtl:rotate-180"/>
                {t('back_to_dashboard')}
            </Link>
            </div>
            

            <div className={card}>
                {/* Heading + Add button */}
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-gray-100 text-success dark:bg-success/20 dark:shadow-none dark:ring-0">
                            <IconMenuUsers className="w-5 h-5" />
                        </span>
                        <div>
                            <h2 className="text-xl font-bold text-success">{t('team_members_page')}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('team_members_desc')}</p>
                        </div>
                    </div>
                    <Link
                        to="/admin/team/add"
                        className="inline-flex items-center gap-2 self-start rounded-2xl bg-success px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-success/90"
                    >
                        <IconPlus className="w-4 h-4" />
                        {t('add_team_member_page')}
                    </Link>
                </div>

                {/* Filter row */}
                <div className="mb-5 flex flex-wrap items-center gap-3 border-t border-primary-100 pt-4 dark:border-white/10">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('form_role')}:</label>
                    <select
                        className="form-select h-[40px] min-w-[160px] rounded-xl border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm transition-colors focus:border-success focus:ring-2 focus:ring-success/20 dark:border-white/10 dark:bg-gray-900 dark:text-gray-200"
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">{t('all_roles')}</option>
                        <option value="2">{t('sub_admin')}</option>
                        <option value="3">{t('team_member_role')}</option>
                    </select>
                </div>

                {loading ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent dark:border-primary-light"></div>
                        <p className="text-gray-500 dark:text-gray-400">{t('loading')}</p>
                    </div>
                ) : team.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-gray-100 dark:bg-white/5 dark:shadow-none dark:ring-0">
                            <IconMenuUsers className="w-7 h-7 text-primary/60 dark:text-primary-light/60" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">No team members. Add one to manage support and permissions.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-primary-100 dark:border-white/10">
                        <table className="w-full table-auto text-sm">
                            <thead>
                                <tr className="border-b border-primary-100 bg-primary-50 dark:border-white/10 dark:bg-white/5">
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">{t('form_name')}</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">{t('email_column')}</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">{t('phone_number')}</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">{t('form_role')}</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">{t('status')}</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-500 dark:text-gray-400">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {team.map((u) => (
                                    <tr key={u._id} className="border-b border-primary-100 transition-colors last:border-0 hover:bg-primary-50 dark:border-white/10 dark:hover:bg-white/5">
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{u.userNameF} {u.userNameL}</td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{u.userEmail}</td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{u.userPhone || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-lg bg-primary-light px-2 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-primary-light">
                                                {ROLE_MAP[u.userRole] ?? u.userRole}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`badge ${u.userStatus === 1 ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                                {u.userStatus === 1 ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1.5 flex-nowrap whitespace-nowrap">
                                                {canEditPermissions && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditPermissions(u)}
                                                        className={`${actionChipWide} bg-primary-light text-primary hover:bg-primary-200 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/50`}
                                                    >
                                                        Permissions
                                                    </button>
                                                )}
                                                {canRemoveMember && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMember(u)}
                                                        className={`${actionChipWide} bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20`}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-primary-100 px-4 py-3 dark:border-white/10">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="rounded-xl border border-primary-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-800 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="rounded-xl border border-primary-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-800 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <PermissionMatrixPanel />

            <Transition appear show={editModal} as={Fragment}>
                <Dialog as="div" open={editModal} onClose={() => setEditModal(false)} className="relative z-[51]">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-lg rounded-[2rem] border border-primary-200 bg-white/95 p-6 text-gray-700 shadow-xl dark:border-primary-800 dark:bg-gray-900/95 dark:text-gray-300">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Permissions – {selectedUser?.userNameF} {selectedUser?.userNameL}</h5>
                                        <button
                                            type="button"
                                            onClick={() => setEditModal(false)}
                                            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
                                        >
                                            <IconX className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="max-h-80 space-y-1 overflow-y-auto rounded-2xl border border-primary-100 bg-primary-50/60 p-3 dark:border-white/10 dark:bg-white/5">
                                        {permissionList.map((p) => (
                                            <label
                                                key={p.value}
                                                className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-primary-light dark:hover:bg-primary/15"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPerms.includes(p.value)}
                                                    onChange={() => togglePerm(p.value)}
                                                    className="form-checkbox rounded text-primary"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{p.key}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditModal(false)}
                                            className="rounded-2xl border border-primary-200 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-primary-800 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={savePermissions}
                                            disabled={savingPerms}
                                            className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {savingPerms ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default TeamList;