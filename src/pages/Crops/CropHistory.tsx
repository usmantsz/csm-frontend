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
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li>
                    <Link to="/dashboard" className="text-primary hover:underline">{t('crophistory_breadcrumb_dashboard')}</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link to="/getassginshopcrops" className="text-primary hover:underline">{t('crophistory_breadcrumb_my_crops')}</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link to={`/cropmenu/${userId}/${cropId}${shopIdFromUrl ? `?shopId=${shopIdFromUrl}` : ''}`} className="text-primary hover:underline">{t('crophistory_breadcrumb_crop_menu')}</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>{t('crophistory_breadcrumb_history')}</span>
                </li>
            </ul>

            {/* Back button - top right, outside card */}
            <div className="flex justify-end mb-4">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                >
                    <IconArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    {t('crophistory_back_to_crop_menu')}
                </button>
            </div>

            <div className="panel mb-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <IconUser className="w-5 h-5 text-primary" />
                        {t('crophistory_title')}{cropName ? ` – ${cropName}` : ''}
                    </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {t('crophistory_subtitle')}
                </p>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="form-label">{t('crophistory_year_label')}</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="form-select"
                            required
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">{t('crophistory_cnic_label')}</label>
                        <input
                            type="text"
                            value={cnic}
                            onChange={(e) => setCnic(e.target.value)}
                            placeholder={t('crophistory_cnic_placeholder')}
                            className="form-input"
                            required
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="btn !bg-[#16a34a] !text-white !border-[#16a34a] hover:!bg-[#15803d] shadow-none rounded-xl w-full md:w-auto"
                            disabled={loading || !shopId || !cropId || fetchingShopId}
                        >
                            {loading ? t('crophistory_loading_btn') : t('crophistory_view_history_btn')}
                        </button>
                    </div>
                </form>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {t('crophistory_form_footer_note')}
                </p>
            </div>

            {submitted && !loading && (customer || orders.length > 0 || loans.length > 0) && (
                <>
                    {customer && (
                        <div className="panel mb-6 border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10">
                            <h4 className="font-semibold text-primary-700 dark:text-primary-400 mb-2">{t('crophistory_customer_section_title')}</h4>
                            <p className="text-gray-700 dark:text-gray-300">
                                {customer.cusNameF} {customer.cusNameL} · {t('finance_field_cnic')}: {customer.cusCNIC} · {t('crophistory_customer_phone_label')} {customer.cusNumber || '–'}
                            </p>
                        </div>
                    )}

                    <div className="panel">
                        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                            <button
                                type="button"
                                className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'orders' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                onClick={() => setActiveTab('orders')}
                            >
                                <IconNotes className="w-4 h-4 inline-block mr-2" />
                                {t('crophistory_tab_order_list')} ({orders.length})
                            </button>
                            <button
                                type="button"
                                className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'loans' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                onClick={() => setActiveTab('loans')}
                            >
                                <IconCashBanknotes className="w-4 h-4 inline-block mr-2" />
                                {t('crophistory_tab_loan_list')} ({loans.length})
                            </button>
                        </div>

                        {activeTab === 'orders' && (
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {t('crophistory_orders_for_year')} <strong>{year}</strong> {t('crophistory_orders_ke_orders')} – {isSabziMandi ? t('crophistory_sabzi_mandi') : t('crophistory_dana_mandi')}
                                </p>
                                {orders.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500 dark:text-gray-400">{t('crophistory_no_orders_this_year')}</p>
                                ) : (
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
                                )}
                            </div>
                        )}

                        {activeTab === 'loans' && (
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {t('crophistory_loans_section_subtitle')}
                                </p>
                                {loans.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500 dark:text-gray-400">{t('crophistory_no_loans_customer')}</p>
                                ) : (
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
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {submitted && !loading && customer && orders.length === 0 && loans.length === 0 && (
                <div className="panel text-center py-8 text-gray-500 dark:text-gray-400">
                    {t('crophistory_no_records_found')} <strong>{year}</strong> {t('crophistory_no_records_found_suffix')}
                </div>
            )}
        </div>
    );
};

export default CropHistory;