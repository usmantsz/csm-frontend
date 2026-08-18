import { useEffect, useState } from "react";
import sortBy from "lodash/sortBy";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ServerSetting } from "./../../helperComponents/ServerSetting";
import { Notification } from "./../../helperComponents/Notification";
import { FaEye, FaPrint, FaFilePdf } from "react-icons/fa";
import IconCashBanknotes from "../../components/Icon/IconCashBanknotes";
import IconUser from "../../components/Icon/IconUser";
import IconCreditCard from "../../components/Icon/IconCreditCard";
import IconPhone from "../../components/Icon/IconPhone";
import IconMapPin from "../../components/Icon/IconMapPin";
import IconNotes from "../../components/Icon/IconNotes";
import IconFile from "../../components/Icon/IconFile";
import { useTranslation } from "react-i18next";
import { useShopId } from "./../../Hooks/useShopId";
import { useShopIdFromUrl } from "./../../Hooks/useShopIdFromUrl";
import { useAuthToken } from "./../../Hooks/useAuthToken";
import { Modal } from "@mantine/core";

interface DanaMandiOrder {
    piscesTypeId: boolean;
    pricePisce: string;
    retrunPayment(retrunPayment: any): unknown;
    malaKhataPayment: any;
    _id: string;
    danaMandiOrderShopId: { _id: string; shopName: string; shopRegistrationNumber: string };
    danaMandiOrderCusId: { _id: string; cusNameF: string; cusNameL: string; cusNumber: string; cusCNIC: string };
    danaMandiOrderBapariId: string;
    danaMandiOrderCropId: { _id: string; cropName: string };
    afterRetrunPayemnt: number;
    priceCrop: number;
    weightMann: number;
    weightKg: number;
    totalPrice: number;
    commissioneTotal: number;
    mazdoriTotal: number;
    RentDelivery: number;
    receiptId?: string;
    createdAt: string;
}

