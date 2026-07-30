import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import axios from 'axios';
import Swal from 'sweetalert2';
import PageHeader from '../../components/Agricultural/PageHeader';

type PendingRequest = {
    _id: string;
    receiptNumber: string;
    customerName: string;
    customerCNIC: string;
    shopName: string;
    totalAmount: number;
    items: { productName: string; quantity: number; unitPrice: number; lineTotal: number }[];
    shopOwnerId?: { userNameF?: string; userNameL?: string };
    createdAt: string;
};

const PosPendingRequests = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const [customerCNIC, setCustomerCNIC] = useState('');
    const [shopName, setShopName] = useState('');
    const [searching, setSearching] = useState(false);
    const [list, setList] = useState<PendingRequest[]>([]);
    const [fulfillId, setFulfillId] = useState<string | null>(null);
    const [remarks, setRemarks] = useState('');
    const [searchHint, setSearchHint] = useState<string | null>(null);

    useEffect(() => {
        dispatch(setPageTitle(t('pos_pr_page_title')));
    }, [dispatch, t, i18n.language]);

    const handleSearch = () => {
        const cnic = customerCNIC.replace(/\D/g, '').trim();
        if (cnic.length < 10) {
            Swal.fire({ title: t('pos_pr_invalid_cnic_title'), text: t('pos_pr_invalid_cnic_text'), icon: 'warning' });
            return;
        }
        if (!token) return;
        setSearching(true);
        setSearchHint(null);
        const params: Record<string, string> = { customerCNIC: cnic };
        if (shopName.trim()) params.shopName = shopName.trim();
        axios
            .get(`${ServerSetting.apiUrl}/shop-owner-pos/requests/by-customer`, {
                params,
                headers: { Authorization: `Bearer ${token}` },
                validateStatus: () => true,
            })
            .then((r) => {
                const data = Array.isArray(r.data?.data) ? r.data.data : [];
                setList(data);
                const hint = r.data?.meta?.hint as string | undefined;
                if (hint === 'clear_shop_filter') setSearchHint(t('pos_pr_hint_clear_shop'));
                else if (hint === 'only_fulfilled') setSearchHint(t('pos_pr_hint_only_fulfilled'));
                else if (hint === 'add_shop_name') setSearchHint(t('pos_pr_hint_add_shop'));
                else if (data.length === 0) setSearchHint(t('pos_pr_hint_none'));
                else setSearchHint(null);
            })
            .catch(() => {
                setList([]);
                setSearchHint(null);
            })
            .finally(() => setSearching(false));
    };

    const handleFulfill = (id: string) => {
        if (!token) return;
        setFulfillId(id);
        Swal.fire({
            title: t('pos_pr_deliver_title'),
            html: `
                <p class="text-left mb-2">${t('pos_pr_deliver_html_note')}</p>
                <textarea id="swal-remarks" class="swal2-textarea w-full border rounded p-2" rows="3" placeholder="${t('pos_pr_deliver_ph')}">${remarks}</textarea>
            `,
            showCancelButton: true,
            confirmButtonText: t('pos_pr_submit_delivered'),
            cancelButtonText: t('pos_cancel'),
            preConfirm: () => (document.getElementById('swal-remarks') as HTMLTextAreaElement)?.value || '',
        }).then((result) => {
            if (!result.isConfirmed) {
                setFulfillId(null);
                return;
            }
            const rem = (result.value || '').trim();
            axios
                .patch(
                    `${ServerSetting.apiUrl}/shop-owner-pos/requests/${id}/fulfill`,
                    { remarks: rem },
                    { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
                )
                .then((res) => {
                    if (res.data.status === 200) {
                        Swal.fire({ title: t('pos_pr_done'), text: res.data.message || t('pos_pr_notified'), icon: 'success' });
                        setList((prev) => prev.filter((r) => r._id !== id));
                    } else {
                        Swal.fire({ title: t('pos_error'), text: res.data.message || t('pos_pr_failed'), icon: 'error' });
                    }
                })
                .catch(() => Swal.fire({ title: t('pos_error'), text: t('pos_pr_request_failed'), icon: 'error' }))
                .finally(() => setFulfillId(null));
        });
    };

    const handleCancel = (id: string) => {
        if (!token) return;
        Swal.fire({
            title: t('pos_pr_cancel_title'),
            input: 'text',
            inputPlaceholder: t('pos_pr_cancel_reason_ph'),
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
        }).then((result) => {
            if (!result.isConfirmed) return;
            const reason = (result.value || '').trim();
            axios
                .patch(
                    `${ServerSetting.apiUrl}/shop-owner-pos/requests/${id}/cancel`,
                    { reason },
                    { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
                )
                .then((res) => {
                    if (res.data.status === 200) {
                        Swal.fire({ title: t('pos_pr_done'), text: res.data.message || '', icon: 'success' });
                        setList((prev) => prev.filter((r) => r._id !== id));
                    } else {
                        Swal.fire({ title: t('pos_error'), text: res.data.message || t('pos_pr_failed'), icon: 'error' });
                    }
                })
                .catch(() => Swal.fire({ title: t('pos_error'), text: t('pos_pr_request_failed'), icon: 'error' }));
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('pos_pr_page_title')}
                description={t('pos_pr_page_desc')}
                backTo="/pos/dashboard"
                backLabel={t('pos_back_dashboard')}
                icon={<span>📋</span>}
            />
            <div className="panel bg-white dark:bg-[#0e1726] p-5 rounded-2xl border border-white-dark/10 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{t('pos_pr_collect_heading')}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{t('pos_pr_search_hint')}</p>
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('pos_pr_customer_cnic')}</label>
                        <input
                            type="text"
                            value={customerCNIC}
                            onChange={(e) => setCustomerCNIC(e.target.value.replace(/\D/g, '').slice(0, 13))}
                            placeholder={t('pos_pr_cnic_ph')}
                            className="form-input w-full rounded-lg"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('pos_pr_shop_name_opt')}</label>
                        <input
                            type="text"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            placeholder={t('pos_pr_shop_name_ph')}
                            className="form-input w-full rounded-lg"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={searching}
                            className="btn btn-primary rounded-lg px-5 py-2.5 disabled:opacity-50"
                        >
                            {searching ? t('pos_pr_searching') : t('pos_pr_search')}
                        </button>
                    </div>
                </div>
                {searchHint && (
                    <div className="mb-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/25 text-sm text-amber-950 dark:text-amber-100">
                        {searchHint}
                    </div>
                )}
                {list.length === 0 && !searching && (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('pos_pr_empty_hint')}</p>
                )}
                {list.length > 0 && (
                    <div className="space-y-4">
                        {list.map((r) => (
                            <div
                                key={r._id}
                                className="rounded-xl border border-white-dark/10 dark:border-white/10 p-5 bg-gray-50/50 dark:bg-white/5"
                            >
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{t('pos_pr_receipt', { num: r.receiptNumber })}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('pos_pr_customer_line', { name: r.customerName, cnic: r.customerCNIC })}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('pos_pr_shop_line', { name: r.shopName })}</p>
                                        <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mt-1">{t('pos_pr_total', { amount: r.totalAmount?.toLocaleString() ?? '' })}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleFulfill(r._id)}
                                            disabled={fulfillId !== null}
                                            className="btn btn-primary rounded-lg px-4 py-2 disabled:opacity-50"
                                        >
                                            {fulfillId === r._id ? t('pos_pr_submitting') : t('pos_pr_deliver_btn')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCancel(r._id)}
                                            disabled={fulfillId !== null}
                                            className="btn btn-outline-danger rounded-lg px-4 py-2 disabled:opacity-50"
                                        >
                                            {t('pos_pr_cancel_btn')}
                                        </button>
                                    </div>
                                </div>
                                <div className="text-sm">
                                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t('pos_pr_products')}</p>
                                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                                        {r.items?.map((it, i) => (
                                            <li key={i}>{t('pos_pr_line_item', { name: it.productName, qty: it.quantity, amount: it.lineTotal?.toLocaleString() ?? '' })}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PosPendingRequests;
