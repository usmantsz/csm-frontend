import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { Notification } from '../../helperComponents/Notification';
import IconEye from '../../components/Icon/IconEye';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconUser from '../../components/Icon/IconUser';
import IconMenuUsers from '../../components/Icon/Menu/IconMenuUsers';

const card =
    'rounded-[2rem] border border-white-dark/10 bg-white/95 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#0b1526]/85';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-gray-100 text-primary dark:bg-primary/20 dark:shadow-none dark:ring-0';
const subSectionHeading = 'text-lg font-semibold text-primary dark:text-primary-light';

interface PermissionItem {
    key: string;
    value: string;
}

const AddTeamMember = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const [userNameF, setUserNameF] = useState('');
    const [userNameL, setUserNameL] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [userCNIC, setUserCNIC] = useState('');
    const [userProvince, setUserProvince] = useState('');
    const [userCity, setUserCity] = useState('');
    const [userAdress, setUserAdress] = useState('');
    const [userPassword, setUserPassword] = useState('ChangeMe@123');
    const [userRole, setUserRole] = useState<number>(3);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [permissionList, setPermissionList] = useState<PermissionItem[]>([]);
    const [loadingPerms, setLoadingPerms] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('add_team_member_page')));
    }, [dispatch, t]);

    useEffect(() => {
        if (token) {
            axios
                .get(`${ServerSetting.apiUrl}/admin/team/permissions`, { headers: { Authorization: `Bearer ${token}` } })
                .then((res) => {
                    if (res.data?.success && res.data?.data?.permissions) {
                        setPermissionList(res.data.data.permissions);
                    }
                })
                .catch(() => {})
                .finally(() => setLoadingPerms(false));
        }
    }, [token]);

    const togglePerm = (value: string) => {
        setPermissions((prev) =>
            prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userNameF.trim() || !userNameL.trim() || !userEmail.trim() || !userPhone || !userCNIC) {
            Notification({ text: 'Name, Email, Phone and CNIC are required', color: 'warning' });
            return;
        }
        setSubmitting(true);
        axios
            .post(
                `${ServerSetting.apiUrl}/admin/team`,
                {
                    userNameF: userNameF.trim(),
                    userNameL: userNameL.trim(),
                    userEmail: userEmail.trim(),
                    userPhone: String(userPhone).trim(),
                    userCNIC: String(userCNIC).replace(/\D/g, ''),
                    userProvince: userProvince.trim() || 'N/A',
                    userCity: userCity.trim() || 'N/A',
                    userAdress: userAdress.trim() || 'N/A',
                    userPassword: userPassword || 'ChangeMe@123',
                    userRole: Number(userRole),
                    permissions,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((res) => {
                if (res.data?.success) {
                    Notification({ text: res.data.message || 'Team member added', color: 'success' });
                    navigate('/admin/team');
                } else {
                    Notification({ text: res.data?.message || 'Failed to add', color: 'danger' });
                }
            })
            .catch((err) => {
                Notification({ text: err.response?.data?.message || 'Failed to add team member', color: 'danger' });
            })
            .finally(() => setSubmitting(false));
    };

    return (
        <div className="space-y-6">
            <div className='flex justify-end'>
            <button
                type="button"
                onClick={() => navigate('/admin/team')}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-md transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:shadow-none dark:hover:bg-green-700 dark:hover:text-white"
            >
                <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('back_to_team_list')}
            </button>
            </div>

            {/* Centered form container */}
            <div className="flex justify-center px-0">
                <div className="w-full max-w-5xl">
                    <form onSubmit={handleSubmit} className="space-y-0">
                        <div className={`${card} overflow-hidden`}>
                            {/* Heading inside the card */}
                            <div className="flex items-center gap-3 border-b border-white-dark/10 p-6 dark:border-white/10 lg:px-8">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-gray-100 text-success dark:bg-success/20 dark:shadow-none dark:ring-0">
                                    <IconMenuUsers className="w-5 h-5" />
                                </span>
                                <div>
                                    <h2 className="text-xl font-bold text-success">{t('add_team_member_page')}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('add_team_member_desc')}</p>
                                </div>
                            </div>

                            {/* Two-column layout: left = Personal & Contact, right = Account & Permissions */}
                            <div className="grid grid-cols-1 divide-y divide-white-dark/10 lg:grid-cols-2 lg:divide-x lg:divide-y-0 dark:divide-white/10">
                                {/* Left column – Personal & Contact */}
                                <div className="space-y-5 p-6 lg:p-8">
                                    <div className="mb-1 flex items-center gap-3 border-b border-white-dark/10 pb-3 dark:border-white/10">
                                        <span className={iconBadge}>
                                            <IconUser className="w-5 h-5" />
                                        </span>
                                        <h3 className={subSectionHeading}>{t('section_personal_contact')}</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="form-label">{t('form_first_name')} <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={userNameF}
                                                onChange={(e) => setUserNameF(e.target.value)}
                                                required
                                                placeholder={t('form_placeholder_first_name')}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">{t('form_last_name')} <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={userNameL}
                                                onChange={(e) => setUserNameL(e.target.value)}
                                                required
                                                placeholder={t('form_placeholder_last_name')}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="form-label">{t('form_email')} <span className="text-danger">*</span></label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={userEmail}
                                            onChange={(e) => setUserEmail(e.target.value)}
                                            required
                                            placeholder={t('form_placeholder_email')}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="form-label">{t('form_phone')} <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={userPhone}
                                                onChange={(e) => setUserPhone(e.target.value)}
                                                required
                                                placeholder={t('form_placeholder_phone')}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">{t('form_cnic')} <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder={t('form_placeholder_cnic_without_dashes')}
                                                value={userCNIC}
                                                onChange={(e) => setUserCNIC(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="form-label">{t('province')}</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={userProvince}
                                                onChange={(e) => setUserProvince(e.target.value)}
                                                placeholder={t('form_placeholder_province')}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">{t('city')}</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={userCity}
                                                onChange={(e) => setUserCity(e.target.value)}
                                                placeholder={t('form_placeholder_city')}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="form-label">{t('form_address')}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={userAdress}
                                            onChange={(e) => setUserAdress(e.target.value)}
                                            placeholder={t('form_placeholder_street_address')}
                                        />
                                    </div>
                                </div>

                                {/* Right column – Account & Permissions */}
                                <div className="space-y-5 bg-white-dark/[0.02] p-6 dark:bg-black/20 lg:p-8">
                                    <div className="mb-1 flex items-center gap-3 border-b border-white-dark/10 pb-3 dark:border-white/10">
                                        <span className={iconBadge}>
                                            <IconMenuUsers className="w-5 h-5" />
                                        </span>
                                        <h3 className={subSectionHeading}>{t('section_account_permissions')}</h3>
                                    </div>
                                    <div>
                                        <label className="form-label">{t('form_password')}</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="form-input pr-10"
                                                value={userPassword}
                                                onChange={(e) => setUserPassword(e.target.value)}
                                                placeholder={t('form_placeholder_password_default')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-white-dark hover:text-primary"
                                                title={showPassword ? t('hide_password') : t('show_password')}
                                            >
                                                <IconEye className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <p className="mt-1 text-xs text-white-dark">{t('form_password_hint')}</p>
                                    </div>
                                    <div>
                                        <label className="form-label">{t('form_role')} <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select w-full"
                                            value={userRole}
                                            onChange={(e) => setUserRole(Number(e.target.value))}
                                        >
                                            <option value={2}>{t('sub_admin')}</option>
                                            <option value={3}>{t('team_member_role')}</option>
                                        </select>
                                    </div>

                                    {/* Permissions – optional, role has defaults */}
                                    <div>
                                        <div className="mb-2 flex items-center gap-2">
                                            <label className="form-label mb-0">{t('form_permissions')}</label>
                                            <span className="rounded bg-white-dark/10 px-2 py-0.5 text-xs font-normal text-white-dark dark:bg-white/10">
                                                {t('form_permissions_optional')}
                                            </span>
                                            {permissions.length > 0 && (
                                                <span className="rounded bg-success/10 px-2 py-0.5 text-xs font-semibold text-success dark:bg-success/20">
                                                    {permissions.length} {t('selected') || 'selected'}
                                                </span>
                                            )}
                                        </div>
                                        {loadingPerms ? (
                                            <div className="flex items-center gap-2 py-4 text-sm text-white-dark">
                                                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                {t('loading_permissions')}
                                            </div>
                                        ) : permissionList.length > 0 ? (
                                            <div className="max-h-56 space-y-2.5 overflow-y-auto rounded-lg border border-white-dark/20 bg-white p-4 dark:border-white/10 dark:bg-black/20">
                                                {permissionList.map((p) => (
                                                    <label
                                                        key={p.value}
                                                        className="-mx-2 -my-1.5 flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-white-dark/5 dark:hover:bg-white/5"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={permissions.includes(p.value)}
                                                            onChange={() => togglePerm(p.value)}
                                                            className="form-checkbox rounded text-primary"
                                                        />
                                                        <span className="text-sm text-dark dark:text-white-light">{p.key}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-white-dark">{t('no_extra_permissions')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer actions – full width */}
                            <div className="flex flex-wrap justify-end gap-3 border-t border-white-dark/10 bg-white-dark/[0.03] px-6 py-4 dark:border-white/10 dark:bg-black/20 lg:px-8">
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin/team')}
                                    className="rounded-2xl border border-white-dark/20 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-2 rounded-2xl bg-success px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent align-middle" />
                                            {t('btn_adding')}
                                        </>
                                    ) : (
                                        t('add_team_member_page')
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddTeamMember;