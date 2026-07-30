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
import IconNotes from "../../components/Icon/IconNotes";
import IconFile from "../../components/Icon/IconFile";
import PageHeader from "../../components/Agricultural/PageHeader";
import { useShopId } from "./../../Hooks/useShopId";
import { useAuthToken } from "./../../Hooks/useAuthToken";
import { Modal } from "@mantine/core";

interface DanaMandiOrder {
    _id: string;
    danaMandiOrderShopId?: { _id: string; shopName: string; shopRegistrationNumber: string } | string;
    danaMandiOrderCusId?: { _id: string; cusNameF: string; cusNameL: string; cusNumber: string; cusCNIC: string } | string;
    danaMandiOrderBapariId?: string;
    danaMandiOrderCropId?: { _id: string; cropName: string } | string;
    afterRetrunPayemnt?: number;
    priceCrop?: number;
    weightMann?: number;
    weightKg?: number;
    totalPrice?: number;
    commissioneTotal?: number;
    mazdoriTotal?: number;
    RentDelivery?: number;
    malaKhataPayment?: number;
    malaKhataName?: string;
    malaKhataMan?: number;
    malaKhataKg?: number;
    commissioneRate?: number;
    mazdoriRate?: number;
    retrunPayment?: number | string;
    piscesTypeId?: string;
    receiptId?: string;
    createdAt: string;
    // Sabzi Mandi fields
    vegetableOrderShopId?: { _id: string; shopName: string; shopRegistrationNumber: string } | string;
    vegetableOrderCusId?: { _id: string; cusNameF: string; cusNameL: string; cusNumber: string; cusCNIC: string } | string;
    vegetableOrderBapariId?: string;
    vegetableOrderCropId?: { _id: string; cropName: string } | string;
    pricePisce?: number;
    totalPisces?: number;
    commissioneRate?: number;
    mazdoriRate?: number;
}

