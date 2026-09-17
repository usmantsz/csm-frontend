import { useEffect, useState } from "react";
import sortBy from "lodash/sortBy";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ServerSetting } from "./../../helperComponents/ServerSetting";
import { Notification } from "./../../helperComponents/Notification";
import { FaEye } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useShopId } from "./../../Hooks/useShopId";
import { useShopIdFromUrl } from "./../../Hooks/useShopIdFromUrl";
import { useAuthToken } from "./../../Hooks/useAuthToken";
import IconArrowLeft from "../../components/Icon/IconArrowLeft";

interface DanaMandiCustomer {
  _id: string;
  cusNameF: string;
  cusNameL: string;
  cusNumber: string;
  cusCNIC: string;
  createdAt?: string;
}

const DanaMandiCustomerList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthToken();
  const { shopId: urlShopId, isViewingAsAdmin } = useShopIdFromUrl();
  const { shopId: userShopId } = useShopId();
  const { userId, cropId } = useParams<{ userId: string; cropId: string }>();
  const isAdmin = user?.userRole === 'Admin' || user?.userRole === 'admin' || user?.userRole === '0';

  // State for shopId fetched from userId
  const [shopId, setShopId] = useState<string | null>(urlShopId || userShopId);
  const [fetchingShopId, setFetchingShopId] = useState(false);

  // If shopId is missing and we have userId, try to fetch shopId from userId (for admin direct access)
  useEffect(() => {
    const fetchShopIdFromUserId = async () => {
      // If we already have shopId, don't fetch
      if (shopId) return;

      // Only fetch if we have userId and token
      if (!userId || !token) return;

      // For admin: always try to fetch from userId if shopId is missing
      // For shop owner: only fetch if urlShopId is also missing
      if (!isAdmin && urlShopId) return;

      setFetchingShopId(true);
      try {
        console.log('DanaMandiCustomerList: Fetching shopId from userId:', userId);
        const response = await axios.get(
          `${ServerSetting.serUrl}/api/getShopId/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('DanaMandiCustomerList: API Response:', response.data);
        if (response.data?.status === 200 && response.data?.data) {
          // API returns shop object, get _id from it
          const shopData = response.data.data;
          const fetchedShopId = shopData._id || shopData;
          console.log('DanaMandiCustomerList: ✅ Fetched shopId from userId:', fetchedShopId, 'Full shop data:', shopData);
          if (fetchedShopId) {
            setShopId(fetchedShopId);
          } else {
            console.error('DanaMandiCustomerList: ❌ shopId is null/undefined in response');
          }
        } else {
          console.warn('DanaMandiCustomerList: ⚠️ No shopId found in response:', response.data);
        }
      } catch (error: any) {
        console.error('DanaMandiCustomerList: Error fetching shopId from userId:', error);
        if (error.response) {
          console.error('DanaMandiCustomerList: Error response:', error.response.data);
        }
      } finally {
        setFetchingShopId(false);
      }
    };

    fetchShopIdFromUserId();
  }, [userId, token, isAdmin, shopId, urlShopId]);

  // Update shopId when urlShopId changes
  useEffect(() => {
    if (urlShopId) {
      setShopId(urlShopId);
    }
  }, [urlShopId]);

  // Update shopId when userShopId changes (for shop owner)
  useEffect(() => {
    if (!isAdmin && userShopId && !urlShopId) {
      setShopId(userShopId);
    }
  }, [userShopId, isAdmin, urlShopId]);

  // Determine if admin is viewing (admin user + userId in URL params means admin is viewing shop owner's data)
  const isAdminViewing = isAdmin && !!userId && userId !== user?._id;

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
          console.log('DanaMandiCustomerList: Crop type detected:', cropType, 'isSabziMandi:', isSabzi);
        }
      })
      .catch((err) => {
        console.error('Error fetching crop details:', err);
      });
  }, [cropId, token]);

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState<DanaMandiCustomer[]>([]);
  const [recordsData, setRecordsData] = useState<DanaMandiCustomer[]>([]);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "cusNameF",
    direction: "asc",
  });
  const [search, setSearch] = useState("");
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [cropDetails, setCropDetails] = useState<any>(null);
  const [isSabziMandi, setIsSabziMandi] = useState(false);

  // Pagination
  useEffect(() => {
    if (!Array.isArray(initialRecords)) return;
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecordsData([...initialRecords.slice(from, to)]);
  }, [page, pageSize, initialRecords]);

  // Sorting
  useEffect(() => {
    if (!Array.isArray(initialRecords)) return;
    const sortedData = sortBy(
      initialRecords,
      sortStatus.columnAccessor as keyof DanaMandiCustomer
    );
    setInitialRecords(
      sortStatus.direction === "desc" ? sortedData.reverse() : sortedData
    );
    setPage(1);
  }, [sortStatus]);

  // Fetch Customers (Dana Mandi or Vegetable based on crop type)
  useEffect(() => {
    if (!shopId || !cropId || fetchingShopId) {
      if (fetchingShopId) {
        setIsLoading(true);
      }
      return;
    }

    // Wait for crop details to be fetched
    if (cropDetails === null) {
      return;
    }

    setIsLoading(true);

    if (isSabziMandi) {
      // Fetch customers from Vegetable Orders
      axios
        .post(
          `${ServerSetting.serUrl}/api/getallvegetableorders`,
          {
            shopId: shopId,
            cropId: cropId
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .then((res) => {
          if (res.data.status === 200) {
            const orders = res.data.data || [];
            // Extract unique customers from orders
            const customerMap = new Map();
            orders.forEach((order: any) => {
              if (order.vegetableOrderCusId) {
                let cusId: string;
                let customer: any = null;

                if (typeof order.vegetableOrderCusId === 'object' && order.vegetableOrderCusId !== null) {
                  // Customer is already populated
                  cusId = order.vegetableOrderCusId._id || order.vegetableOrderCusId.toString();
                  customer = order.vegetableOrderCusId;
                } else {
                  // Customer is just an ID string
                  cusId = order.vegetableOrderCusId.toString();
                }

                if (cusId && !customerMap.has(cusId) && customer) {
                  customerMap.set(cusId, customer);
                }
              }
            });
            const customers = Array.from(customerMap.values());
            setInitialRecords(customers);
            console.log('DanaMandiCustomerList: Extracted', customers.length, 'unique customers from', orders.length, 'vegetable orders');

            // Get shop and crop info
            if (orders.length > 0) {
              const firstOrder = orders[0];
              setShopInfo({
                cropName: (typeof firstOrder.vegetableOrderCropId === 'object' && firstOrder.vegetableOrderCropId !== null)
                  ? firstOrder.vegetableOrderCropId?.cropName
                  : cropDetails?.cropName || t('na'),
                shopName: (typeof firstOrder.vegetableOrderShopId === 'object' && firstOrder.vegetableOrderShopId !== null)
                  ? firstOrder.vegetableOrderShopId?.shopName
                  : t('na'),
                shopRegistrationNumber: (typeof firstOrder.vegetableOrderShopId === 'object' && firstOrder.vegetableOrderShopId !== null)
                  ? firstOrder.vegetableOrderShopId?.shopRegistrationNumber
                  : t('na'),
              });
            } else {
              setShopInfo({
                cropName: cropDetails?.cropName || t('na'),
                shopName: t('na'),
                shopRegistrationNumber: t('na'),
              });
            }
          } else {
            Notification({
              text: res.data.message || t('failed_to_fetch_customers'),
              color: "danger",
            });
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching vegetable order customers:", err);
          Notification({ text: t('error_fetching_customers'), color: "danger" });
          setIsLoading(false);
        });
    } else {
      // Fetch customers from Dana Mandi Orders
      axios
        .get(
          `${ServerSetting.serUrl}/api/viewallcusdanamandispecificshop/${shopId}/${cropId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .then((res) => {
          if (res.data.status === 200) {
            const customers = Array.isArray(res.data.data?.customers)
              ? res.data.data.customers
              : [];
            setInitialRecords(customers);

            setShopInfo({
              cropName: res.data.data.cropName,
              shopName: res.data.data.shopName,
              shopRegistrationNumber: res.data.data.shopRegistrationNumber,
            });
          } else {
            Notification({
              text: res.data.message || t('failed_to_fetch_customers'),
              color: "danger",
            });
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching customers:", err);
          Notification({ text: t('error_fetching_customers'), color: "danger" });
          setIsLoading(false);
        });
    }
  }, [shopId, cropId, token, isSabziMandi, cropDetails, fetchingShopId]);

  // Filter (only phone + CNIC)
  useEffect(() => {
    if (!Array.isArray(initialRecords)) return;
    let filtered = initialRecords;

    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.cusCNIC?.includes(search) || item.cusNumber?.includes(search)
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecordsData([...filtered.slice(from, to)]);
  }, [search, initialRecords, page, pageSize]);

  return (
    <div className="bg-[#070f1a] min-h-full -m-5 p-5">
      {/* Back button - top right, outside card */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() =>
            navigate(
              userId && cropId ? `/cropmenu/${userId}/${cropId}` : '/getassginshopcrops'
            )
          }
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-400 hover:text-emerald-300 transition-all shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('back_to_crop_menu')}
        </button>
      </div>

      {/* Admin View Badge */}
      {(isAdminViewing || (isAdmin && isViewingAsAdmin)) && (
        <div className="mb-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-semibold text-amber-300">
              👑 {t('admin_view')}
            </span>
            <span className="text-sm text-amber-300/90">{t('viewing_customers_as_admin')}</span>
            <button
              onClick={() => navigate(shopId ? `/shop/view/${shopId}` : '/shop')}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-950/30 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-all ltr:ml-auto rtl:mr-auto"
            >
              <IconArrowLeft className="w-4 h-4 mr-1" />
              {t('back_to_shop_view')}
            </button>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-[#0b1725] border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/40">
        {/* Shop Info Section */}
        {shopInfo && (
          <div className="mx-6 mt-6 mb-1 bg-[#081320] border border-slate-800 p-4 rounded-lg flex flex-wrap gap-8">
            <p className="text-slate-300 text-sm">
              <strong className="text-slate-100">{t('crop')}:</strong> {shopInfo.cropName}
            </p>
            <p className="text-slate-300 text-sm">
              <strong className="text-slate-100">{t('shop')}:</strong> {shopInfo.shopName}
            </p>
            <p className="text-slate-300 text-sm">
              <strong className="text-slate-100">{t('reg_number')}:</strong> {shopInfo.shopRegistrationNumber}
            </p>
          </div>
        )}

        {/* Card Header: Title + Search */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h5 className="text-base font-semibold text-slate-100 tracking-tight">
              {isSabziMandi ? t('sabzi_mandi_customers_list') : t('dana_mandi_customers_list')}
            </h5>
            {(isAdminViewing || (isAdmin && isViewingAsAdmin)) && (
              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-950/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                {t('admin_view')}
              </span>
            )}
          </div>
          <div className="relative w-full sm:w-64 md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#070e17] border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              placeholder={t('search_by_cnic_phone_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-20 py-10">
            <span className="animate-[spin_2s_linear_infinite] border-8 border-slate-800 border-l-emerald-500 border-r-emerald-500 rounded-full w-14 h-14 inline-block align-middle m-auto"></span>
          </div>
        ) : (
          <div className="datatables px-4 pb-3 [&_.mantine-datatable-footer]:px-2 [&_.mantine-datatable-footer]:mt-2">
            <DataTable
              highlightOnHover
              className="whitespace-nowrap table-hover !bg-transparent !text-slate-200
                [&_table]:!bg-transparent
                [&_thead]:!bg-[#081320]
                [&_thead_th]:!text-slate-400 [&_thead_th]:!text-[11px] [&_thead_th]:!font-semibold [&_thead_th]:!uppercase [&_thead_th]:!tracking-wider [&_thead_th]:!border-slate-800
                [&_tbody_tr]:!border-slate-800/70 [&_tbody_tr]:!bg-transparent
                [&_tbody_tr:hover]:!bg-slate-800/40
                [&_.mantine-Pagination-root]:!text-slate-400
                [&_select]:!bg-[#070e17] [&_select]:!border-slate-700/80 [&_select]:!text-slate-300"
              records={recordsData}
              columns={[
                {
                  accessor: "name",
                  title: t('name'),
                  render: (customer) => (
                    <span className="text-slate-300">{`${customer.cusNameF} ${customer.cusNameL}`}</span>
                  ),
                },
                {
                  accessor: "cusCNIC",
                  title: t('cnic'),
                  render: (customer) => <span className="text-slate-300">{customer.cusCNIC}</span>,
                },
                {
                  accessor: "cusNumber",
                  title: t('phone'),
                  render: (customer) => <span className="text-slate-300">{customer.cusNumber}</span>,
                },
                {
                  accessor: "action",
                  title: t('action'),
                  render: (customer) => (
                    <button
                      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all"
                      onClick={() =>
                        navigate(
                          `/scrop-customer-list/${shopId}/${cropId}/${customer._id}`
                        )
                      }
                    >
                      <FaEye className="w-3.5 h-3.5" />
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
              paginationText={({ from, to, totalRecords }) =>
                t('pagination_showing', { from, to, totalRecords })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DanaMandiCustomerList;
