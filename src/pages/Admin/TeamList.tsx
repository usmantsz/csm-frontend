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
import IconPlus from '../../components/Icon/IconPlus';
import IconMenuUsers from '../../components/Icon/Menu/IconMenuUsers';
import { confirmDelete } from '../../utils/sweetAlert';
import PermissionMatrixPanel from '../../components/Agricultural/PermissionMatrixPanel';
import IconArrowRight from '../../components/Icon/IconArrowRight';

const card =
    'rounded-2xl border border-primary-200 bg-white/95 p-6 md:p-8 shadow-sm transition-shadow hover:shadow-md dark:border-[#162b3d] dark:bg-[#0b1926] dark:shadow-xl';
const actionChipWide =
    'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors border';

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
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-green-600 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700 shadow-sm transition-colors hover:bg-green-600 hover:text-white dark:border-[#1a344d] dark:bg-[#091624] dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:bg-[#091624] dark:hover:text-white"
                >
                    <IconArrowRight className="w-4 h-4 rtl:rotate-180 dark:text-emerald-400" />
                    {t('back_to_dashboard')}
                </Link>
            </div>

            <div className={card}>
                {/* Heading + Add button */}
                <div className="mb-4 flex flex-col gap-4 border-b border-primary-100 pb-6 dark:border-[#162b3d]/60 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-gray-100 text-success dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:text-emerald-400 dark:shadow-[0_0_15px_rgba(16,185,129,0.12)] dark:ring-0">
                            <IconMenuUsers className="w-6 h-6" />
                        </span>
                        <div>
                            <h2 className="text-xl font-bold text-success dark:text-white">{t('team_members_page')}</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{t('team_members_desc')}</p>
                        </div>
                    </div>
                    <Link
                        to="/admin/team/add"
                        className="inline-flex items-center gap-2 self-start rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-success/90 dark:bg-emerald-500 dark:shadow-lg dark:shadow-emerald-500/20 dark:hover:bg-emerald-600 dark:active:scale-[0.98]"
                    >
                        <IconPlus className="w-4 h-4" />
                        {t('add_team_member_page')}
                    </Link>
                </div>

                {/* Filter row */}
                <div className="mb-5 flex flex-wrap items-center gap-3 pt-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">{t('form_role')}:</label>
                    <select
                        className="h-[42px] min-w-[180px] rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20 dark:border-[#162b3d] dark:bg-[#07131e] dark:text-slate-200 dark:hover:border-[#1f3b54] dark:focus:border-emerald-500 dark:focus:ring-1 dark:focus:ring-emerald-500"
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
                        <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent dark:border-emerald-500"></div>
                        <p className="text-gray-500 dark:text-slate-400">{t('loading')}</p>
                    </div>
                ) : team.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-gray-100 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:shadow-none dark:ring-0">
                            <IconMenuUsers className="w-7 h-7 text-primary/60 dark:text-emerald-400/70" />
                        </div>
                        <p className="text-gray-500 dark:text-slate-400">No team members. Add one to manage support and permissions.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-primary-100 dark:border-[#162b3d] dark:bg-[#07131f]/70">
                        <table className="w-full table-auto border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-primary-100 bg-primary-50 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-[#162b3d] dark:bg-[#091826] dark:text-slate-400">
                                    <th className="px-5 py-3.5">{t('form_name')}</th>
                                    <th className="px-5 py-3.5">{t('email_column')}</th>
                                    <th className="px-5 py-3.5">{t('phone_number')}</th>
                                    <th className="px-5 py-3.5">{t('form_role')}</th>
                                    <th className="px-5 py-3.5">{t('status')}</th>
                                    <th className="px-5 py-3.5 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="dark:divide-y dark:divide-[#162b3d]/60">
                                {team.map((u) => (
                                    <tr
                                        key={u._id}
                                        className="border-b border-primary-100 transition-colors last:border-0 hover:bg-primary-50 dark:border-0 dark:hover:bg-[#0d2031]/50"
                                    >
                                        <td className="px-5 py-4 font-medium text-gray-800 whitespace-nowrap dark:font-semibold dark:text-slate-100">
                                            {u.userNameF} {u.userNameL}
                                        </td>
                                        <td className="px-5 py-4 text-gray-700 whitespace-nowrap dark:text-slate-400">{u.userEmail}</td>
                                        <td className="px-5 py-4 text-gray-700 whitespace-nowrap dark:text-slate-300">{u.userPhone || '-'}</td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className="rounded-lg bg-primary-light px-3 py-1 text-xs font-semibold text-primary dark:border dark:border-[#17364f] dark:bg-[#0b2132] dark:font-medium dark:text-slate-300">
                                                {ROLE_MAP[u.userRole] ?? u.userRole}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span
                                                className={`badge ${
                                                    u.userStatus === 1 ? 'badge-outline-success' : 'badge-outline-danger'
                                                } dark:border dark:!bg-transparent ${
                                                    u.userStatus === 1
                                                        ? 'dark:border-emerald-500/30 dark:!bg-emerald-500/10 dark:!text-emerald-400'
                                                        : 'dark:border-red-900/40 dark:!bg-red-950/40 dark:!text-red-400'
                                                }`}
                                            >
                                                {u.userStatus === 1 ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right whitespace-nowrap">
                                            <div className="flex flex-nowrap items-center justify-end gap-1.5">
                                                {canEditPermissions && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditPermissions(u)}
                                                        className={`${actionChipWide} border-transparent bg-primary-light text-primary hover:bg-primary-200 dark:border-[#1b3952] dark:bg-[#0e2133] dark:text-slate-200 dark:hover:bg-[#132c45]`}
                                                    >
                                                        Permissions
                                                    </button>
                                                )}
                                                {canRemoveMember && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMember(u)}
                                                        className={`${actionChipWide} border-transparent bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60`}
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
                            <div className="flex items-center justify-between border-t border-primary-100 px-4 py-3 dark:border-[#162b3d]">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="rounded-xl border border-primary-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#162b3d] dark:bg-[#07131e] dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-[#07131e] dark:hover:text-white"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500 dark:text-slate-400">Page {page} of {totalPages}</span>
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="rounded-xl border border-primary-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#162b3d] dark:bg-[#07131e] dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-[#07131e] dark:hover:text-white"
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
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-lg rounded-2xl border border-primary-200 bg-white/95 p-6 text-gray-700 shadow-xl dark:border-[#162b3d] dark:bg-[#0b1926] dark:text-slate-300">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Edit Permissions – {selectedUser?.userNameF} {selectedUser?.userNameL}
                                        </h5>
                                        <button
                                            type="button"
                                            onClick={() => setEditModal(false)}
                                            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#0f2030] dark:hover:text-white"
                                        >
                                            <IconX className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="max-h-80 space-y-1 overflow-y-auto rounded-2xl border border-primary-100 bg-primary-50/60 p-3 dark:border-[#162b3d] dark:bg-[#07131e]">
                                        {permissionList.map((p) => (
                                            <label
                                                key={p.value}
                                                className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-primary-light dark:hover:bg-emerald-500/10"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPerms.includes(p.value)}
                                                    onChange={() => togglePerm(p.value)}
                                                    className="form-checkbox rounded text-primary dark:border-[#1b3952] dark:bg-[#091522] dark:text-emerald-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-slate-300">{p.key}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditModal(false)}
                                            className="rounded-xl border border-primary-200 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-[#162b3d] dark:bg-[#07131e] dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={savePermissions}
                                            disabled={savingPerms}
                                            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:shadow-lg dark:shadow-emerald-500/20 dark:hover:bg-emerald-600"
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