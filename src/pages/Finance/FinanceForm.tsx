import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { ServerSetting } from "../../helperComponents/ServerSetting";
import { useAuthToken } from "../../Hooks/useAuthToken";
import { useShopId } from "../../Hooks/useShopId";
import { useShopIdFromUrl } from "../../Hooks/useShopIdFromUrl";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setPageTitle } from "../../store/themeConfigSlice";
import FormField from "../../components/Agricultural/FormField";
import { showError, showSuccess, showLoading, closeAlert, confirmCreate, confirmUpdate } from "../../utils/sweetAlert";
import IconArrowLeft from "../../components/Icon/IconArrowLeft";
import IconUser from "../../components/Icon/IconUser";
import IconCashBanknotes from "../../components/Icon/IconCashBanknotes";
import IconNotes from "../../components/Icon/IconNotes";
import IconCreditCard from "../../components/Icon/IconCreditCard";
import IconPhone from "../../components/Icon/IconPhone";
import IconMapPin from "../../components/Icon/IconMapPin";
import IconTrendingUp from "../../components/Icon/IconTrendingUp";
// IconTrendingDown may not exist, using IconTrendingUp with rotation or alternative

interface FinanceForm {
  finaceUserId: string;
  finaceShopId: string;
  finaceCusId: string;
  finaceCropId: string;
  finaceType: number | string;
  finaceRemarks: string;
  loanAmount: number | string;
  loanPaidAmount: number | string;
  finaceStatus: number;
  paymentStatus?: number | string;
}

interface CustomerBalance {
  cusBlane: number; // Customer balance (positive = customer owes, negative = shop owes)
  blance: number; // Shop balance
}

