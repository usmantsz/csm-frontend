import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useAuthToken } from '../../Hooks/useAuthToken';
import { useShopId } from '../../Hooks/useShopId';
import { useShopIdFromUrl } from '../../Hooks/useShopIdFromUrl';
import axios from 'axios';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import PageHeader from '../../components/Agricultural/PageHeader';
import IconCashBanknotes from '../../components/Icon/IconCashBanknotes';
import IconNotes from '../../components/Icon/IconNotes';
import IconUser from '../../components/Icon/IconUser';
import { DataTable } from 'mantine-datatable';

const PAGE_SIZE = 10;

const CropHistory: React.FC = () => {
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
        dispatch(setPageTitle('Crop History - Year & Customer'));
    }, [dispatch]);

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
            Notification({ text: 'Please enter customer CNIC.', color: 'danger' });
            return;
        }
        if (!shopId || !cropId || !token) {
            Notification({ text: 'Shop or crop not loaded. Please try again.', color: 'danger' });
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
                Notification({ text: 'No customer found with this CNIC in this shop.', color: 'danger' });
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
                text: err.response?.data?.message || 'Error loading history.',
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
            { accessor: 'createdAt', title: 'Date', render: (r: any) => formatDate(r.createdAt) },
            { accessor: 'totalPrice', title: 'Total', render: (r: any) => formatCurrency(r.totalPrice) },
            { accessor: 'retrunPayment', title: 'Return', render: (r: any) => formatCurrency(r.retrunPayment ?? r.returnPaymentAmount) },
            { accessor: 'afterRetrunPayemnt', title: 'After Return', render: (r: any) => formatCurrency(r.afterRetrunPayemnt ?? r.afterReturnAmount) },
        ]
        : [
            { accessor: 'createdAt', title: 'Date', render: (r: any) => formatDate(r.createdAt) },
            { accessor: 'receiptId', title: 'Receipt ID', render: (r: any) => r.receiptId || '–' },
            { accessor: 'totalPrice', title: 'Total', render: (r: any) => formatCurrency(r.totalPrice) },
            { accessor: 'retrunPayment', title: 'Return', render: (r: any) => formatCurrency(r.retrunPayment) },
            { accessor: 'afterRetrunPayemnt', title: 'After Return', render: (r: any) => formatCurrency(r.afterRetrunPayemnt) },
        ];

    const loanColumns = [
        { accessor: 'createdAt', title: 'Date', render: (r: any) => formatDate(r.createdAt) },
        { accessor: 'finaceType', title: 'Type', render: (r: any) => (r.finaceType === 0 ? 'Loan Given' : r.finaceType === 1 ? 'Loan Returned' : 'Payment') },
        { accessor: 'loanAmount', title: 'Amount', render: (r: any) => formatCurrency(r.loanAmount) },
        { accessor: 'loanPaidAmount', title: 'Paid', render: (r: any) => formatCurrency(r.loanPaidAmount) },
        { accessor: 'finaceRemarks', title: 'Remarks', render: (r: any) => r.finaceRemarks || '–' },
    ];

    const orderSlice = orders.slice((orderPage - 1) * PAGE_SIZE, orderPage * PAGE_SIZE);
    const loanSlice = loans.slice((loanPage - 1) * PAGE_SIZE, loanPage * PAGE_SIZE);

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li>
                    <Link to="/dashboard" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link to="/getassginshopcrops" className="text-primary hover:underline">My Crops</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link to={`/cropmenu/${userId}/${cropId}${shopIdFromUrl ? `?shopId=${shopIdFromUrl}` : ''}`} className="text-primary hover:underline">Crop Menu</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>History</span>
                </li>
            </ul>

            <PageHeader
                title="Crop History"
                description={`Year aur Customer CNIC se orders & loans dekhen – ${cropName || 'Crop'}`}
                onBack={() => window.history.back()}
                backLabel="Back to Crop Menu"
                icon="📜"
            />

            <div className="panel mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <IconUser className="w-5 h-5 text-primary" />
                    Year & Customer CNIC
                </h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="form-label">Year</label>
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
                        <label className="form-label">Customer CNIC</label>
                        <input
                            type="text"
                            value={cnic}
                            onChange={(e) => setCnic(e.target.value)}
                            placeholder="e.g. 35202-1234567-1"
                            className="form-input"
                            required
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="btn btn-primary w-full md:w-auto"
                            disabled={loading || !shopId || !cropId || fetchingShopId}
                        >
                            {loading ? 'Loading…' : 'View History'}
                        </button>
                    </div>
                </form>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Year select karen aur customer ka CNIC daalen – us customer ke is crop se related orders aur loans alag tabs mein dikhenge.
                </p>
            </div>

            {submitted && !loading && (customer || orders.length > 0 || loans.length > 0) && (
                <>
                    {customer && (
                        <div className="panel mb-6 border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10">
                            <h4 className="font-semibold text-primary-700 dark:text-primary-400 mb-2">Customer</h4>
                            <p className="text-gray-700 dark:text-gray-300">
                                {customer.cusNameF} {customer.cusNameL} · CNIC: {customer.cusCNIC} · Phone: {customer.cusNumber || '–'}
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
                                Order List ({orders.length})
                            </button>
                            <button
                                type="button"
                                className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'loans' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                onClick={() => setActiveTab('loans')}
                            >
                                <IconCashBanknotes className="w-4 h-4 inline-block mr-2" />
                                Loan List ({loans.length})
                            </button>
                        </div>

                        {activeTab === 'orders' && (
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    Year <strong>{year}</strong> ke orders – {isSabziMandi ? 'Sabzi Mandi' : 'Dana Mandi'}
                                </p>
                                {orders.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500 dark:text-gray-400">Is year ke liye koi order nahi mila.</p>
                                ) : (
                                    <DataTable
                                        records={orderSlice}
                                        columns={orderColumns}
                                        totalRecords={orders.length}
                                        recordsPerPage={PAGE_SIZE}
                                        page={orderPage}
                                        onPageChange={setOrderPage}
                                        minHeight={200}
                                        noRecordsText="No orders"
                                    />
                                )}
                            </div>
                        )}

                        {activeTab === 'loans' && (
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    Is crop se related loans / finance
                                </p>
                                {loans.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500 dark:text-gray-400">Is customer ke liye koi loan record nahi mila.</p>
                                ) : (
                                    <DataTable
                                        records={loanSlice}
                                        columns={loanColumns}
                                        totalRecords={loans.length}
                                        recordsPerPage={PAGE_SIZE}
                                        page={loanPage}
                                        onPageChange={setLoanPage}
                                        minHeight={200}
                                        noRecordsText="No loans"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {submitted && !loading && customer && orders.length === 0 && loans.length === 0 && (
                <div className="panel text-center py-8 text-gray-500 dark:text-gray-400">
                    Is customer ke liye is crop par year <strong>{year}</strong> mein koi order ya loan record nahi mila.
                </div>
            )}
        </div>
    );
};

export default CropHistory;