const DanaMandiCustomerOrderList = () => {
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const { shopId } = useShopId();
    const { cropId, cusId } = useParams(); // ✅ get cusId from route params

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
    const [filterDate, setFilterDate] = useState<string>("");
    const [cropDetails, setCropDetails] = useState<any>(null);
    const [isSabziMandi, setIsSabziMandi] = useState(false);

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
                    console.log('DanaMandiCustomerOrderList: Crop type detected:', cropType, 'isSabziMandi:', isSabzi);
                }
            })
            .catch((err) => {
                console.error('Error fetching crop details:', err);
            });
    }, [cropId, token]);

    // ✅ Fetch Customer Orders (Dana Mandi or Vegetable based on crop type)
    useEffect(() => {
        if (!shopId || !cropId || !cusId || cropDetails === null) return;
        
        setIsLoading(true);
        
        if (isSabziMandi) {
            // Fetch vegetable orders for this customer
            axios
                .post(
                    `${ServerSetting.serUrl}/api/getallvegetableorders`,
                    {
                        shopId: shopId,
                        cropId: cropId,
                        customerId: cusId
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                .then((res) => {
                    if (res.data.status === 200) {
                        setInitialRecords(res.data.data || []);
                    } else {
                        Notification({
                            text: res.data.message || "Failed to fetch customer orders",
                            color: "danger",
                        });
                    }
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching vegetable customer orders:", err);
                    Notification({ text: "Error fetching customer orders", color: "danger" });
                    setIsLoading(false);
                });
        } else {
            // Fetch Dana Mandi orders for this customer
            axios
                .get(
                    `${ServerSetting.serUrl}/api/allviewdanamadinordercustomer/${shopId}/${cropId}/${cusId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                .then((res) => {
                    if (res.data.status === 200) {
                        setInitialRecords(res.data.data || []);
                    } else {
                        Notification({
                            text: res.data.message || "Failed to fetch customer orders",
                            color: "danger",
                        });
                    }
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching customer orders:", err);
                    Notification({ text: "Error fetching customer orders", color: "danger" });
                    setIsLoading(false);
                });
        }
    }, [shopId, cropId, cusId, token, isSabziMandi, cropDetails]);


    // Filter data on search + date
    useEffect(() => {
        let filtered = initialRecords;

        if (search) {
            const lower = search.toLowerCase();
            filtered = filtered.filter((item: any) => {
                if (isSabziMandi) {
                    const shopName = (typeof item.vegetableOrderShopId === 'object' && item.vegetableOrderShopId !== null)
                        ? item.vegetableOrderShopId?.shopName?.toLowerCase() || ""
                        : "";
                    const cusName = (typeof item.vegetableOrderCusId === 'object' && item.vegetableOrderCusId !== null)
                        ? `${item.vegetableOrderCusId?.cusNameF || ""} ${item.vegetableOrderCusId?.cusNameL || ""}`.toLowerCase()
                        : "";
                    const cusCNIC = (typeof item.vegetableOrderCusId === 'object' && item.vegetableOrderCusId !== null)
                        ? item.vegetableOrderCusId?.cusCNIC || ""
                        : "";
                    const cusNumber = (typeof item.vegetableOrderCusId === 'object' && item.vegetableOrderCusId !== null)
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
                    const shopName = (typeof item.danaMandiOrderShopId === 'object' && item.danaMandiOrderShopId !== null)
                        ? item.danaMandiOrderShopId?.shopName?.toLowerCase() || ""
                        : "";
                    const cusName = (typeof item.danaMandiOrderCusId === 'object' && item.danaMandiOrderCusId !== null)
                        ? `${item.danaMandiOrderCusId?.cusNameF || ""} ${item.danaMandiOrderCusId?.cusNameL || ""}`.toLowerCase()
                        : "";
                    const cusCNIC = (typeof item.danaMandiOrderCusId === 'object' && item.danaMandiOrderCusId !== null)
                        ? item.danaMandiOrderCusId?.cusCNIC || ""
                        : "";
                    const cusNumber = (typeof item.danaMandiOrderCusId === 'object' && item.danaMandiOrderCusId !== null)
                        ? item.danaMandiOrderCusId?.cusNumber || ""
                        : "";
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
                const receiptId = selectedOrder?.receiptId || selectedOrder?._id?.slice(-12)?.toUpperCase() || 'N/A';
                const receiptTitle = isSabziMandi ? 'Sabzi Mandi Receipt' : 'Dana Mandi Receipt';
                
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>${receiptTitle} - ${receiptId}</title>
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
            const receiptId = selectedOrder.receiptId || selectedOrder._id?.slice(-12)?.toUpperCase() || 'N/A';
            const receiptTitle = isSabziMandi ? 'Sabzi Mandi Receipt' : 'Dana Mandi Receipt';
            const fileName = `${receiptTitle.replace(/\s+/g, '_')}_${receiptId}_${formatDate(selectedOrder.createdAt).replace(/\//g, '-')}.html`;

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${receiptTitle} - ${receiptId}</title>
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
                            color: #065f46 !important;
                            background: #fff !important;
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
                            background: #f0fdf4 !important;
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
                        /* Final Amount */
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
                            color: #065f46 !important;
                            font-size: 10px;
                            padding-top: 8px;
                            border-top: 1px solid #10b981 !important;
                        }
                        .receipt-footer p {
                            color: #065f46 !important;
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
                        <p><strong>This is an official receipt. Please save this file as PDF for your records.</strong></p>
                        <p>Receipt ID: ${receiptId} | Date: ${formatDate(selectedOrder.createdAt)}</p>
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
            <PageHeader
                title={isSabziMandi ? 'Customer Orders (Sabzi Mandi)' : 'Customer Orders (Dana Mandi)'}
                description="View all orders for this customer"
                onBack={() => navigate(-1)}
                backLabel="Back to Customer List"
                icon="📄"
            />
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">
                        {isSabziMandi ? 'Sabzi Mandi Orders List' : 'Dana Mandi Orders List'}
                    </h5>
                    <div className="ltr:ml-auto rtl:mr-auto flex gap-3">
                        <input
                            type="text"
                            className="form-input w-auto"
                            placeholder="Search by Receipt ID, CNIC, Phone, Shop, or Customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <input
                            type="date"
                            className="form-input w-auto"
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
                                // Sabzi Mandi Columns
                                {
                                    accessor: "receiptId",
                                    title: "Receipt ID",
                                    sortable: true,
                                    render: ({ receiptId, _id }: any) => (
                                        <span className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
                                            {receiptId || _id?.slice(-8)?.toUpperCase() || 'N/A'}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: "vegetableOrderShopId",
                                    title: "Shop",
                                    render: ({ vegetableOrderShopId }: any) => {
                                        if (typeof vegetableOrderShopId === 'object' && vegetableOrderShopId !== null) {
                                            return vegetableOrderShopId?.shopName || 'N/A';
                                        }
                                        return 'N/A';
                                    },
                                },
                                { 
                                    accessor: "vegetableOrderBapariId", 
                                    title: "Buyer Name",
                                    render: ({ vegetableOrderBapariId }: any) => vegetableOrderBapariId || 'N/A'
                                },
                                {
                                    accessor: "pricePisce",
                                    title: "Price per Piece",
                                    render: ({ pricePisce }: any) => (
                                        <span>Rs. {pricePisce?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                                    ),
                                },
                                {
                                    accessor: "totalPisces",
                                    title: "Total Pieces",
                                    render: ({ totalPisces }: any) => totalPisces || '0',
                                },
                                {
                                    accessor: "totalPrice",
                                    title: "Net Total Price",
                                    render: ({ totalPrice }: any) => (
                                        <span className="font-semibold text-success-600 dark:text-success-400">
                                            Rs. {totalPrice?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: "createdAt",
                                    title: "Date",
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
                                    title: "Action",
                                    render: (order: any) => (
                                        <button
                                            className="btn btn-sm btn-outline-primary flex items-center gap-2 hover:bg-primary hover:text-white transition-all duration-200"
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setViewModal(true);
                                            }}
                                            title="View Receipt"
                                        >
                                            <FaEye className="w-4 h-4" />
                                            <span className="hidden sm:inline">View</span>
                                        </button>
                                    ),
                                },
                            ] : [
                                // Dana Mandi Columns
                                {
                                    accessor: "receiptId",
                                    title: "Receipt ID",
                                    sortable: true,
                                    render: ({ receiptId, _id }: any) => (
                                        <span className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
                                            {receiptId || _id?.slice(-8)?.toUpperCase() || 'N/A'}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: "danaMandiOrderShopId",
                                    title: "Shop",
                                    render: ({ danaMandiOrderShopId }: any) => {
                                        if (typeof danaMandiOrderShopId === 'object' && danaMandiOrderShopId !== null) {
                                            return danaMandiOrderShopId?.shopName || 'N/A';
                                        }
                                        return 'N/A';
                                    },
                                },
                                { 
                                    accessor: "danaMandiOrderBapariId", 
                                    title: "Bapari Name",
                                    render: ({ danaMandiOrderBapariId }: any) => danaMandiOrderBapariId || 'N/A'
                                },
                                { 
                                    accessor: "afterRetrunPayemnt", 
                                    title: "After Return Payment",
                                    render: ({ afterRetrunPayemnt }: any) => (
                                        <span className="font-semibold text-success-600 dark:text-success-400">
                                            Rs. {afterRetrunPayemnt?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: "createdAt",
                                    title: "Date",
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
                                    title: "Action",
                                    render: (order: any) => (
                                        <button
                                            className="btn btn-sm btn-outline-primary flex items-center gap-2 hover:bg-primary hover:text-white transition-all duration-200"
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setViewModal(true);
                                            }}
                                            title="View Receipt"
                                        >
                                            <FaEye className="w-4 h-4" />
                                            <span className="hidden sm:inline">View</span>
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
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
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
                    <div id="receipt-content" className="bg-white dark:bg-gray-800">
                        {/* Header Section with Gradient */}
                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900 rounded-t-lg p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                        <IconFile className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">
                                            {isSabziMandi ? 'Sabzi Mandi Receipt' : 'Dana Mandi Receipt'}
                                        </h2>
                                        <p className="text-primary-100 text-sm">Order Details & Payment Summary</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewModal(false)}
                                    className="text-white hover:text-primary-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
                                    title="Close"
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
                                        <span className="text-gray-800 text-sm font-medium">Receipt ID:</span>
                                    </div>
                                    <span className="font-mono text-xl font-bold text-gray-900 bg-green-50 px-4 py-2 rounded-lg border border-green-300">
                                        {selectedOrder.receiptId || selectedOrder._id?.slice(-12)?.toUpperCase() || 'N/A'}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-gray-700 text-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Date: {formatDate(selectedOrder.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 pb-6">

                            {/* Shop & Customer Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Shop Information Card */}
                                <div className="panel bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-800">
                                    <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center">
                                        <IconCashBanknotes className="w-5 h-5 mr-2" />
                                        Shop Information
                                    </h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Shop Name:</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                {isSabziMandi 
                                                    ? (typeof selectedOrder.vegetableOrderShopId === 'object' && selectedOrder.vegetableOrderShopId !== null
                                                        ? selectedOrder.vegetableOrderShopId?.shopName 
                                                        : 'N/A')
                                                    : (typeof selectedOrder.danaMandiOrderShopId === 'object' && selectedOrder.danaMandiOrderShopId !== null
                                                        ? selectedOrder.danaMandiOrderShopId?.shopName 
                                                        : 'N/A')}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Buyer Name:</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                {isSabziMandi
                                                    ? selectedOrder.vegetableOrderBapariId || 'N/A'
                                                    : selectedOrder.danaMandiOrderBapariId || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Crop:</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                {isSabziMandi
                                                    ? (typeof selectedOrder.vegetableOrderCropId === 'object' && selectedOrder.vegetableOrderCropId !== null
                                                        ? selectedOrder.vegetableOrderCropId?.cropName 
                                                        : cropDetails?.cropName) || 'N/A'
                                                    : (typeof selectedOrder.danaMandiOrderCropId === 'object' && selectedOrder.danaMandiOrderCropId !== null
                                                        ? selectedOrder.danaMandiOrderCropId?.cropName 
                                                        : cropDetails?.cropName) || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Information Card */}
                                <div className="panel bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-800">
                                    <h3 className="text-lg font-bold text-green-700 dark:text-green-400 mb-4 flex items-center">
                                        <IconUser className="w-5 h-5 mr-2" />
                                        Customer Information
                                    </h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                {isSabziMandi
                                                    ? (typeof selectedOrder.vegetableOrderCusId === 'object' && selectedOrder.vegetableOrderCusId !== null
                                                        ? `${selectedOrder.vegetableOrderCusId?.cusNameF || ''} ${selectedOrder.vegetableOrderCusId?.cusNameL || ''}`.trim()
                                                        : 'N/A')
                                                    : (typeof selectedOrder.danaMandiOrderCusId === 'object' && selectedOrder.danaMandiOrderCusId !== null
                                                        ? `${selectedOrder.danaMandiOrderCusId?.cusNameF || ''} ${selectedOrder.danaMandiOrderCusId?.cusNameL || ''}`.trim()
                                                        : 'N/A')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconCreditCard className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">CNIC:</span>
                                                <p className="font-semibold text-gray-800 dark:text-white font-mono">
                                                    {isSabziMandi
                                                        ? (typeof selectedOrder.vegetableOrderCusId === 'object' && selectedOrder.vegetableOrderCusId !== null
                                                            ? selectedOrder.vegetableOrderCusId?.cusCNIC
                                                            : 'N/A')
                                                        : (typeof selectedOrder.danaMandiOrderCusId === 'object' && selectedOrder.danaMandiOrderCusId !== null
                                                            ? selectedOrder.danaMandiOrderCusId?.cusCNIC
                                                            : 'N/A')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconPhone className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                                                <p className="font-semibold text-gray-800 dark:text-white font-mono">
                                                    {isSabziMandi
                                                        ? (typeof selectedOrder.vegetableOrderCusId === 'object' && selectedOrder.vegetableOrderCusId !== null
                                                            ? selectedOrder.vegetableOrderCusId?.cusNumber
                                                            : 'N/A')
                                                        : (typeof selectedOrder.danaMandiOrderCusId === 'object' && selectedOrder.danaMandiOrderCusId !== null
                                                            ? selectedOrder.danaMandiOrderCusId?.cusNumber
                                                            : 'N/A')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Details Section */}
                            <div className="panel mb-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                                    <IconCashBanknotes className="w-5 h-5 mr-2 text-primary-600" />
                                    Order Details
                                </h3>
                                {isSabziMandi ? (
                                    // Sabzi Mandi Order Details
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Price per Piece</span>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                                                Rs. {parseFloat(selectedOrder.pricePisce || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Pieces</span>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                                                {selectedOrder.totalPisces || '0'}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-2 border-primary-200 dark:border-primary-800">
                                            <span className="text-sm text-primary-600 dark:text-primary-400">Net Total Price</span>
                                            <p className="text-xl font-bold text-primary-700 dark:text-primary-400">
                                                Rs. {parseFloat(selectedOrder.totalPrice || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        {(Number(selectedOrder.retrunPayment) || selectedOrder.returnPaymentAmount || 0) > 0 && (
                                            <>
                                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                                    <span className="text-sm text-amber-700 dark:text-amber-400">Return Payment</span>
                                                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                                                        Rs. {(Number(selectedOrder.retrunPayment) || selectedOrder.returnPaymentAmount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg border-2 border-success-200 dark:border-success-800">
                                                    <span className="text-sm text-success-600 dark:text-success-400">After Return Payment</span>
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
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Price per Mann</span>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                                                Rs. {selectedOrder.priceCrop?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Weight</span>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                                                {selectedOrder.weightMann} Mann {selectedOrder.weightKg ? `/ ${selectedOrder.weightKg} Kg` : ''}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-2 border-primary-200 dark:border-primary-800">
                                            <span className="text-sm text-primary-600 dark:text-primary-400">Total Price</span>
                                            <p className="text-xl font-bold text-primary-700 dark:text-primary-400">
                                                Rs. {selectedOrder.totalPrice?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mala Khata Section - Only for Dana Mandi */}
                            {!isSabziMandi && selectedOrder.malaKhataName && (
                                <div className="panel mb-6">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                                        <IconNotes className="w-5 h-5 mr-2 text-warning-600" />
                                        Mala Khata Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Name</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">{selectedOrder.malaKhataName || "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Mann</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">{selectedOrder.malaKhataMan ?? "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Kg</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">{selectedOrder.malaKhataKg ?? "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Payment</span>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                Rs. {selectedOrder.malaKhataPayment?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Charges & Deductions Section */}
                            <div className="panel mb-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                                    <IconCashBanknotes className="w-5 h-5 mr-2 text-danger-600" />
                                    Charges & Deductions
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Rent & Delivery</span>
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                            Rs. {parseFloat(isSabziMandi ? (selectedOrder.RentDelivery || '0') : (selectedOrder.RentDelivery || '0')).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    {!isSabziMandi && (
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Mala Khata Payment</span>
                                            <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                                Rs. {selectedOrder.malaKhataPayment?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            </p>
                                        </div>
                                    )}
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Commission ({isSabziMandi ? (selectedOrder.commissioneRate || '0') : (selectedOrder.commissioneRate || '0')}%)</span>
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                            Rs. {parseFloat(isSabziMandi ? (selectedOrder.commissioneTotal || '0') : (selectedOrder.commissioneTotal || '0')).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Mazdoori ({isSabziMandi ? (selectedOrder.mazdoriRate || '0') : (selectedOrder.mazdoriRate || '0')}%)</span>
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                            Rs. {parseFloat(isSabziMandi ? (selectedOrder.mazdoriTotal || '0') : (selectedOrder.mazdoriTotal || '0')).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    {!isSabziMandi && selectedOrder.piscesTypeId && (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Pisces Type</span>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">{selectedOrder.piscesTypeId}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Breakdown Section */}
                            <div className="panel bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-2 border-primary-200 dark:border-primary-800">
                                <h3 className="text-xl font-bold text-primary-700 dark:text-primary-400 mb-6 flex items-center">
                                    <IconCashBanknotes className="w-6 h-6 mr-2" />
                                    Payment Breakdown & Final Amount
                                </h3>
                                
                                {isSabziMandi ? (
                                    // Sabzi Mandi Payment Breakdown
                                    <>
                                        {/* Base Total */}
                                        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <div className="flex justify-between items-center">
                                                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Base Total (Price × Pieces)</p>
                                                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                                    Rs. {(parseFloat(selectedOrder.pricePisce || '0') * parseFloat(selectedOrder.totalPisces || '0')).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Deductions */}
                                        <div className="mb-4">
                                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Deductions:</h4>
                                            <div className="space-y-2">
                                                {parseFloat(selectedOrder.RentDelivery || '0') > 0 && (
                                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                        <span className="text-gray-700 dark:text-gray-300">Rent & Delivery</span>
                                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                                            - Rs. {parseFloat(selectedOrder.RentDelivery || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                                {parseFloat(selectedOrder.commissioneTotal || '0') > 0 && (
                                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                        <span className="text-gray-700 dark:text-gray-300">Commission Total ({selectedOrder.commissioneRate}%)</span>
                                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                                            - Rs. {parseFloat(selectedOrder.commissioneTotal || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                                {parseFloat(selectedOrder.mazdoriTotal || '0') > 0 && (
                                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                        <span className="text-gray-700 dark:text-gray-300">Mazdoori Total ({selectedOrder.mazdoriRate}%)</span>
                                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                                            - Rs. {parseFloat(selectedOrder.mazdoriTotal || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                                {(Number(selectedOrder.retrunPayment) || selectedOrder.returnPaymentAmount || 0) > 0 && (
                                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                        <span className="text-gray-700 dark:text-gray-300">Return Payment</span>
                                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                                            - Rs. {(Number(selectedOrder.retrunPayment) || selectedOrder.returnPaymentAmount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Final Amount */}
                                        <div className="p-6 bg-gradient-to-r from-success-500 to-success-600 dark:from-success-700 dark:to-success-800 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xl font-bold text-white">{(Number(selectedOrder.retrunPayment) || selectedOrder.returnPaymentAmount || 0) > 0 ? 'Final Amount (After Return Payment)' : 'Net Total Price'}</p>
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
                                        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <div className="flex justify-between items-center">
                                                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Price (Before Deductions)</p>
                                                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                                    Rs. {selectedOrder.totalPrice?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Deductions */}
                                        <div className="mb-4">
                                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Deductions:</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                    <span className="text-gray-700 dark:text-gray-300">Rent Delivery</span>
                                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                                        - Rs. {selectedOrder.RentDelivery?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                    <span className="text-gray-700 dark:text-gray-300">Mala Khata Payment</span>
                                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                                        - Rs. {selectedOrder.malaKhataPayment?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                    <span className="text-gray-700 dark:text-gray-300">Commission Total</span>
                                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                                        - Rs. {selectedOrder.commissioneTotal?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                    <span className="text-gray-700 dark:text-gray-300">Mazdoori Total</span>
                                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                                        - Rs. {selectedOrder.mazdoriTotal?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                                    </span>
                                                </div>
                                                {selectedOrder.retrunPayment && parseFloat(selectedOrder.retrunPayment) > 0 && (
                                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                        <span className="text-gray-700 dark:text-gray-300">Return Payment</span>
                                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                                            - Rs. {parseFloat(selectedOrder.retrunPayment).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Final Amount */}
                                        <div className="p-6 bg-gradient-to-r from-success-500 to-success-600 dark:from-success-700 dark:to-success-800 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xl font-bold text-white">Final Amount (After Return Payment)</p>
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
                                    Close
                                </button>
                                <button 
                                    className="btn btn-primary flex items-center gap-2" 
                                    onClick={handlePrint}
                                    title="Print Receipt"
                                >
                                    <FaPrint className="w-4 h-4" /> Print Receipt
                                </button>
                                <button 
                                    className="btn btn-danger flex items-center gap-2" 
                                    onClick={handleExportPDF}
                                    title="Download as PDF"
                                >
                                    <FaFilePdf className="w-4 h-4" /> Export PDF
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DanaMandiCustomerOrderList;