const AddFinance: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { token, user } = useAuthToken();
  const navigate = useNavigate();
  const { shopId: urlShopId } = useShopIdFromUrl();
  const { shopId: userShopIdFromHook } = useShopId();
  const { userId, cropId } = useParams<{ userId: string; cropId: string }>();
  const [searchParams] = useSearchParams();
  const editLoanId = searchParams.get('edit');
  const isEditMode = !!editLoanId;

  useEffect(() => {
    dispatch(setPageTitle(isEditMode ? t('finance_edit_loan_title') : t('finance_give_loan_title')));
  }, [dispatch, isEditMode, t]);

  // Get shopId from URL (admin view), user object, or useShopId hook
  const userShopId = urlShopId || (user as any)?.shopId || userShopIdFromHook;

  const [formData, setFormData] = useState<FinanceForm>({
    finaceUserId: userId || "",
    finaceShopId: userShopId || "",
    finaceCusId: "",
    finaceCropId: cropId || "",
    finaceType: "",
    finaceRemarks: "",
    loanAmount: "",
    loanPaidAmount: "",
    finaceStatus: 0,
    paymentStatus: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FinanceForm, string>>>({});
  const [loading, setLoading] = useState(false);
  const [cnic, setCnic] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [customerBalance, setCustomerBalance] = useState<CustomerBalance | null>(null);
  const [checkingCustomer, setCheckingCustomer] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  // POS products (shop owner): connected POS users, selected user's products, quantities
  const [connectedPosUsers, setConnectedPosUsers] = useState<{ posUserId: string; name: string; shopName: string }[]>([]);
  const [selectedPosUserId, setSelectedPosUserId] = useState<string>("");
  const [posProducts, setPosProducts] = useState<any[]>([]);
  const [posQuantities, setPosQuantities] = useState<Record<string, number>>({});
  const [loadingPosUsers, setLoadingPosUsers] = useState(false);
  const [loadingPosProducts, setLoadingPosProducts] = useState(false);
  const [posProductsError, setPosProductsError] = useState<string | null>(null);
  const [posProductSearch, setPosProductSearch] = useState("");

  const draftStorageKey = useMemo(() => {
    if (isEditMode || !userId || !cropId || !userShopId) return null;
    return `finance_pos_draft_v1_${userId}_${cropId}_${userShopId}`;
  }, [isEditMode, userId, cropId, userShopId]);

  const clearPosDraft = useCallback(() => {
    if (draftStorageKey) {
      try {
        localStorage.removeItem(draftStorageKey);
      } catch {
        /* ignore */
      }
    }
    setSelectedPosUserId("");
    setPosQuantities({});
    setPosProductSearch("");
  }, [draftStorageKey]);

  const loadPosDraft = useCallback(() => {
    if (!draftStorageKey) return;
    try {
      const raw = localStorage.getItem(draftStorageKey);
      if (!raw) {
        showError(t('finance_no_saved_draft'));
        return;
      }
      const d = JSON.parse(raw) as { version?: number; selectedPosUserId?: string; posQuantities?: Record<string, number>; finaceRemarks?: string };
      if (d.version !== 1 || !d.selectedPosUserId) {
        showError(t('finance_no_valid_draft'));
        return;
      }
      setSelectedPosUserId(d.selectedPosUserId);
      setPosQuantities(d.posQuantities && typeof d.posQuantities === "object" ? d.posQuantities : {});
      if (d.finaceRemarks) setFormData((prev) => ({ ...prev, finaceRemarks: d.finaceRemarks || prev.finaceRemarks }));
      showSuccess(t("finance_pos_draft_restored"));
    } catch {
      showError(t('finance_could_not_load_draft'));
    }
  }, [draftStorageKey, t]);

  useEffect(() => {
    if (userShopId) {
      setFormData(prev => ({ ...prev, finaceShopId: userShopId }));
    }
  }, [userShopId]);

  // Fetch connected POS users (for "Products from POS" section)
  useEffect(() => {
    if (!token) return;
    setLoadingPosUsers(true);
    axios.get(`${ServerSetting.apiUrl}/shop-owner-pos/connected-pos-users`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
      .then((r) => { if (r.data?.data) setConnectedPosUsers(r.data.data); })
      .catch(() => {})
      .finally(() => setLoadingPosUsers(false));
  }, [token]);

  // When POS user selected, fetch their products
  useEffect(() => {
    if (!token || !selectedPosUserId) {
      setPosProducts([]);
      setPosQuantities({});
      setPosProductsError(null);
      setPosProductSearch("");
      return;
    }
    setPosProductSearch("");
    setLoadingPosProducts(true);
    setPosProductsError(null);
    const posId = typeof selectedPosUserId === 'string' ? selectedPosUserId : (selectedPosUserId as any)?._id ?? String(selectedPosUserId);
    axios.get(`${ServerSetting.apiUrl}/shop-owner-pos/pos-user/${posId}/products`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
      .then((r) => {
        if (r.status === 200 && Array.isArray(r.data?.data)) {
          setPosProducts(r.data.data);
          setPosProductsError(null);
        } else {
          setPosProducts([]);
          setPosProductsError(r.data?.message || t('finance_no_products_in_shop'));
        }
        setPosQuantities({});
      })
      .catch((e) => {
        setPosProducts([]);
        setPosProductsError(e.response?.data?.message || t('finance_no_products_in_shop'));
      })
      .finally(() => setLoadingPosProducts(false));
  }, [token, selectedPosUserId, t]);

  useEffect(() => {
    if (!draftStorageKey || isEditMode || formData.finaceType !== "3" || !customer) return;
    const tmr = window.setTimeout(() => {
      try {
        const id = typeof selectedPosUserId === "string" ? selectedPosUserId : (selectedPosUserId as any)?._id ?? "";
        localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            version: 1,
            selectedPosUserId: id,
            posQuantities,
            finaceRemarks: formData.finaceRemarks,
          })
        );
      } catch {
        /* ignore */
      }
    }, 900);
    return () => window.clearTimeout(tmr);
  }, [draftStorageKey, isEditMode, formData.finaceType, formData.finaceRemarks, customer, selectedPosUserId, posQuantities]);

  const posProductsFiltered = useMemo(() => {
    const q = posProductSearch.trim().toLowerCase();
    if (!q) return posProducts;
    return posProducts.filter((p) => String(p.name || "").toLowerCase().includes(q));
  }, [posProducts, posProductSearch]);

  // Fetch loan data when in edit mode
  useEffect(() => {
    if (isEditMode && editLoanId && token) {
      fetchLoanData(editLoanId);
    }
  }, [isEditMode, editLoanId, token]);

  // Fetch loan data for editing
  const fetchLoanData = async (loanId: string) => {
    showLoading(t('finance_loading_loan_data'));
    try {
      const response = await axios.get(
        `${ServerSetting.serUrl}/api/viewfinace/${loanId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        }
      );

      closeAlert();
      if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
        const loanData = response.data.data[0];
        
        // Populate form with loan data
        setFormData({
          finaceUserId: loanData.finaceUserId?._id || loanData.finaceUserId || userId || "",
          finaceShopId: loanData.finaceShopId?._id || loanData.finaceShopId || userShopId || "",
          finaceCusId: loanData.finaceCusId?._id || loanData.finaceCusId || "",
          finaceCropId: loanData.finaceCropId?._id || loanData.finaceCropId || cropId || "",
          finaceType: loanData.finaceType?.toString() || "",
          finaceRemarks: loanData.finaceRemarks || "",
          loanAmount: loanData.loanAmount?.toString() || "",
          loanPaidAmount: loanData.loanPaidAmount?.toString() || "",
          finaceStatus: loanData.finaceStatus || 0,
        });

        // Set customer data if available
        if (loanData.finaceCusId) {
          const customerData = typeof loanData.finaceCusId === 'object' 
            ? loanData.finaceCusId 
            : null;
          
          if (customerData) {
            setCustomer(customerData);
            setCnic(customerData.cusCNIC?.toString() || "");
            // Fetch customer balance
            await fetchCustomerBalance(customerData._id || loanData.finaceCusId);
          } else {
            // If customer is just an ID, we need to fetch it
            // For now, we'll try to get it from the shop's customer list
            if (userShopId) {
              try {
                const shopCustomersResponse = await axios.post(
                  `${ServerSetting.serUrl}/api/allviewcusshop`,
                  { shopId: userShopId },
                  {
                    headers: { Authorization: `Bearer ${token}` },
                    validateStatus: () => true,
                  }
                );
                if (shopCustomersResponse.data.status === 200) {
                  const shopCustomers = shopCustomersResponse.data.data || [];
                  const foundCustomer = shopCustomers.find(
                    (cus: any) => cus._id === loanData.finaceCusId
                  );
                  if (foundCustomer) {
                    setCustomer(foundCustomer);
                    setCnic(foundCustomer.cusCNIC?.toString() || "");
                    await fetchCustomerBalance(foundCustomer._id);
                  }
                }
              } catch (err) {
                console.error("Error fetching customer:", err);
              }
            }
          }
        }

        showSuccess(t('finance_loan_loaded_success'));
      } else {
        showError(t('finance_loan_not_found'), t('finance_error_generic'));
        navigate(-1);
      }
    } catch (error: any) {
      console.error("Error fetching loan data:", error);
      closeAlert();
      showError(
        error.response?.data?.message || t('finance_load_loan_failed'),
        t('finance_error_generic')
      );
      navigate(-1);
    }
  };

  // ✅ Search Customer by CNIC - Check if customer exists in shop owner's shop
  const handleCnicBlur = async () => {
    if (!cnic || !cnic.trim()) return;
    
    if (!userShopId) {
      showError(t('finance_shop_id_missing'));
      return;
    }

    setCheckingCustomer(true);
    try {
      // First, get all customers for this shop
      const shopCustomersResponse = await axios.post(
        `${ServerSetting.serUrl}/api/allviewcusshop`,
        { shopId: userShopId },
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        }
      );

      if (shopCustomersResponse.data.status === 200) {
        const shopCustomers = shopCustomersResponse.data.data || [];
        
        // Find customer by CNIC in shop's customers
        const foundCustomer = shopCustomers.find(
          (cus: any) => cus.cusCNIC?.toString().trim() === cnic.trim()
        );

        if (foundCustomer) {
          // Check if customer is active (not deleted)
          if (foundCustomer.cusStatus === 1) {
            setCustomer(null);
            setCustomerBalance(null);
            setFormData((prev) => ({ ...prev, finaceCusId: "" }));
            showError(
              t('finance_customer_deleted'),
              t('finance_customer_not_available')
            );
          } else {
            setCustomer(foundCustomer);
            setFormData((prev) => ({ ...prev, finaceCusId: foundCustomer._id }));
            showSuccess(t('finance_customer_found'));
            
            // Fetch customer balance
            await fetchCustomerBalance(foundCustomer._id);
          }
        } else {
          setCustomer(null);
          setCustomerBalance(null);
          setFormData((prev) => ({ ...prev, finaceCusId: "" }));
          showError(
            t('finance_customer_cnic_not_found'),
            t('finance_customer_not_found')
          );
        }
      } else {
        setCustomer(null);
        setCustomerBalance(null);
        setFormData((prev) => ({ ...prev, finaceCusId: "" }));
        showError(shopCustomersResponse.data.message || t('finance_error_fetching_shop_customers'));
      }
    } catch (error: any) {
      console.error("Error checking customer:", error);
      setCustomer(null);
      setCustomerBalance(null);
      setFormData((prev) => ({ ...prev, finaceCusId: "" }));
      showError(
        error.response?.data?.message || t('finance_error_checking_customer')
      );
    } finally {
      setCheckingCustomer(false);
    }
  };

  // Fetch customer balance
  const fetchCustomerBalance = async (customerId: string) => {
    if (!userShopId || !customerId) return;

    setLoadingBalance(true);
    try {
      const response = await axios.post(
        `${ServerSetting.serUrl}/api/getblance`,
        {
          shopId: userShopId,
          cusId: customerId
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        }
      );

      if (response.data.success && response.data.data?.length > 0) {
        const balanceData = response.data.data[0];
        setCustomerBalance({
          cusBlane: balanceData.cusBlane || 0,
          blance: balanceData.blance || 0
        });
      } else {
        // No balance record found - customer has no balance yet
        setCustomerBalance({
          cusBlane: 0,
          blance: 0
        });
      }
    } catch (error: any) {
      console.error("Error fetching customer balance:", error);
      // Set default balance on error
      setCustomerBalance({
        cusBlane: 0,
        blance: 0
      });
    } finally {
      setLoadingBalance(false);
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  // Validate form fields
  const validate = () => {
    const newErrors: Partial<Record<keyof FinanceForm, string>> = {};
    
    if (!formData.finaceUserId) newErrors.finaceUserId = t('finance_validation_user_id');
    if (!formData.finaceShopId) newErrors.finaceShopId = t('finance_validation_shop_id');
    if (!formData.finaceCusId) newErrors.finaceCusId = t('finance_validation_customer');
    if (!formData.finaceCropId) newErrors.finaceCropId = t('finance_validation_crop_id');
    if (!formData.finaceType) newErrors.finaceType = t('finance_validation_type');
    if (!formData.finaceRemarks) newErrors.finaceRemarks = t('finance_validation_remarks');
    // Loan amount required only when NOT Medicine (3). For Medicine, amount is set when POS user delivers (sum of product prices).
    if (formData.finaceType !== "3" && !formData.loanAmount) newErrors.loanAmount = t('finance_validation_loan_amount');
    
    return newErrors;
  };

  // Submit handler
  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showError(t('finance_fill_required_fields'));
      return;
    }

    // Show confirmation dialog
    const confirmed = isEditMode 
      ? await confirmUpdate(t('finance_confirm_record_label'))
      : await confirmCreate(t('finance_confirm_record_label'));
    if (!confirmed) return;

    setLoading(true);
    setErrors({});
    showLoading(isEditMode ? t('finance_updating_loading') : t('finance_creating_loading'));

    try {
      const url = isEditMode 
        ? `${ServerSetting.serUrl}/api/editfinace`
        : `${ServerSetting.serUrl}/api/addfinace`;
      
      const requestData = isEditMode
        ? { ...formData, _id: editLoanId, paymentStatus: Number(formData.paymentStatus ?? 0) }
        : { ...formData, paymentStatus: Number(formData.paymentStatus ?? 0) };

      const method = isEditMode ? 'patch' : 'post';
      
      const response = await axios[method](
        url,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 200) {
        const raw = response.data?.data;
        const createdFinanceId = raw?._id ?? raw?.id ?? response.data?._id;
        const financeIdStr = createdFinanceId != null ? String(createdFinanceId) : null;
        // Medicine (POS): if POS user and products selected, create POS request linked to this loan (same flow, no separate button)
        if (!isEditMode && formData.finaceType === "3" && financeIdStr && selectedPosUserId && customer) {
          const posId = typeof selectedPosUserId === 'string' ? selectedPosUserId : (selectedPosUserId as any)?._id ?? String(selectedPosUserId);
          const items = posProducts
            .map((p) => ({ productId: p._id, quantity: Number(posQuantities[p._id]) || 0 }))
            .filter((i) => i.quantity > 0);
          if (items.length > 0) {
            try {
              const posRes = await axios.post(
                `${ServerSetting.apiUrl}/shop-owner-pos/request`,
                {
                  posUserId: posId,
                  customerId: customer._id,
                  shopId: formData.finaceShopId,
                  finaceId: financeIdStr,
                  items,
                },
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
              );
              if (posRes.data.status === 201) {
                closeAlert();
                showSuccess(t('finance_pos_created_notified'));
              } else {
                closeAlert();
                showSuccess(t('finance_pos_request_failed_later'));
              }
            } catch (e: any) {
              closeAlert();
              showSuccess(t('finance_pos_request_error_later'));
            }
          } else {
            closeAlert();
            showSuccess(response.data.message || t('finance_created_success'));
          }
        } else {
          closeAlert();
          showSuccess(response.data.message || (isEditMode ? t('finance_updated_success') : t('finance_created_success')));
        }
        if (!isEditMode && draftStorageKey) {
          try {
            localStorage.removeItem(draftStorageKey);
          } catch {
            /* ignore */
          }
        }
        setTimeout(() => {
          if (isEditMode) {
            navigate(`/loan/${userId}/${cropId}`);
          } else {
            navigate(`/loan/${userId}/${cropId}`);
          }
        }, 1500);
      } else {
        closeAlert();
        showError(response.data.message || (isEditMode ? t('finance_update_failed') : t('finance_create_failed')));
      }
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} loan:`, error);
      closeAlert();
      showError(
        error.response?.data?.message || (isEditMode ? t('finance_update_failed_retry') : t('finance_create_failed_retry'))
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate remaining balance after new loan
  const calculateNewBalance = () => {
    if (!customerBalance) return 0;
    const loanAmount = parseFloat(formData.loanAmount as string) || 0;
    const paidAmount = parseFloat(formData.loanPaidAmount as string) || 0;
    const financeType = parseInt(formData.finaceType as string);
    
    // Current net balance
    const currentNet = (customerBalance.cusBlane || 0) - (customerBalance.blance || 0);
    
    // Calculate balance change based on transaction type
    let balanceChange = 0;
    if (financeType === 0) { // Loan Given - increases customer's debt
      balanceChange = loanAmount - paidAmount;
    } else if (financeType === 1) { // Loan Returned - decreases customer's debt
      balanceChange = -(loanAmount - paidAmount);
    } else if (financeType === 2) { // Payment - decreases customer's debt
      balanceChange = -paidAmount;
    } else if (financeType === 3) { // Medicine (POS) - treat like loan given for balance
      balanceChange = loanAmount - paidAmount;
    }
    
    // Return projected net balance
    return currentNet + balanceChange;
  };

  const posTotal = posProducts.reduce((sum, p) => sum + ((Number(posQuantities[p._id]) || 0) * (Number(p.price) || 0)), 0);

  return (
    <div>
      {/* Back button - top right, outside card */}
      <div className="flex justify-end mb-4">
        <Link
          to={isEditMode ? `/loan/${userId}/${cropId}` : "/finance"}
                        className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
        >
          <span>←</span> {isEditMode ? t('finance_back_to_loan_list') : t('finance_back_to_finance')}
        </Link>
      </div>

      {/* Form Card */}
      <div className="panel shadow-md dark:shadow-none">
        {/* CNIC Search Section */}
        {!isEditMode && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-blue-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <IconCreditCard className="w-5 h-5 mr-2 text-primary-600" />
              {t('finance_search_by_cnic_title')}
            </h3>
            <FormField
              label={t('finance_customer_cnic_label')}
              name="cnic"
              type="text"
              value={cnic}
              onChange={(e) => {
                setCnic(e.target.value.replace(/\D/g, "").slice(0, 13));
                if (customer) {
                  setCustomer(null);
                  setCustomerBalance(null);
                  setFormData(prev => ({ ...prev, finaceCusId: "" }));
                }
              }}
              onBlur={handleCnicBlur}
              placeholder={t('finance_cnic_placeholder')}
              icon={<IconCreditCard className="w-5 h-5" />}
              helpText={t('finance_cnic_help_text')}
              disabled={checkingCustomer || loading}
            />
            {checkingCustomer && (
              <div className="mt-2 text-sm text-primary-600 flex items-center">
                <span className="animate-spin border-2 border-primary-600 border-t-transparent rounded-full w-4 h-4 inline-block mr-2"></span>
                {t('finance_checking_customer')}
              </div>
            )}
          </div>
        )}

        {/* Customer Info Card */}
        {customer && (
          <div className="mb-8">
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-green-200 dark:border-gray-600 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <IconUser className="w-5 h-5 mr-2 text-green-600" />
                {t('finance_customer_info_title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <IconUser className="w-5 h-5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">{t('finance_field_name')}</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {customer.cusNameF} {customer.cusNameL}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <IconCreditCard className="w-5 h-5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">{t('finance_field_cnic')}</p>
                    <p className="font-semibold text-gray-800 dark:text-white font-mono">
                      {customer.cusCNIC}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <IconPhone className="w-5 h-5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">{t('finance_field_phone')}</p>
                    <p className="font-semibold text-gray-800 dark:text-white font-mono">
                      {customer.cusNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <IconMapPin className="w-5 h-5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">{t('finance_field_address')}</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {customer.cusAddress}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Balance Card */}
            {loadingBalance ? (
              <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-yellow-200 dark:border-gray-600">
                <div className="flex items-center justify-center">
                  <span className="animate-spin border-2 border-yellow-600 border-t-transparent rounded-full w-5 h-5 inline-block mr-2"></span>
                  <span className="text-gray-600 dark:text-gray-300">{t('finance_loading_balance')}</span>
                </div>
              </div>
            ) : customerBalance !== null && (
              <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-yellow-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                  <IconCashBanknotes className="w-5 h-5 mr-2 text-yellow-600" />
                  {t('finance_customer_balance_title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Customer Owes to Shop */}
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('finance_customer_owes_shop')}</p>
                    <p className="text-2xl font-bold flex items-center text-red-600 dark:text-red-400">
                      <IconTrendingUp className="w-6 h-6 inline-block mr-1" />
                      Rs. {(customerBalance.cusBlane || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('finance_customer_owes_note')}
                    </p>
                  </div>
                  
                  {/* Shop Owes to Customer */}
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-green-200 dark:border-green-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('finance_shop_owes_customer')}</p>
                    <p className="text-2xl font-bold flex items-center text-green-600 dark:text-green-400">
                      <IconTrendingUp className="w-6 h-6 inline-block mr-1 rotate-180" />
                      Rs. {(customerBalance.blance || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('finance_shop_owes_note')}
                    </p>
                  </div>
                  
                  {/* Net Balance */}
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('finance_net_balance')}</p>
                    {(() => {
                      const netBalance = (customerBalance.cusBlane || 0) - (customerBalance.blance || 0);
                      return (
                        <>
                          <p className={`text-2xl font-bold flex items-center ${netBalance >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {netBalance >= 0 ? (
                              <>
                                <IconTrendingUp className="w-6 h-6 inline-block mr-1" />
                                Rs. {Math.abs(netBalance).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </>
                            ) : (
                              <>
                                <IconTrendingUp className="w-6 h-6 inline-block mr-1 rotate-180" />
                                Rs. {Math.abs(netBalance).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {netBalance >= 0 ? t('finance_net_customer_owes') : t('finance_net_shop_owes')}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                {/* After This Transaction Projection */}
                {formData.loanAmount && formData.finaceType !== '' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('finance_after_transaction')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{t('finance_transaction_amount')}</p>
                        <p className="text-lg font-semibold text-gray-800 dark:text-white">
                          Rs. {parseFloat(formData.loanAmount as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{t('finance_projected_net_balance')}</p>
                        {(() => {
                          const projectedNet = calculateNewBalance();
                          return (
                            <p className={`text-lg font-bold ${projectedNet >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {projectedNet >= 0 ? (
                                <>
                                  <IconTrendingUp className="w-5 h-5 inline-block mr-1" />
                                  Rs. {Math.abs(projectedNet).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </>
                              ) : (
                                <>
                                  <IconTrendingUp className="w-5 h-5 inline-block mr-1 rotate-180" />
                                  Rs. {Math.abs(projectedNet).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </>
                              )}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>{t('finance_note_label')}</strong> 
                    <br />• <strong>{t('finance_note_cus_blane')}</strong>
                    <br />• <strong>{t('finance_note_blance')}</strong>
                    <br />• <strong>{t('finance_note_net')}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loan Details Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
            <IconCashBanknotes className="w-5 h-5 mr-2 text-primary-600" />
            {t('finance_loan_details_title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label={t('finance_loan_amount_label')}
              name="loanAmount"
              type="number"
              value={formData.loanAmount}
              onChange={handleChange}
              error={errors.loanAmount}
              placeholder={formData.finaceType === "3" ? t('finance_loan_amount_placeholder_pos') : t('finance_loan_amount_placeholder')}
              required={formData.finaceType !== "3"}
              icon={<IconCashBanknotes className="w-5 h-5" />}
              disabled={loading || !customer}
            />

            <FormField
              label={t('finance_paid_amount_label')}
              name="loanPaidAmount"
              type="number"
              value={formData.loanPaidAmount}
              onChange={handleChange}
              error={errors.loanPaidAmount}
              placeholder={t('finance_paid_amount_placeholder')}
              icon={<IconCashBanknotes className="w-5 h-5" />}
              helpText={t('finance_paid_amount_help')}
              disabled={loading || !customer}
            />

            <FormField
              label={t('finance_type_label')}
              name="finaceType"
              type="select"
              value={formData.finaceType}
              onChange={(e) => {
                const v = e.target.value;
                handleChange(e);
                if (v !== "3") {
                  setSelectedPosUserId("");
                  setPosQuantities({});
                }
              }}
              error={errors.finaceType}
              required
              disabled={loading || !customer}
              options={[
                { value: "0", label: t('finance_type_loan_given') },
                { value: "1", label: t('finance_type_loan_returned') },
                { value: "2", label: t('finance_type_payment') },
                { value: "3", label: t('finance_type_medicine') },
              ]}
            />

            <FormField
              label={t('finance_status_label')}
              name="paymentStatus"
              type="select"
              value={formData.paymentStatus !== undefined && formData.paymentStatus !== null ? String(formData.paymentStatus) : "0"}
              onChange={handleChange}
              disabled={loading || !customer}
              options={[
                { value: "0", label: t('finance_status_given') },
                { value: "1", label: t('finance_status_partial') },
                { value: "2", label: t('finance_status_full') },
              ]}
            />

            <div className="md:col-span-2">
              <FormField
                label={t('finance_remarks_label')}
                name="finaceRemarks"
                type="textarea"
                value={formData.finaceRemarks}
                onChange={handleChange}
                error={errors.finaceRemarks}
                placeholder={t('finance_remarks_placeholder')}
                required
                icon={<IconNotes className="w-5 h-5" />}
                disabled={loading || !customer}
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Medicine (POS products) – show only when Finance Type = Medicine */}
        {customer && formData.finaceShopId && formData.finaceType === "3" && (
          <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 flex items-center">
              <IconCashBanknotes className="w-5 h-5 mr-2 text-emerald-600" />
              {t('finance_medicine_pos_title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {t('finance_medicine_pos_desc')}
            </p>
            {draftStorageKey && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button type="button" onClick={loadPosDraft} className="btn btn-outline-primary text-xs py-1.5 px-3 rounded-lg">
                  {t("finance_pos_draft_load")}
                </button>
                <button type="button" onClick={clearPosDraft} className="btn btn-outline-secondary text-xs py-1.5 px-3 rounded-lg">
                  {t("finance_pos_draft_clear")}
                </button>
              </div>
            )}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold mr-2">1</span>
                  {t('finance_select_pos_user_title')}
                </label>
                <select
                  value={typeof selectedPosUserId === 'string' ? selectedPosUserId : (selectedPosUserId as any)?._id ?? ''}
                  onChange={(e) => setSelectedPosUserId(e.target.value)}
                  className="form-select w-full max-w-md rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                  disabled={loadingPosUsers}
                >
                  <option value="">{t('finance_select_pos_placeholder')}</option>
                  {connectedPosUsers.map((u) => {
                    const id = typeof u.posUserId === 'object' && u.posUserId !== null ? (u.posUserId as any)._id?.toString?.() ?? '' : String(u.posUserId ?? '');
                    return <option key={id || u.shopName} value={id}>{u.name} — {u.shopName}</option>;
                  })}
                </select>
                {loadingPosUsers && <p className="text-xs text-gray-500 mt-1">{t('finance_loading_products')}</p>}
                {!loadingPosUsers && connectedPosUsers.length === 0 && (
                  <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">{t('finance_no_connected_pos_users')}</p>
                )}
              </div>
              {selectedPosUserId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold mr-2">2</span>
                    {t('finance_select_products_title')}
                  </label>
                  {loadingPosProducts ? (
                    <div className="flex items-center gap-2 text-gray-500 py-4">
                      <span className="animate-spin border-2 border-emerald-500 border-t-transparent rounded-full w-5 h-5 inline-block" />
                      {t('finance_loading_products')}
                    </div>
                  ) : posProductsError ? (
                    <div className="py-4 rounded-lg bg-danger/10 text-danger px-4 text-sm">{posProductsError}</div>
                  ) : posProducts.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 py-4 rounded-lg bg-white/50 dark:bg-black/20 px-4">{t('finance_no_products_in_shop')}</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-900/50">
                      <div className="p-3 border-b border-emerald-200 dark:border-emerald-800">
                        <input
                          type="search"
                          value={posProductSearch}
                          onChange={(e) => setPosProductSearch(e.target.value)}
                          placeholder={t("finance_pos_search_products")}
                          className="form-input w-full max-w-md rounded-lg text-sm"
                        />
                      </div>
                      <table className="table-auto w-full text-sm">
                        <thead>
                          <tr className="bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t('finance_table_product')}</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t('finance_table_price')}</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-28">{t('finance_table_qty')}</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t('finance_table_line_total')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {posProductsFiltered.map((p) => {
                            const qty = Number(posQuantities[p._id]) || 0;
                            const lineTotal = qty * (Number(p.price) || 0);
                            return (
                              <tr key={p._id} className="border-b border-white-dark/5 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10">
                                <td className="py-3 px-4 font-medium text-gray-800 dark:text-white">{p.name}</td>
                                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{(Number(p.price) || 0).toLocaleString()}</td>
                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    min={0}
                                    max={p.stock ?? 999}
                                    value={qty || ""}
                                    onChange={(e) => setPosQuantities((prev) => ({ ...prev, [p._id]: Math.max(0, Number(e.target.value) || 0) }))}
                                    className="form-input w-full rounded-lg py-1.5 border-gray-300 dark:border-gray-600"
                                  />
                                </td>
                                <td className="py-3 px-4 text-right font-medium">{lineTotal > 0 ? lineTotal.toLocaleString() : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="flex flex-wrap justify-between items-center gap-4 p-4 border-t border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{t('finance_total_label')} {posTotal.toLocaleString()}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('finance_pos_footer_note')}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link
            to={isEditMode ? `/loan/${userId}/${cropId}` : "/finance"}
            className="btn btn-outline-primary"
          >
            {t('finance_cancel_btn')}
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || checkingCustomer || !customer}
            className={`btn btn-primary ${loading || checkingCustomer || !customer ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5 inline-block mr-2"></span>
                {isEditMode ? t('finance_updating_btn') : t('finance_creating_btn')}
              </>
            ) : (
              <>
                <IconCashBanknotes className="w-5 h-5 mr-2" />
                {isEditMode ? t('finance_update_loan_btn') : t('finance_create_loan_btn')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFinance;