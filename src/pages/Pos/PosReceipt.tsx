import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import PageHeader from '../../components/Agricultural/PageHeader';
import axios from 'axios';

type ReturnItem = { productName: string; quantity: number; unitPrice: number; refundAmount: number };
type SaleReturn = {
    _id: string;
    returnDate: string;
    totalReturnAmount: number;
    refundPaymentType?: string;
    refundPaymentDetails?: string;
    reason?: string;
    items: ReturnItem[];
};
type SaleDetail = {
    _id: string;
    invoiceNumber: string;
    saleDate: string;
    totalAmount: number;
    discountAmount: number;
    paymentType: string;
    customerName?: string;
    items: { productName: string; quantity: number; unitPrice: number; lineTotal: number }[];
    returns?: SaleReturn[];
};

const PosReceipt = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [sale, setSale] = useState<SaleDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const printTriggered = useRef(false);

    useEffect(() => {
        dispatch(setPageTitle(t('pos_receipt_title')));
    }, [dispatch, t, i18n.language]);

    useEffect(() => {
        if (!id) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        axios
            .get(`${ServerSetting.apiUrl}/pos/sales/${id}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((r) => {
                if (r.data?.data) setSale(r.data.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (sale && searchParams.get('print') === '1' && !printTriggered.current) {
            printTriggered.current = true;
            const printTimer = setTimeout(() => {
                window.print();
            }, 300);
            return () => clearTimeout(printTimer);
        }
    }, [sale, searchParams]);

    const printReceipt = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <span className="animate-spin inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="panel p-6 text-center">
                <p className="text-gray-500">{t('pos_sale_not_found')}</p>
                <button type="button" className="btn btn-outline-primary mt-4" onClick={() => navigate('/pos/sales-history')}>{t('pos_back_sales_history')}</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="no-print">
                <PageHeader
                    title={`Invoice ${sale.invoiceNumber}`}
                    description={`${new Date(sale.saleDate).toLocaleString()}${sale.customerName ? ` · ${sale.customerName}` : ''}`}
                    backTo="/pos/sales-history"
                    backLabel={t('pos_back_sales_history')}
                    rightContent={
                        <button type="button" className="btn btn-outline-white" onClick={printReceipt}>
                            {t('pos_print')}
                        </button>
                    }
                    icon={<span>🧾</span>}
                />
            </div>
            <div className="max-w-lg mx-auto">
            <div className="panel p-6 rounded-2xl border border-white-dark/10 shadow-sm print:shadow-none print:border-0">
                <div className="bg-gradient-to-r from-primary-600/10 to-primary-700/10 dark:from-primary-900/30 dark:to-primary-800/20 rounded-xl p-4 -mx-2 mb-6 print:block">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Payment: <span className="font-medium">{sale.paymentType === 'credit' ? 'Pay later (Credit)' : (sale.paymentType || '').charAt(0).toUpperCase() + (sale.paymentType || '').slice(1)}</span></p>
                    {sale.customerName && <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">Customer: {sale.customerName}</p>}
                </div>
                <ul className="py-4 space-y-3 text-sm">
                    {sale.items?.map((it: any, idx: number) => (
                        <li key={idx} className="flex justify-between border-b border-white-dark/5 pb-3">
                            <span className="text-gray-700 dark:text-gray-300">{it.productName} × {it.quantity} @ Rs {it.unitPrice?.toLocaleString()}</span>
                            <span className="font-semibold">Rs {it.lineTotal?.toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
                {(() => {
                    const totalRefunded = (sale.returns || []).reduce((sum: number, r: SaleReturn) => sum + (r.totalReturnAmount || 0), 0);
                    const saleTotal = sale.totalAmount || 0;
                    const amountRemaining = saleTotal - totalRefunded;
                    const netDisplay = Math.max(0, amountRemaining);
                    const overRefunded = totalRefunded > saleTotal;
                    return (
                        <div className="border-t-2 border-white-dark/10 pt-4 space-y-2">
                            <div className="flex justify-between font-bold text-xl">
                                <span className="text-gray-800 dark:text-white">Sale Total</span>
                                <span className="text-gray-700 dark:text-gray-300">Rs {saleTotal.toLocaleString()}</span>
                            </div>
                            {totalRefunded > 0 && (
                                <>
                                    <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                                        <span>Total Refunded</span>
                                        <span>Rs {totalRefunded.toLocaleString()}</span>
                                    </div>
                                    {overRefunded && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Refund total exceeds sale total (e.g. discount was applied on sale but refund was recorded at full price). Net shown as Rs 0.</p>
                                    )}
                                    <div className="flex justify-between font-bold text-xl pt-1 border-t border-white-dark/10">
                                        <span className="text-gray-800 dark:text-white">Amount Remaining (Net)</span>
                                        <span className="text-primary-600 dark:text-primary-400">Rs {netDisplay.toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })()}

                {sale.returns && sale.returns.length > 0 && (
                    <div className="mt-6 pt-6 border-t-2 border-amber-200 dark:border-amber-800">
                        <h3 className="text-base font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                            <span>Returns & Refunds</span>
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({sale.returns.length} return{sale.returns.length !== 1 ? 's' : ''})</span>
                        </h3>
                        <div className="space-y-4">
                            {sale.returns.map((ret: SaleReturn) => (
                                <div key={ret._id} className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(ret.returnDate).toLocaleString()}
                                            <span className="ml-2 capitalize font-medium text-amber-700 dark:text-amber-300">Refund: {ret.refundPaymentType || 'cash'}</span>
                                            {ret.refundPaymentDetails ? <span className="block text-xs mt-0.5">{ret.refundPaymentDetails}</span> : null}
                                        </div>
                                        <span className="font-bold text-amber-600 dark:text-amber-400">Rs {ret.totalReturnAmount?.toLocaleString()}</span>
                                    </div>
                                    <ul className="text-sm space-y-1 mt-2 pl-0">
                                        {ret.items?.map((it: ReturnItem, idx: number) => (
                                            <li key={idx} className="flex justify-between text-gray-700 dark:text-gray-300">
                                                <span>{it.productName} × {it.quantity}</span>
                                                <span>Rs {it.refundAmount?.toLocaleString()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {ret.reason ? <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Reason: {ret.reason}</p> : null}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

export default PosReceipt;
