import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { useShopId } from '../../Hooks/useShopId';
import { useShopIdFromUrl } from '../../Hooks/useShopIdFromUrl';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconCashBanknotes from '../../components/Icon/IconCashBanknotes';
import IconNotes from '../../components/Icon/IconNotes';
import IconUser from '../../components/Icon/IconUser';
import { DataTable } from 'mantine-datatable';

const PAGE_SIZE = 10;

const CropHistory: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { token, user } = useAuthToken();
    const { userId, cropId } = useParams<{ userId: string; cropId: string }>();
    const [searchParams] = useSearchParams();
    const shopIdFromUrl = searchParams.get('shopId');
    const { shopId: userShopId } = useShopId();

    const [shopId, setShopId] = useState<string | null>(shopIdFromUrl || userShopId || null);
    const [fetchingShopId, setFetchingShopId] = useState(false);
    const [cropDetails, setCropDetails] = useState<any>(null);
    const [cropName, setCropName] = useState('');
    const [isSabziMandi, setIsSabziMandi] = useState(false);

    const [year, setYear] = useState<string>(new Date().getFullYear().toString());
    const [cnic, setCnic] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [customer, setCustomer] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loans, setLoans] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'orders' | 'loans'>('orders');
    const [orderPage, setOrderPage] = useState(1);
    const [loanPage, setLoanPage] = useState(1);

    useEffect(() => {
        dispatch(setPageTitle(t('crophistory_page_title')));
    }, [dispatch, t]);

    const years = React.useMemo(() => {
        const current = new Date().getFullYear();
        return Array.from({ length: 10 }, (_, i) => (current - i).toString());
    }, []);

    useEffect(() => {
        if (shopIdFromUrl) {
            setShopId(shopIdFromUrl);
            return;
        }
        if (userShopId) {
            setShopId(userShopId);
            return;
        }
        if (!userId || !token) return;
        setFetchingShopId(true);
        axios
            .get(`${ServerSetting.serUrl}/api/getShopId/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (res.data?.status === 200 && res.data?.data) {
                    const sid = res.data.data._id || res.data.data;
                    if (sid) setShopId(sid);
                }
            })
            .catch(() => {})
            .finally(() => setFetchingShopId(false));
    }, [userId, token, shopIdFromUrl, userShopId]);

    useEffect(() => {
        if (!cropId || !token) return;
        axios
            .get(`${ServerSetting.serUrl}/api/viewcrop/${cropId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (res.data?.status === 200 && res.data?.data) {
                    setCropDetails(res.data.data);
                    setCropName(res.data.data.cropName || '');
                    const ct = String(res.data.data.cropType || '').toLowerCase();
                    setIsSabziMandi(
                        ct === 'sabzi mandi' || ct === 'sabzimandi' || ct === '1' || ct.includes('sabzi')
                    );
                }
            })
            .catch(() => {});
    }, [cropId, token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cnic?.trim()) {
            Notification({ text: t('crophistory_notif_enter_cnic'), color: 'danger' });
            return;
        }
        if (!shopId || !cropId || !token) {
            Notification({ text: t('crophistory_notif_shop_crop_not_loaded'), color: 'danger' });
            return;
        }
        setLoading(true);
        setCustomer(null);
        setOrders([]);
        setLoans([]);
        setSubmitted(true);

        try {
            const cnicTrim = cnic.trim();

            const customersRes = await axios.post(
                `${ServerSetting.serUrl}/api/allviewcusshop`,
                { shopId: String(shopId) },
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            );
            const customers = customersRes.data?.data || [];
            const foundCustomer = customers.find(
                (c: any) => c.cusCNIC?.toString().trim() === cnicTrim
            );
            if (!foundCustomer) {
                Notification({ text: t('crophistory_notif_no_customer_found'), color: 'danger' });
                setLoading(false);
                return;
            }
            setCustomer(foundCustomer);
            const cusId = foundCustomer._id?.toString?.() || foundCustomer._id;

            const yearNum = parseInt(year, 10);

            if (isSabziMandi) {
                const ordersRes = await axios.post(
                    `${ServerSetting.serUrl}/api/getallvegetableorders`,
                    { shopId: String(shopId), cropId, customerId: cusId },
                    { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
                );
                const allOrders = ordersRes.data?.data || [];
                const filtered = allOrders.filter((o: any) => {
                    const created = o.createdAt ? new Date(o.createdAt).getFullYear() : null;
                    return created === yearNum;
                });
                setOrders(filtered);
            } else {
                const ordersRes = await axios.get(
                    `${ServerSetting.serUrl}/api/allviewdanamadinordercustomer/${shopId}/${cropId}/${cusId}`,
                    { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
                );
                const allOrders = ordersRes.data?.data || [];
                const filtered = allOrders.filter((o: any) => {
                    const created = o.createdAt ? new Date(o.createdAt).getFullYear() : null;
                    return created === yearNum;
                });
                setOrders(filtered);
            }

            const loansRes = await axios.post(
                `${ServerSetting.serUrl}/api/getFinanceByCropShopAndCNIC`,
                { cropId, shopId: String(shopId), cnic: cnicTrim },
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            );
            if (loansRes.data?.status === 200 && Array.isArray(loansRes.data.data)) {
                setLoans(loansRes.data.data);
            } else {
                setLoans([]);
            }
        } catch (err: any) {
            console.error('CropHistory fetch error:', err);
            Notification({
                text: err.response?.data?.message || t('crophistory_notif_error_loading'),
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d: string) => {
        if (!d) return '–';
        return new Date(d).toLocaleDateString('en-PK', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatCurrency = (val: any) => {
        const n = typeof val === 'number' ? val : parseFloat(val);
        return isNaN(n) ? '–' : `Rs. ${n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const orderColumns = isSabziMandi
        ? [
            { accessor: 'createdAt', title: t('crophistory_col_date'), render: (r: any) => formatDate(r.createdAt) },
            { accessor: 'totalPrice', title: t('crophistory_col_total'), render: (r: any) => formatCurrency(r.totalPrice) },
            { accessor: 'retrunPayment', title: t('crophistory_col_return'), render: (r: any) => formatCurrency(r.retrunPayment ?? r.returnPaymentAmount) },
            { accessor: 'afterRetrunPayemnt', title: t('crophistory_col_after_return'), render: (r: any) => formatCurrency(r.afterRetrunPayemnt ?? r.afterReturnAmount) },
        ]
        : [
            { accessor: 'createdAt', title: t('crophistory_col_date'), render: (r: any) => formatDate(r.createdAt) },
            { accessor: 'receiptId', title: t('crophistory_col_receipt_id'), render: (r: any) => r.receiptId || '–' },
            { accessor: 'totalPrice', title: t('crophistory_col_total'), render: (r: any) => formatCurrency(r.totalPrice) },
            { accessor: 'retrunPayment', title: t('crophistory_col_return'), render: (r: any) => formatCurrency(r.retrunPayment) },
            { accessor: 'afterRetrunPayemnt', title: t('crophistory_col_after_return'), render: (r: any) => formatCurrency(r.afterRetrunPayemnt) },
        ];

    const loanColumns = [
        { accessor: 'createdAt', title: t('crophistory_col_date'), render: (r: any) => formatDate(r.createdAt) },
        { accessor: 'finaceType', title: t('crophistory_col_type'), render: (r: any) => (r.finaceType === 0 ? t('finance_type_loan_given') : r.finaceType === 1 ? t('finance_type_loan_returned') : t('finance_type_payment')) },
        { accessor: 'loanAmount', title: t('crophistory_col_amount'), render: (r: any) => formatCurrency(r.loanAmount) },
        { accessor: 'loanPaidAmount', title: t('crophistory_col_paid'), render: (r: any) => formatCurrency(r.loanPaidAmount) },
        { accessor: 'finaceRemarks', title: t('crophistory_col_remarks'), render: (r: any) => r.finaceRemarks || '–' },
    ];

    const orderSlice = orders.slice((orderPage - 1) * PAGE_SIZE, orderPage * PAGE_SIZE);
    const loanSlice = loans.slice((loanPage - 1) * PAGE_SIZE, loanPage * PAGE_SIZE);

    return (
        <div className="bg-[#060d16] min-h-full -m-4 p-4 md:-m-6 md:p-6 space-y-6">
            <ul className="flex flex-wrap items-center gap-2 text-xs">
                <li>
                    <Link to="/dashboard" className="text-emerald-500 hover:text-emerald-400 transition font-medium">
                        {t('crophistory_breadcrumb_dashboard')}
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 before:text-slate-600">
                    <Link to="/getassginshopcrops" className="text-emerald-500 hover:text-emerald-400 transition font-medium">
                        {t('crophistory_breadcrumb_my_crops')}
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 before:text-slate-600">
                    <Link
                        to={`/cropmenu/${userId}/${cropId}${shopIdFromUrl ? `?shopId=${shopIdFromUrl}` : ''}`}
                        className="text-emerald-500 hover:text-emerald-400 transition font-medium"
                    >
                        {t('crophistory_breadcrumb_crop_menu')}
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 before:text-slate-600">
                    <span className="text-slate-400 font-medium">{t('crophistory_breadcrumb_history')}</span>
                </li>
            </ul>

            {/* Back button - top right, outside card */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-400 bg-[#091e2c] border border-emerald-500/40 rounded-full hover:bg-emerald-500/10 hover:border-emerald-400 transition duration-150 shadow-sm"
                >
                    <IconArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 stroke-[2.5]" />
                    {t('crophistory_back_to_crop_menu')}
                </button>
            </div>

            {/* BEGIN: CropHistoryCard */}
            <section
                className="relative overflow-hidden rounded-2xl p-7 border border-[#1b344d]/80 shadow-[0_4px_20px_-2px_rgba(4,9,16,0.7)]"
                style={{
                    background: 'linear-gradient(135deg, rgba(14, 32, 48, 0.75) 0%, rgba(9, 21, 33, 0.85) 100%)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-start space-x-3.5 mb-6 border-b border-[#142a40]/70 pb-5 relative">
                    <div className="p-2.5 rounded-xl bg-[#092233] border border-emerald-500/30 text-emerald-400 mt-0.5 shadow-inner">
                        <IconUser className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            {t('crophistory_title')}
                            {cropName ? ` – ${cropName}` : ''}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 font-normal">{t('crophistory_subtitle')}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 relative">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">{t('crophistory_year_label')}</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                required
                                className="w-full bg-[#081522] border border-[#1b3650] rounded-xl text-slate-100 text-xs px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition appearance-none cursor-pointer"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-6">
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">{t('crophistory_cnic_label')}</label>
                            <input
                                type="text"
                                value={cnic}
                                onChange={(e) => setCnic(e.target.value)}
                                placeholder={t('crophistory_cnic_placeholder')}
                                required
                                className="w-full bg-[#081522] border border-[#1b3650] rounded-xl text-slate-100 placeholder-slate-500 text-xs px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition tracking-wider"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <button
                                type="submit"
                                disabled={loading || !shopId || !cropId || fetchingShopId}
                                className="w-full inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition duration-150 shadow-lg shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('crophistory_loading_btn') : t('crophistory_view_history_btn')}
                            </button>
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1">{t('crophistory_form_footer_note')}</p>
                </form>
            </section>
            {/* END: CropHistoryCard */}

            {submitted && !loading && (customer || orders.length > 0 || loans.length > 0) && (
                <>
                    {customer && (
                        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
                            <h4 className="font-semibold text-emerald-400 mb-2 text-sm">{t('crophistory_customer_section_title')}</h4>
                            <p className="text-slate-300 text-sm">
                                {customer.cusNameF} {customer.cusNameL} · {t('finance_field_cnic')}: {customer.cusCNIC} · {t('crophistory_customer_phone_label')} {customer.cusNumber || '–'}
                            </p>
                        </div>
                    )}

                    <section
                        className="rounded-2xl border border-[#18324a]/70 p-6 shadow-[0_4px_20px_-2px_rgba(4,9,16,0.7)]"
                        style={{
                            background: 'linear-gradient(135deg, rgba(14, 32, 48, 0.75) 0%, rgba(9, 21, 33, 0.85) 100%)',
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        <div className="border-b border-[#142a40] flex space-x-6 mb-4">
                            <button
                                type="button"
                                onClick={() => setActiveTab('orders')}
                                className={`pb-3 border-b-2 text-xs font-semibold flex items-center gap-2 transition ${
                                    activeTab === 'orders' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <IconNotes className="w-4 h-4" />
                                <span>{t('crophistory_tab_order_list')}</span>
                                <span
                                    className={`px-2 py-0.5 text-[10px] rounded-full border ${
                                        activeTab === 'orders' ? 'bg-[#0c2233] text-emerald-400 border-emerald-500/20' : 'bg-[#0c2233] text-slate-400 border-slate-700'
                                    }`}
                                >
                                    {orders.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('loans')}
                                className={`pb-3 border-b-2 text-xs font-semibold flex items-center gap-2 transition ${
                                    activeTab === 'loans' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <IconCashBanknotes className="w-4 h-4" />
                                <span>{t('crophistory_tab_loan_list')}</span>
                                <span
                                    className={`px-2 py-0.5 text-[10px] rounded-full border ${
                                        activeTab === 'loans' ? 'bg-[#0c2233] text-emerald-400 border-emerald-500/20' : 'bg-[#0c2233] text-slate-400 border-slate-700'
                                    }`}
                                >
                                    {loans.length}
                                </span>
                            </button>
                        </div>

                        {activeTab === 'orders' && (
                            <div>
                                <p className="text-xs text-slate-400 mb-3">
                                    {t('crophistory_orders_for_year')} <strong className="text-slate-200">{year}</strong> {t('crophistory_orders_ke_orders')} –{' '}
                                    {isSabziMandi ? t('crophistory_sabzi_mandi') : t('crophistory_dana_mandi')}
                                </p>
                                {orders.length === 0 ? (
                                    <div className="py-14 text-center flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 rounded-2xl bg-[#091b29] border border-[#16334d] flex items-center justify-center text-emerald-400/70 mb-4 shadow-inner">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-slate-400 text-sm">{t('crophistory_no_orders_this_year')}</p>
                                    </div>
                                ) : (
                                    <div className="obsidian-datatable">
                                        <DataTable
                                            records={orderSlice}
                                            columns={orderColumns}
                                            totalRecords={orders.length}
                                            recordsPerPage={PAGE_SIZE}
                                            page={orderPage}
                                            onPageChange={setOrderPage}
                                            minHeight={200}
                                            noRecordsText={t('crophistory_no_records_orders')}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'loans' && (
                            <div>
                                <p className="text-xs text-slate-400 mb-3">{t('crophistory_loans_section_subtitle')}</p>
                                {loans.length === 0 ? (
                                    <div className="py-14 text-center flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 rounded-2xl bg-[#091b29] border border-[#16334d] flex items-center justify-center text-emerald-400/70 mb-4 shadow-inner">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-slate-400 text-sm">{t('crophistory_no_loans_customer')}</p>
                                    </div>
                                ) : (
                                    <div className="obsidian-datatable">
                                        <DataTable
                                            records={loanSlice}
                                            columns={loanColumns}
                                            totalRecords={loans.length}
                                            recordsPerPage={PAGE_SIZE}
                                            page={loanPage}
                                            onPageChange={setLoanPage}
                                            minHeight={200}
                                            noRecordsText={t('crophistory_no_records_loans')}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </>
            )}

            {submitted && !loading && !customer && orders.length === 0 && loans.length === 0 && (
                <section
                    className="rounded-2xl border border-[#18324a]/70 p-6 shadow-[0_4px_20px_-2px_rgba(4,9,16,0.7)]"
                    style={{
                        background: 'linear-gradient(135deg, rgba(14, 32, 48, 0.75) 0%, rgba(9, 21, 33, 0.85) 100%)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <div className="py-14 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#091b29] border border-[#16334d] flex items-center justify-center text-emerald-400/70 mb-4 shadow-inner">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </div>
                        <h3 className="text-sm font-medium text-slate-200">{t('crophistory_no_records_found')}</h3>
                        <p className="text-xs text-slate-400 max-w-sm mt-1">
                            {t('crophistory_no_records_found')} <strong className="text-emerald-400">{year}</strong> {t('crophistory_no_records_found_suffix')}
                        </p>
                    </div>
                </section>
            )}
        </div>
    );
};

export default CropHistory;