const DanaMandiCropOrderList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token, user } = useAuthToken();
    const { shopId: urlShopId, isViewingAsAdmin, isAdmin } = useShopIdFromUrl(); // This hook already handles URL shopId vs user shopId
    const { userId, cropId } = useParams<{ userId: string; cropId: string }>();
    const [shopId, setShopId] = useState<string | null>(urlShopId);
    const [fetchingShopId, setFetchingShopId] = useState(false);
    const [cropDetails, setCropDetails] = useState<any>(null);
    const [isSabziMandi, setIsSabziMandi] = useState(false);

    // If shopId is missing and we have userId, try to fetch shopId from userId (for admin direct access)
    useEffect(() => {
        const fetchShopIdFromUserId = async () => {
            // If we already have shopId, don't fetch
            if (shopId) return;

            // Only fetch if we have userId and token, and either admin is viewing OR we don't have urlShopId
            if (!userId || !token) return;

            // For admin: always try to fetch from userId if shopId is missing (even if urlShopId is null)
            // For shop owner: only fetch if urlShopId is also missing
            // Check isAdmin instead of isViewingAsAdmin because isViewingAsAdmin requires urlShopId to be true
            if (!isAdmin && urlShopId) return;

            setFetchingShopId(true);
            try {
                console.log('DanaMandiCropOrderList: Fetching shopId from userId:', userId, 'isAdmin:', isAdmin, 'isViewingAsAdmin:', isViewingAsAdmin);
                const response = await axios.get(
                    `${ServerSetting.serUrl}/api/getShopId/${userId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log('DanaMandiCropOrderList: API Response:', response.data);
                if (response.data?.status === 200 && response.data?.data) {
                    // API returns shop object, get _id from it
                    const shopData = response.data.data;
                    const fetchedShopId = shopData._id || shopData;
                    console.log('DanaMandiCropOrderList: ✅ Fetched shopId from userId:', fetchedShopId, 'Full shop data:', shopData);
                    if (fetchedShopId) {
                        setShopId(fetchedShopId);
                    } else {
                        console.error('DanaMandiCropOrderList: ❌ shopId is null/undefined in response');
                    }
                } else {
                    console.warn('DanaMandiCropOrderList: ⚠️ No shopId found in response:', response.data);
                }
            } catch (error: any) {
                console.error('DanaMandiCropOrderList: Error fetching shopId from userId:', error);
                if (error.response) {
                    console.error('DanaMandiCropOrderList: Error response:', error.response.data);
                }
            } finally {
                setFetchingShopId(false);
            }
        };

        fetchShopIdFromUserId();
    }, [userId, token, isAdmin, isViewingAsAdmin, shopId, urlShopId]);

    // Update shopId when urlShopId changes
    useEffect(() => {
        if (urlShopId) {
            setShopId(urlShopId);
        }
    }, [urlShopId]);

    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<DanaMandiOrder[]>([]);
    const [recordsData, setRecordsData] = useState<DanaMandiOrder[]>([]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: "createdAt",
        direction: "asc",
    });
    const [viewModal, setViewModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<DanaMandiOrder | null>(null);
    const [search, setSearch] = useState("");
    const [filterDate, setFilterDate] = useState<string>(""); // ✅ Date filter state

    // Pagination update
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    // Sorting update
    useEffect(() => {
        const sortedData = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === "desc" ? sortedData.reverse() : sortedData);
        setPage(1);
    }, [sortStatus]);

    // Reset records when navigating to a different crop/shop so we don't show stale data
    useEffect(() => {
        if (cropId) {
            setInitialRecords([]);
            setRecordsData([]);
        }
    }, [cropId]);

    // Fetch crop details to determine crop type
    useEffect(() => {
        if (!cropId || !token) return;

        axios
            .get(`${ServerSetting.serUrl}/api/viewcrop/${cropId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((res) => {
                if (res.data.status === 200 && res.data.data) {
                    const crop = res.data.data;
                    setCropDetails(crop);
                    const cropType = String(crop.cropType || '').toLowerCase().trim();
                    const isSabzi = cropType === 'sabzi mandi' ||
                                   cropType === 'sabzimandi' ||
                                   cropType === '1' ||
                                   cropType.includes('sabzi');
                    setIsSabziMandi(isSabzi);
                    console.log('DanaMandiCropOrderList: Crop type detected:', cropType, 'isSabziMandi:', isSabzi);
                }
            })
            .catch((err) => {
                console.error('Error fetching crop details:', err);
            });
    }, [cropId, token]);

    // Fetch Orders (Dana Mandi or Vegetable based on crop type)
    // Deps include fetchingShopId so we re-run when shopId fetch completes (even if shopId was set from urlShopId)
    useEffect(() => {
        if (!cropId) return;

        // Show loading while waiting for dependencies
        if (cropDetails === null || fetchingShopId) {
            setIsLoading(true);
            return;
        }

        if (!shopId) {
            console.warn('DanaMandiCropOrderList: shopId is missing', {
                isViewingAsAdmin,
                urlParams: window.location.search,
                currentUrl: window.location.href,
                userId,
                urlShopId
            });
            if (isViewingAsAdmin) {
                Notification({
                    text: t('shop_id_missing_admin_hint'),
                    color: "warning"
                });
            } else {
                Notification({
                    text: t('shop_id_missing_user_hint'),
                    color: "warning"
                });
            }
            setIsLoading(false);
            return;
        }

        console.log('DanaMandiCropOrderList: Fetching orders with shopId:', shopId, 'cropId:', cropId, 'isSabziMandi:', isSabziMandi);
        setIsLoading(true);

        // Fetch orders based on crop type
        if (isSabziMandi) {
            // Fetch Vegetable Orders
            axios
                .post(`${ServerSetting.serUrl}/api/getallvegetableorders`, {
                    shopId: shopId,
                    cropId: cropId
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => {
                    if (res.data.status === 200) {
                        const orders = res.data.data || [];
                        setInitialRecords(orders);
                        if (orders.length === 0) {
                            Notification({ text: t('no_vegetable_orders_found'), color: "info" });
                        }
                    } else {
                        Notification({ text: res.data.message || t('failed_to_fetch_vegetable_orders'), color: "danger" });
                    }
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching vegetable orders:", err);
                    Notification({ text: err.response?.data?.message || t('error_fetching_vegetable_orders'), color: "danger" });
                    setIsLoading(false);
                });
        } else {
            // Fetch Dana Mandi Orders
            axios
                .get(`${ServerSetting.serUrl}/api/viewallorderdanamandispecificshop/${shopId}/${cropId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => {
                    console.log('DanaMandiCropOrderList: Dana Mandi orders API response:', res.data);
                    if (res.data.status === 200) {
                        const orders = res.data.data || [];
                        setInitialRecords(orders);
                        console.log('DanaMandiCropOrderList: Dana Mandi orders loaded:', orders.length);
                        if (orders.length === 0) {
                            Notification({ text: t('no_dana_mandi_orders_found'), color: "info" });
                        }
                    } else {
                        Notification({ text: res.data.message || t('failed_to_fetch_orders'), color: "danger" });
                    }
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching dana mandi orders:", err);
                    Notification({ text: err.response?.data?.message || t('error_fetching_dana_mandi_orders'), color: "danger" });
                    setIsLoading(false);
                });
        }
    }, [shopId, cropId, token, isViewingAsAdmin, isSabziMandi, cropDetails, fetchingShopId]);

    // Filter data on search + date
    useEffect(() => {
        let filtered = initialRecords;

        if (search) {
            const lower = search.toLowerCase();
            filtered = filtered.filter((item: any) => {
                if (isSabziMandi) {
                    // Vegetable Orders
                    const shopName = (typeof item.vegetableOrderShopId === 'object' && item.vegetableOrderShopId)
                        ? item.vegetableOrderShopId?.shopName?.toLowerCase() || ""
                        : "";
                    const cusName = (typeof item.vegetableOrderCusId === 'object' && item.vegetableOrderCusId)
                        ? `${item.vegetableOrderCusId?.cusNameF || ""} ${item.vegetableOrderCusId?.cusNameL || ""}`.toLowerCase()
                        : "";
                    const cusCNIC = (typeof item.vegetableOrderCusId === 'object' && item.vegetableOrderCusId)
                        ? item.vegetableOrderCusId?.cusCNIC || ""
                        : "";
                    const cusNumber = (typeof item.vegetableOrderCusId === 'object' && item.vegetableOrderCusId)
                        ? item.vegetableOrderCusId?.cusNumber || ""
                        : "";
                    const receiptId = item.receiptId || "";

                    return (
                        shopName.includes(lower) ||
                        cusName.includes(lower) ||
                        cusCNIC.includes(search) ||
                        cusNumber.includes(search) ||
                        receiptId.toLowerCase().includes(lower)
                    );
                } else {
                    // Dana Mandi Orders
                    const shopName = item.danaMandiOrderShopId?.shopName?.toLowerCase() || "";
                    const cusName = `${item.danaMandiOrderCusId?.cusNameF || ""} ${item.danaMandiOrderCusId?.cusNameL || ""}`.toLowerCase();
                    const cusCNIC = item.danaMandiOrderCusId?.cusCNIC || "";
                    const cusNumber = item.danaMandiOrderCusId?.cusNumber || "";
                    const receiptId = item.receiptId || "";

                    return (
                        shopName.includes(lower) ||
                        cusName.includes(lower) ||
                        cusCNIC.includes(search) ||
                        cusNumber.includes(search) ||
                        receiptId.toLowerCase().includes(lower)
                    );
                }
            });
        }

        if (filterDate) {
            filtered = filtered.filter((item) => {
                const itemDate = new Date(item.createdAt).toISOString().split("T")[0]; // yyyy-mm-dd
                return itemDate === filterDate;
            });
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...filtered.slice(from, to)]);
    }, [search, filterDate, initialRecords, page, pageSize, isSabziMandi]);

    // Format date
    const formatDate = (date: string) => {
        const dt = new Date(date);
        const month = dt.getMonth() + 1 < 10 ? "0" + (dt.getMonth() + 1) : dt.getMonth() + 1;
        const day = dt.getDate() < 10 ? "0" + dt.getDate() : dt.getDate();
        return `${day}/${month}/${dt.getFullYear()}`;
    };

    // Print Function
    const handlePrint = () => {
        const printContent = document.getElementById("receipt-content");
        if (printContent) {
            const printWindow = window.open("", "", "width=800,height=600");
            if (printWindow) {
                const receiptId = selectedOrder?.receiptId || selectedOrder?._id.slice(-12).toUpperCase();

                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>${t('dana_mandi_receipt')} - ${receiptId}</title>
                        <style>
                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                            }
                            @page {
                                size: A4;
                                margin: 0.5cm;
                            }
                            body {
                                font-family: 'Arial', sans-serif;
                                font-size: 11px;
                                line-height: 1.4;
                                color: #065f46;
                                background: #fff;
                                padding: 8px;
                                width: 100%;
                                overflow: hidden;
                            }
                            .no-print {
                                display: none !important;
                            }
                            /* Header - Green Theme */
                            .bg-gradient-to-r {
                                background: linear-gradient(to right, #10b981, #059669) !important;
                                padding: 12px !important;
                                margin-bottom: 8px !important;
                                border-radius: 4px !important;
                            }
                            .bg-gradient-to-r h2 {
                                font-size: 18px !important;
                                margin: 0 !important;
                                color: #fff !important;
                            }
                            .bg-gradient-to-r p {
                                font-size: 10px !important;
                                margin: 0 !important;
                                color: #d1fae5 !important;
                            }
                            .bg-white\\/10, .bg-white {
                                background: #fff !important;
                                padding: 8px !important;
                                margin-top: 8px !important;
                                border-radius: 4px !important;
                                border: 1px solid #10b981 !important;
                            }
                            .bg-white\\/10 span, .bg-white span {
                                font-size: 10px !important;
                                color: #065f46 !important;
                            }
                            .font-mono {
                                font-size: 14px !important;
                                padding: 4px 8px !important;
                                color: #065f46 !important;
                                background: #f0fdf4 !important;
                                border: 1px solid #10b981 !important;
                            }
                            /* Main Content */
                            .px-6 {
                                padding-left: 8px !important;
                                padding-right: 8px !important;
                            }
                            .pb-6 {
                                padding-bottom: 8px !important;
                            }
                            /* Grid Layouts */
                            .grid {
                                display: grid !important;
                                gap: 6px !important;
                            }
                            .grid-cols-1 {
                                grid-template-columns: 1fr !important;
                            }
                            .md\\:grid-cols-2 {
                                grid-template-columns: repeat(2, 1fr) !important;
                            }
                            .md\\:grid-cols-3 {
                                grid-template-columns: repeat(3, 1fr) !important;
                            }
                            .md\\:grid-cols-4 {
                                grid-template-columns: repeat(4, 1fr) !important;
                            }
                            /* Cards - Green/White Theme */
                            .panel {
                                padding: 8px !important;
                                margin-bottom: 6px !important;
                                border: 1px solid #10b981 !important;
                                border-radius: 4px !important;
                                background: #fff !important;
                            }
                            .panel h3 {
                                font-size: 12px !important;
                                margin-bottom: 6px !important;
                                font-weight: bold !important;
                                color: #059669 !important;
                            }
                            .panel p, .panel span {
                                font-size: 10px !important;
                                color: #065f46 !important;
                            }
                            /* Info Cards - Green Theme */
                            .bg-gradient-to-br {
                                padding: 6px !important;
                                margin-bottom: 6px !important;
                                border-radius: 4px !important;
                                border: 1px solid #10b981 !important;
                            }
                            .bg-gradient-to-br h3 {
                                color: #059669 !important;
                            }
                            .bg-gradient-to-br p, .bg-gradient-to-br span {
                                color: #065f46 !important;
                            }
                            .space-y-2 > * {
                                margin-bottom: 4px !important;
                            }
                            /* Order Details - Green Theme */
                            .p-4 {
                                padding: 6px !important;
                                border: 1px solid #d1fae5 !important;
                                background: #f0fdf4 !important;
                            }
                            .text-lg {
                                font-size: 12px !important;
                                color: #065f46 !important;
                            }
                            .text-xl {
                                font-size: 14px !important;
                                color: #059669 !important;
                            }
                            .text-2xl {
                                font-size: 16px !important;
                                color: #059669 !important;
                            }
                            .text-3xl {
                                font-size: 18px !important;
                                color: #059669 !important;
                            }
                            /* Payment Breakdown - Green Theme */
                            .mb-4 {
                                margin-bottom: 6px !important;
                            }
                            .mb-6 {
                                margin-bottom: 8px !important;
                            }
                            .space-y-2 > * {
                                margin-bottom: 3px !important;
                                border: 1px solid #d1fae5 !important;
                                background: #f0fdf4 !important;
                            }
                            .p-3 {
                                padding: 4px !important;
                            }
                            .p-6 {
                                padding: 8px !important;
                            }
                            /* Text Colors - Green Theme - Comprehensive Override */
                            .text-gray-700, .text-gray-800, .text-gray-600, .text-gray-400, .text-gray-300, .text-gray-500, .text-gray-900 {
                                color: #065f46 !important;
                            }
                            .text-red-600, .text-red-400 {
                                color: #dc2626 !important;
                            }
                            .text-primary-600, .text-primary-400, .text-primary-700, .text-primary-500 {
                                color: #059669 !important;
                            }
                            /* Override any black or blue colors */
                            p, span, div, h1, h2, h3, h4, h5, h6, label, td, th {
                                color: #065f46 !important;
                            }
                            /* Blue backgrounds to green */
                            .bg-blue-50, .bg-blue-100, .bg-blue-200, .bg-primary-50, .bg-primary-100 {
                                background: #f0fdf4 !important;
                                border-color: #d1fae5 !important;
                            }
                            /* Dark backgrounds to white */
                            .bg-gray-50, .bg-gray-100, .bg-gray-200, .bg-gray-700, .bg-gray-800 {
                                background: #fff !important;
                                border-color: #10b981 !important;
                            }
                            /* Ensure white background everywhere */
                            .bg-white, .bg-white\\/10 {
                                background: #fff !important;
                            }
                            /* Final Amount - Green Theme */
                            .bg-gradient-to-r.from-success-500 {
                                background: linear-gradient(to right, #10b981, #059669) !important;
                                padding: 8px !important;
                                border-radius: 4px !important;
                            }
                            .bg-gradient-to-r.from-success-500 p {
                                font-size: 12px !important;
                                color: #fff !important;
                            }
                            /* Remove icons in print */
                            svg {
                                display: none !important;
                            }
                            /* Compact spacing */
                            .gap-2 {
                                gap: 4px !important;
                            }
                            .gap-3 {
                                gap: 4px !important;
                            }
                            .gap-4 {
                                gap: 4px !important;
                            }
                            .gap-6 {
                                gap: 6px !important;
                            }
                            /* Hide action buttons */
                            .flex.flex-col.sm\\:flex-row {
                                display: none !important;
                            }
                            @media print {
                                body {
                                    padding: 0.5cm !important;
                                }
                                * {
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent.innerHTML}
                    </body>
                    </html>
                `);
                printWindow.document.close();
                setTimeout(() => {
                    printWindow.print();
                }, 250);
            }
        }
    };

    // Export PDF Function
    const handleExportPDF = () => {
        const printContent = document.getElementById("receipt-content");
        if (printContent && selectedOrder) {
            const receiptId = selectedOrder.receiptId || selectedOrder._id.slice(-12).toUpperCase();
            const fileName = `Dana_Mandi_Receipt_${receiptId}_${formatDate(selectedOrder.createdAt).replace(/\//g, '-')}.html`;

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${t('dana_mandi_receipt')} - ${receiptId}</title>
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        @page {
                            size: A4;
                            margin: 0.5cm;
                        }
                        body {
                            font-family: 'Arial', sans-serif;
                            font-size: 11px;
                            line-height: 1.4;
                            color: #065f46;
                            background: #fff;
                            padding: 8px;
                            width: 100%;
                            max-width: 100%;
                            overflow-x: hidden;
                        }
                        .no-print {
                            display: none !important;
                        }
                        /* Header - Green Theme */
                        .bg-gradient-to-r {
                            background: linear-gradient(to right, #10b981, #059669) !important;
                            padding: 12px !important;
                            margin-bottom: 8px !important;
                            border-radius: 4px !important;
                        }
                        .bg-gradient-to-r h2 {
                            font-size: 18px !important;
                            margin: 0 !important;
                            color: #fff !important;
                        }
                        .bg-gradient-to-r p {
                            font-size: 10px !important;
                            margin: 0 !important;
                            color: #d1fae5 !important;
                        }
                        .bg-white\\/10, .bg-white {
                            background: #fff !important;
                            padding: 8px !important;
                            margin-top: 8px !important;
                            border-radius: 4px !important;
                            border: 1px solid #10b981 !important;
                        }
                        .bg-white\\/10 span, .bg-white span {
                            font-size: 10px !important;
                            color: #065f46 !important;
                        }
                        .font-mono {
                            font-size: 14px !important;
                            padding: 4px 8px !important;
                            color: #065f46 !important;
                            background: #f0fdf4 !important;
                            border: 1px solid #10b981 !important;
                        }
                        /* Main Content */
                        .px-6 {
                            padding-left: 8px !important;
                            padding-right: 8px !important;
                        }
                        .pb-6 {
                            padding-bottom: 8px !important;
                        }
                        /* Grid Layouts */
                        .grid {
                            display: grid !important;
                            gap: 6px !important;
                        }
                        .grid-cols-1 {
                            grid-template-columns: 1fr !important;
                        }
                        .md\\:grid-cols-2 {
                            grid-template-columns: repeat(2, 1fr) !important;
                        }
                        .md\\:grid-cols-3 {
                            grid-template-columns: repeat(3, 1fr) !important;
                        }
                        .md\\:grid-cols-4 {
                            grid-template-columns: repeat(4, 1fr) !important;
                        }
                        /* Cards - Green/White Theme */
                        .panel {
                            padding: 8px !important;
                            margin-bottom: 6px !important;
                            border: 1px solid #10b981 !important;
                            border-radius: 4px !important;
                            background: #fff !important;
                        }
                        .panel h3 {
                            font-size: 12px !important;
                            margin-bottom: 6px !important;
                            font-weight: bold !important;
                            color: #059669 !important;
                        }
                        .panel p, .panel span {
                            font-size: 10px !important;
                            color: #065f46 !important;
                        }
                        /* Info Cards - Green Theme */
                        .bg-gradient-to-br {
                            padding: 6px !important;
                            margin-bottom: 6px !important;
                            border-radius: 4px !important;
                            border: 1px solid #10b981 !important;
                        }
                        .bg-gradient-to-br h3 {
                            color: #059669 !important;
                        }
                        .bg-gradient-to-br p, .bg-gradient-to-br span {
                            color: #065f46 !important;
                        }
                        .space-y-2 > * {
                            margin-bottom: 4px !important;
                        }
                        /* Order Details - Green Theme */
                        .p-4 {
                            padding: 6px !important;
                            border: 1px solid #d1fae5 !important;
                            background: #f0fdf4 !important;
                        }
                        .text-lg {
                            font-size: 12px !important;
                            color: #065f46 !important;
                        }
                        .text-xl {
                            font-size: 14px !important;
                            color: #059669 !important;
                        }
                        .text-2xl {
                            font-size: 16px !important;
                            color: #059669 !important;
                        }
                        .text-3xl {
                            font-size: 18px !important;
                            color: #059669 !important;
                        }
                        /* Payment Breakdown - Green Theme */
                        .mb-4 {
                            margin-bottom: 6px !important;
                        }
                        .mb-6 {
                            margin-bottom: 8px !important;
                        }
                        .space-y-2 > * {
                            margin-bottom: 3px !important;
                            border: 1px solid #d1fae5 !important;
                            background: #f0fdf4 !important;
                        }
                        .p-3 {
                            padding: 4px !important;
                        }
                        .p-6 {
                            padding: 8px !important;
                        }
                        /* Text Colors - Green Theme - Comprehensive Override */
                        .text-gray-700, .text-gray-800, .text-gray-600, .text-gray-400, .text-gray-300, .text-gray-500, .text-gray-900 {
                            color: #065f46 !important;
                        }
                        .text-red-600, .text-red-400 {
                            color: #dc2626 !important;
                        }
                        .text-primary-600, .text-primary-400, .text-primary-700, .text-primary-500 {
                            color: #059669 !important;
                        }
                        /* Override any black or blue colors */
                        p, span, div, h1, h2, h3, h4, h5, h6, label, td, th {
                            color: #065f46 !important;
                        }
                        /* Blue backgrounds to green */
                        .bg-blue-50, .bg-blue-100, .bg-blue-200, .bg-primary-50, .bg-primary-100 {
                            background: #f0fdf4 !important;
                            border-color: #d1fae5 !important;
                        }
                        /* Dark backgrounds to white */
                        .bg-gray-50, .bg-gray-100, .bg-gray-200, .bg-gray-700, .bg-gray-800 {
                            background: #fff !important;
                            border-color: #10b981 !important;
                        }
                        /* Ensure white background everywhere */
                        .bg-white, .bg-white\\/10 {
                            background: #fff !important;
                        }
                        /* Final Amount - Green Theme */
                        .bg-gradient-to-r.from-success-500 {
                            background: linear-gradient(to right, #10b981, #059669) !important;
                            padding: 8px !important;
                            border-radius: 4px !important;
                        }
                        .bg-gradient-to-r.from-success-500 p {
                            font-size: 12px !important;
                            color: #fff !important;
                        }
                        /* Remove icons in PDF */
                        svg {
                            display: none !important;
                        }
                        /* Compact spacing */
                        .gap-2 {
                            gap: 4px !important;
                        }
                        .gap-3 {
                            gap: 4px !important;
                        }
                        .gap-4 {
                            gap: 4px !important;
                        }
                        .gap-6 {
                            gap: 6px !important;
                        }
                        /* Hide action buttons */
                        .flex.flex-col.sm\\:flex-row {
                            display: none !important;
                        }
                        /* Footer */
                        .receipt-footer {
                            margin-top: 10px;
                            text-align: center;
                            color: #666;
                            font-size: 10px;
                            padding-top: 8px;
                            border-top: 1px solid #e5e7eb;
                        }
                        @media print {
                            body {
                                padding: 0.5cm !important;
                            }
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                        }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                    <div class="receipt-footer">
                        <p><strong>${t('official_receipt_note')}</strong></p>
                        <p>${t('receipt_id')}: ${receiptId} | ${t('date')}: ${formatDate(selectedOrder.createdAt)}</p>
                    </div>
                </body>
                </html>
            `;

            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    type="button"
                    onClick={() => navigate(userId && cropId ? `/cropmenu/${userId}/${cropId}` : '/getassginshopcrops')}
                        className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
                >
                    {t('back_to_crop_menu')}
                </button>
            </div>
            <div className="panel shadow-md dark:shadow-none">
                <div className="flex md:items-center md:justify-between flex-col md:flex-row mb-5 gap-4">
                    <h5 className="font-semibold text-lg dark:text-white-light">
                        {isSabziMandi ? t('sabzi_mandi_orders_list') : t('dana_mandi_orders_list')}
                    </h5>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <input
                            type="text"
                            className="form-input w-full sm:w-auto"
                            placeholder={t('search_orders_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <input
                            type="date"
                            className="form-input w-full sm:w-auto"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-20">
                        <span className="animate-[spin_2s_linear_infinite] border-8 border-[#f1f2f3] border-l-primary border-r-primary rounded-full w-14 h-14 inline-block align-middle m-auto mb-10"></span>
                    </div>
                ) : (
                    <div className="datatables">
                        <DataTable
                            highlightOnHover
                            className="whitespace-nowrap table-hover"
                            records={recordsData}
                            columns={isSabziMandi ? [
                                // Vegetable Orders Columns
                                {
                                    accessor: "receiptId",
                                    title: t('receipt_id'),
                                    sortable: true,
                                    render: ({ receiptId, _id }: any) => (
                                        <span className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
                                            {receiptId || _id?.slice(-8)?.toUpperCase() || t('na')}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: "vegetableOrderCusId",
                                    title: t('customer'),
                                    render: ({ vegetableOrderCusId }: any) => {
                                        if (!vegetableOrderCusId) return t('na');
                                        // Handle both object and string ID
                                        if (typeof vegetableOrderCusId === 'object' && vegetableOrderCusId !== null) {
                                            const name = `${vegetableOrderCusId?.cusNameF || ''} ${vegetableOrderCusId?.cusNameL || ''}`.trim();
                                            if (name) {
                                                return name;
                                            }
                                        }
                                        return t('na');
                                    },
                                },
                                {
                                    accessor: "vegetableOrderShopId",
                                    title: t('shop'),
                                    render: ({ vegetableOrderShopId }: any) => {
                                        if (!vegetableOrderShopId) return t('na');
                                        // Handle both object and string ID
                                        if (typeof vegetableOrderShopId === 'object') {
                                            return vegetableOrderShopId?.shopName || t('na');
                                        }
                                        return t('na');
                                    },
                                },
                                {
                                    accessor: "vegetableOrderCusId.cusCNIC",
                                    title: t('cnic'),
                                    render: ({ vegetableOrderCusId }: any) => {
                                        if (!vegetableOrderCusId) return t('na');
                                        if (typeof vegetableOrderCusId === 'object' && vegetableOrderCusId !== null) {
                                            return vegetableOrderCusId?.cusCNIC || t('na');
                                        }
                                        return t('na');
                                    }
                                },
                                {
                                    accessor: "vegetableOrderCusId.cusNumber",
                                    title: t('phone'),
                                    render: ({ vegetableOrderCusId }: any) => {
                                        if (!vegetableOrderCusId) return t('na');
                                        if (typeof vegetableOrderCusId === 'object' && vegetableOrderCusId !== null) {
                                            return vegetableOrderCusId?.cusNumber || t('na');
                                        }
                                        return t('na');
                                    }
                                },
                                {
                                    accessor: "vegetableOrderBapariId",
                                    title: t('buyer_name'),
                                    render: ({ vegetableOrderBapariId }: any) => vegetableOrderBapariId || t('na')
                                },
                                {
                                    accessor: "totalPisces",
                                    title: t('total_pieces'),
                                    render: ({ totalPisces }: any) => totalPisces || '0'
                                },
                                {
                                    accessor: "totalAmount",
                                    title: t('total_amount'),
                                    render: ({ pricePisce, totalPisces }: any) => {
                                        const p = Number(pricePisce) || 0;
                                        const q = Number(totalPisces) || 0;
                                        const amt = (isNaN(p) || isNaN(q)) ? 0 : p * q;
                                        return (
                                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                                                Rs. {amt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        );
                                    },
                                },
                                {
                                    accessor: "totalPrice",
                                    title: t('net_price'),
                                    render: ({ totalPrice }: any) => (
                                        <span className="font-semibold text-success-600 dark:text-success-400">
                                            Rs. {parseFloat(totalPrice || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: "createdAt",
                                    title: t('date'),
                                    sortable: true,
                                    render: (row: any) =>
                                        new Date(row.createdAt).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        })
                                },
                                {
                                    accessor: "action",
                                    title: t('action'),
                                    render: (order: any) => (
                                        <button
                                            className="btn btn-sm btn-outline-primary flex items-center gap-2 hover:bg-primary hover:text-white transition-all duration-200"
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setViewModal(true);
                                            }}
                                            title={t('view_receipt')}
                                        >
                                            <FaEye className="w-4 h-4" />
                                            <span className="hidden sm:inline">{t('view')}</span>
                                        </button>
                                    ),
                                },
                            ] : [
                                // Dana Mandi Orders Columns
                                {
                                    accessor: "receiptId",
                                    title: t('receipt_id'),
                                    sortable: true,
                                    render: ({ receiptId, _id }: any) => (
                                        <span className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
                                            {receiptId || _id?.slice(-8)?.toUpperCase() || t('na')}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: "danaMandiOrderCusId",
                                    title: t('customer'),
                                    render: ({ danaMandiOrderCusId }: any) =>
                                        danaMandiOrderCusId ? `${danaMandiOrderCusId?.cusNameF || ''} ${danaMandiOrderCusId?.cusNameL || ''}`.trim() : t('na'),
                                },
                                {
                                    accessor: "danaMandiOrderShopId",
                                    title: t('shop'),
                                    render: ({ danaMandiOrderShopId }: any) => danaMandiOrderShopId?.shopName || t('na'),
                                },
                                { accessor: "danaMandiOrderCusId.cusCNIC", title: t('cnic'), render: ({ danaMandiOrderCusId }: any) => danaMandiOrderCusId?.cusCNIC || t('na') },
                                { accessor: "danaMandiOrderCusId.cusNumber", title: t('phone'), render: ({ danaMandiOrderCusId }: any) => danaMandiOrderCusId?.cusNumber || t('na') },
                                { accessor: "danaMandiOrderBapariId", title: t('bapari_name') },
                                {
                                    accessor: "totalPrice",
                                    title: t('total_amount'),
                                    render: ({ totalPrice }: any) => (
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                                            Rs. {Number(totalPrice || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: "netPrice",
                                    title: t('net_price'),
                                    render: (row: any) => {
                                        const total = Number(row.totalPrice) || 0;
                                        const commission = Number(row.commissioneTotal) || 0;
                                        const mazdori = Number(row.mazdoriTotal) || 0;
                                        const rent = Number(row.RentDelivery) || 0;
                                        const net = total - commission - mazdori - rent;
                                        return (
                                            <span className="font-semibold text-success-600 dark:text-success-400">
                                                Rs. {Math.max(0, net).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        );
                                    },
                                },
                                {
                                    accessor: "createdAt",
                                    title: t('date'),
                                    sortable: true,
                                    render: (row: any) =>
                                        new Date(row.createdAt).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        })
                                },
                                {
                                    accessor: "action",
                                    title: t('action'),
                                    render: (order: any) => (
                                        <button
                                            className="btn btn-sm btn-outline-primary flex items-center gap-2 hover:bg-primary hover:text-white transition-all duration-200"
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setViewModal(true);
                                            }}
                                            title={t('view_receipt')}
                                        >
                                            <FaEye className="w-4 h-4" />
                                            <span className="hidden sm:inline">{t('view')}</span>
                                        </button>
                                    ),
                                },
                            ]}
                            totalRecords={initialRecords.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={(p) => setPage(p)}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) => t('pagination_showing', { from, to, totalRecords })}
                        />
                    </div>
                )}
            </div>

            {/* Receipt Modal */}
            <Modal
                opened={viewModal}
                onClose={() => setViewModal(false)}
                title=""
                size="xl"
                centered
                withCloseButton={false}
            >
                {selectedOrder && (
                    <div id="receipt-content" className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-none rounded-lg">
                        {/* Header Section with Gradient */}
                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900 rounded-t-lg p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                        <IconFile className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">
                                            {isSabziMandi ? t('sabzi_mandi_receipt') : t('dana_mandi_receipt')}
                                        </h2>
                                        <p className="text-primary-100 text-sm">{t('order_details_payment_summary')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewModal(false)}
                                    className="text-white hover:text-primary-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
                                    title={t('close')}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Receipt ID - Prominently Displayed */}
                            <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <IconFile className="w-5 h-5 text-green-700" />
                                        <span className="text-gray-800 text-sm font-medium">{t('receipt_id')}:</span>
                                    </div>
                                    <span className="font-mono text-xl font-bold text-gray-900 bg-green-50 px-4 py-2 rounded-lg border border-green-300">
                                        {selectedOrder.receiptId || selectedOrder._id.slice(-12).toUpperCase()}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-gray-700 text-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{t('date')}: {formatDate(selectedOrder.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 pb-6">

                            {/* Shop & Customer Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Shop Information Card */}
                                <div className="panel shadow-md dark:shadow-none bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-800">
                                    <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center">
                                        <IconCashBanknotes className="w-5 h-5 mr-2" />
                                        {t('shop_information')}
                                    </h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('shop_name')}:</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                {isSabziMandi
                                                    ? (typeof selectedOrder.vegetableOrderShopId === 'object' ? selectedOrder.vegetableOrderShopId?.shopName : t('na'))
                                                    : selectedOrder.danaMandiOrderShopId?.shopName}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('buyer_name')}:</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                {isSabziMandi
                                                    ? selectedOrder.vegetableOrderBapariId || t('na')
                                                    : selectedOrder.danaMandiOrderBapariId || t('na')}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('crop')}:</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                {isSabziMandi
                                                    ? (typeof selectedOrder.vegetableOrderCropId === 'object' && selectedOrder.vegetableOrderCropId !== null
                                                        ? selectedOrder.vegetableOrderCropId?.cropName
                                                        : cropDetails?.cropName) || t('na')
                                                    : selectedOrder.danaMandiOrderCropId?.cropName || cropDetails?.cropName || t('na')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Information Card */}
                                <div className="panel shadow-md dark:shadow-none bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-800">
                                    <h3 className="text-lg font-bold text-green-700 dark:text-green-400 mb-4 flex items-center">
                                        <IconUser className="w-5 h-5 mr-2" />
                                        {t('customer_information')}
                                    </h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('name')}:</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                {isSabziMandi
                                                    ? (typeof selectedOrder.vegetableOrderCusId === 'object' && selectedOrder.vegetableOrderCusId
                                                        ? `${selectedOrder.vegetableOrderCusId?.cusNameF || ''} ${selectedOrder.vegetableOrderCusId?.cusNameL || ''}`.trim()
                                                        : t('na'))
                                                    : `${selectedOrder.danaMandiOrderCusId?.cusNameF || ''} ${selectedOrder.danaMandiOrderCusId?.cusNameL || ''}`.trim()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconCreditCard className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">{t('cnic')}:</span>
                                                <p className="font-semibold text-gray-800 dark:text-white font-mono">
                                                    {isSabziMandi
                                                        ? (typeof selectedOrder.vegetableOrderCusId === 'object' && selectedOrder.vegetableOrderCusId
                                                            ? selectedOrder.vegetableOrderCusId?.cusCNIC
                                                            : t('na'))
                                                        : selectedOrder.danaMandiOrderCusId?.cusCNIC}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconPhone className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">{t('phone')}:</span>
                                                <p className="font-semibold text-gray-800 dark:text-white font-mono">
                                                    {isSabziMandi
                                                        ? (typeof selectedOrder.vegetableOrderCusId === 'object' && selectedOrder.vegetableOrderCusId
                                                            ? selectedOrder.vegetableOrderCusId?.cusNumber
                                                            : t('na'))
                                                        : selectedOrder.danaMandiOrderCusId?.cusNumber}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Details Section */}
                            <div className="panel shadow-md dark:shadow-none mb-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                                    <IconCashBanknotes className="w-5 h-5 mr-2 text-primary-600" />
                                    {t('order_details')}
                                </h3>
                                {isSabziMandi ? (
                                    // Sabzi Mandi Order Details
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm dark:shadow-none">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('price_per_piece')}</span>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                                                Rs. {parseFloat(selectedOrder.pricePisce || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm dark:shadow-none">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('total_pieces')}</span>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                                                {selectedOrder.totalPisces || '0'}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-2 border-primary-200 dark:border-primary-800 shadow-sm dark:shadow-none">
                                            <span className="text-sm text-primary-600 dark:text-primary-400">{t('net_total_price')}</span>
                                            <p className="text-xl font-bold text-primary-700 dark:text-primary-400">
                                                Rs. {parseFloat(selectedOrder.totalPrice || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        {(Number(selectedOrder.retrunPayment) || selectedOrder.returnPaymentAmount || 0) > 0 && (
                                            <>
                                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 shadow-sm dark:shadow-none">
                                                    <span className="text-sm text-amber-700 dark:text-amber-400">{t('return_payment')}</span>
                                                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                                                        Rs. {(Number(selectedOrder.retrunPayment) || selectedOrder.returnPaymentAmount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg border-2 border-success-200 dark:border-success-800 shadow-sm dark:shadow-none">
                                                    <span className="text-sm text-success-600 dark:text-success-400">{t('after_return_payment')}</span>
                                                    <p className="text-xl font-bold text-success-700 dark:text-success-400">
                                                        Rs. {(Number(selectedOrder.afterRetrunPayemnt ?? selectedOrder.afterReturnAmount ?? selectedOrder.totalPrice ?? 0)).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    // Dana Mandi Order Details
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm dark:shadow-none">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('price_per_mann')}</span>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                                                Rs. {selectedOrder.priceCrop?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm dark:shadow-none">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('weight')}</span>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                                                {selectedOrder.weightMann} {t('mann')} {selectedOrder.weightKg ? `/ ${selectedOrder.weightKg} ${t('kg')}` : ''}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-2 border-primary-200 dark:border-primary-800 shadow-sm dark:shadow-none">
                                            <span className="text-sm text-primary-600 dark:text-primary-400">{t('total_price')}</span>
                                            <p className="text-xl font-bold text-primary-700 dark:text-primary-400">
                                                Rs. {selectedOrder.totalPrice?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mala Khata Section - Only for Dana Mandi */}
                            {!isSabziMandi && selectedOrder.malaKhataName && (
                                <div className="panel shadow-md dark:shadow-none mb-6">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                                        <IconNotes className="w-5 h-5 mr-2 text-warning-600" />
                                        {t('mala_khata_details')}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('name')}</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">{selectedOrder.malaKhataName || "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('mann')}</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">{selectedOrder.malaKhataMan ?? "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('kg')}</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">{selectedOrder.malaKhataKg ?? "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('payment')}</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                Rs. {selectedOrder.malaKhataPayment?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Charges & Deductions Section */}
                            <div className="panel shadow-md dark:shadow-none mb-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                                    <IconCashBanknotes className="w-5 h-5 mr-2 text-danger-600" />
                                    {t('charges_deductions')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 shadow-sm dark:shadow-none">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('rent_delivery')}</span>
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                            Rs. {parseFloat(isSabziMandi ? (selectedOrder.RentDelivery || '0') : (selectedOrder.RentDelivery || '0')).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    {!isSabziMandi && (
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 shadow-sm dark:shadow-none">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('mala_khata_payment')}</span>
                                            <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                                Rs. {selectedOrder.malaKhataPayment?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            </p>
                                        </div>
                                    )}
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 shadow-sm dark:shadow-none">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('commission')} ({isSabziMandi ? (selectedOrder.commissioneRate || '0') : (selectedOrder.commissioneRate || '0')}%)</span>
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                            Rs. {parseFloat(isSabziMandi ? (selectedOrder.commissioneTotal || '0') : (selectedOrder.commissioneTotal || '0')).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 shadow-sm dark:shadow-none">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('mazdoori')} ({isSabziMandi ? (selectedOrder.mazdoriRate || '0') : (selectedOrder.mazdoriRate || '0')}%)</span>
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                            Rs. {parseFloat(isSabziMandi ? (selectedOrder.mazdoriTotal || '0') : (selectedOrder.mazdoriTotal || '0')).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    {isSabziMandi && (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm dark:shadow-none">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('pieces_type')}</span>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                                                {selectedOrder.piscesTypeId === 0 ? t('standard') : selectedOrder.piscesType === 1 ? t('special') : t('na')}
                                            </p>
                                        </div>
                                    )}
                                    {!isSabziMandi && selectedOrder.piscesTypeId && (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm dark:shadow-none">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('pisces_type')}</span>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">{selectedOrder.piscesTypeId}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Breakdown Section */}
                            <div className="panel shadow-md dark:shadow-none bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-2 border-primary-200 dark:border-primary-800">
                                <h3 className="text-xl font-bold text-primary-700 dark:text-primary-400 mb-6 flex items-center">
                                    <IconCashBanknotes className="w-6 h-6 mr-2" />
                                    {t('payment_breakdown_final_amount')}
                                </h3>

                                {isSabziMandi ? (
                                    // Sabzi Mandi Payment Breakdown
                                    <>
                                        {/* Base Total */}
                                        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm dark:shadow-none">
                                            <div className="flex justify-between items-center">
                                                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('base_total_price_pieces')}</p>
                                                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                                    Rs. {(parseFloat(selectedOrder.pricePisce || '0') * parseFloat(selectedOrder.totalPisces || '0')).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Deductions */}
                                        <div className="mb-4">
                                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('deductions')}:</h4>
                                            <div className="space-y-2">
                                                {parseFloat(selectedOrder.RentDelivery || '0') > 0 && (
                                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-none">
                                                        <span className="text-gray-700 dark:text-gray-300">{t('rent_delivery')}</span>
                                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                                            - Rs. {parseFloat(selectedOrder.RentDelivery || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                                {parseFloat(selectedOrder.commissioneTotal || '0') > 0 && (
                                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-none">
                                                        <span className="text-gray-700 dark:text-gray-300">{t('commission_total')} ({selectedOrder.commissioneRate}%)</span>
                                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                                            - Rs. {parseFloat(selectedOrder.commissioneTotal || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                                {parseFloat(selectedOrder.mazdoriTotal || '0') > 0 && (
                                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-none">
                                                        <span className="text-gray-700 dark:text-gray-300">{t('mazdoori_total')} ({selectedOrder.mazdoriRate}%)</span>
                                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                                            - Rs. {parseFloat(selectedOrder.mazdoriTotal || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                                {(Number(selectedOrder.retrunPayment) || selectedOrder.returnPaymentAmount || 0) > 0 && (
                                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-none">
                                                        <span className="text-gray-700 dark:text-gray-300">{t('return_payment')}</span>
                                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                                            - Rs. {(Number(selectedOrder.retrunPayment) || selectedOrder.returnPaymentAmount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Final Amount */}
                                        <div className="p-6 bg-gradient-to-r from-success-500 to-success-600 dark:from-success-700 dark:to-success-800 rounded-lg shadow-md dark:shadow-none">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xl font-bold text-white">{(Number(selectedOrder.retrunPayment) || selectedOrder.returnPaymentAmount || 0) > 0 ? t('final_amount_after_return') : t('net_total_price')}</p>
                                                <p className="text-3xl font-bold text-white">
                                                    Rs. {(Number(selectedOrder.afterRetrunPayemnt ?? selectedOrder.afterReturnAmount ?? selectedOrder.totalPrice ?? 0)).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // Dana Mandi Payment Breakdown
                                    <>
                                        {/* Total Price */}
                                        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm dark:shadow-none">
                                            <div className="flex justify-between items-center">
                                                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('total_price_before_deductions')}</p>
                                                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                                    Rs. {selectedOrder.totalPrice?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Deductions */}
                                        <div className="mb-4">
                                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('deductions')}:</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-none">
                                                    <span className="text-gray-700 dark:text-gray-300">{t('rent_delivery')}</span>
                                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                                        - Rs. {selectedOrder.RentDelivery?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-none">
                                                    <span className="text-gray-700 dark:text-gray-300">{t('mala_khata_payment')}</span>
                                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                                        - Rs. {selectedOrder.malaKhataPayment?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-none">
                                                    <span className="text-gray-700 dark:text-gray-300">{t('commission_total')}</span>
                                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                                        - Rs. {selectedOrder.commissioneTotal?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-none">
                                                    <span className="text-gray-700 dark:text-gray-300">{t('mazdoori_total')}</span>
                                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                                        - Rs. {selectedOrder.mazdoriTotal?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                                    </span>
                                                </div>
                                                {selectedOrder.retrunPayment && parseFloat(selectedOrder.retrunPayment) > 0 && (
                                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-none">
                                                        <span className="text-gray-700 dark:text-gray-300">{t('return_payment')}</span>
                                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                                            - Rs. {parseFloat(selectedOrder.retrunPayment).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Final Amount */}
                                        <div className="p-6 bg-gradient-to-r from-success-500 to-success-600 dark:from-success-700 dark:to-success-800 rounded-lg shadow-md dark:shadow-none">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xl font-bold text-white">{t('final_amount_after_return')}</p>
                                                <p className="text-3xl font-bold text-white">
                                                    Rs. {selectedOrder.afterRetrunPayemnt?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    className="btn btn-outline-primary flex items-center gap-2"
                                    onClick={() => setViewModal(false)}
                                >
                                    {t('close')}
                                </button>
                                <button
                                    className="btn btn-primary flex items-center gap-2"
                                    onClick={handlePrint}
                                    title={t('print_receipt')}
                                >
                                    <FaPrint className="w-4 h-4" /> {t('print_receipt')}
                                </button>
                                <button
                                    className="btn btn-danger flex items-center gap-2"
                                    onClick={handleExportPDF}
                                    title={t('download_pdf')}
                                >
                                    <FaFilePdf className="w-4 h-4" /> {t('export_pdf')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DanaMandiCropOrderList;
