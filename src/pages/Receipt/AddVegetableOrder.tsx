import React, { useState, useEffect } from "react";
import axios from "axios";
import { ServerSetting } from "./../../helperComponents/ServerSetting";
import { useAuthToken } from "./../../Hooks/useAuthToken";
import { useShopId } from "./../../Hooks/useShopId";
import { useShopIdFromUrl } from "./../../Hooks/useShopIdFromUrl";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setPageTitle } from "./../../store/themeConfigSlice";
import FormField from "./../../components/Agricultural/FormField";
import { showError, showSuccess, showLoading, closeAlert, confirmCreate } from "../../utils/sweetAlert";
import IconArrowLeft from "../../components/Icon/IconArrowLeft";
import PageHeader from "../../components/Agricultural/PageHeader";
import { useTranslation } from "react-i18next";
import IconCreditCard from "../../components/Icon/IconCreditCard";
import IconUser from "../../components/Icon/IconUser";
import IconPhone from "../../components/Icon/IconPhone";
import IconMapPin from "../../components/Icon/IconMapPin";
import IconCashBanknotes from "../../components/Icon/IconCashBanknotes";

interface VegetableOrderForm {
  vegetableOrderShopId: string;
  vegetableOrderUserId: string;
  vegetableOrderCusId: string;
  vegetableOrderCropId: string;
  vegetableOrderBapariId: string;
  pricePisce: number | string;
  totalPisces: number | string;
  RentDelivery: number | string;
  commissioneRate: number | string;
  commissioneTotal: number | string;
  mazdoriRate: number | string;
  mazdoriTotal: number | string;
  totalPrice: number | string;
  retrunPayment: number | string;
  afterRetrunPayemnt: number | string;
  piscesType: number | string;
  vegetableOrderMarket: number | string;
  vegetableOrderStatus: number | string;
}

const AddVegetableOrder: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { token, user } = useAuthToken();
  const navigate = useNavigate();
  const { shopId: urlShopId } = useShopIdFromUrl();
  const { shopId: userShopIdFromHook, error } = useShopId();
  const { userId, cropId } = useParams<{ userId: string; cropId: string }>();

  useEffect(() => {
    dispatch(setPageTitle('Add Sabzi Mandi Order'));
  }, [dispatch]);

  // Get shopId from URL (admin view), user object, or useShopId hook
  const userShopId = urlShopId || (user as any)?.shopId || userShopIdFromHook;

  const [formData, setFormData] = useState<VegetableOrderForm>({
    vegetableOrderShopId: userShopId || "",
    vegetableOrderUserId: userId || "",
    vegetableOrderCusId: "",
    vegetableOrderCropId: cropId || "",
    vegetableOrderBapariId: "",
    pricePisce: "",
    totalPisces: "",
    RentDelivery: "",
    commissioneRate: "",
    commissioneTotal: "",
    mazdoriRate: "",
    mazdoriTotal: "",
    totalPrice: "",
    retrunPayment: "",
    afterRetrunPayemnt: "",
    piscesType: 0,
    vegetableOrderMarket: 0,
    vegetableOrderStatus: 0
  });

  const [errors, setErrors] = useState<Partial<Record<keyof VegetableOrderForm, string>>>({});
  const [loading, setLoading] = useState(false);
  const [cnic, setCnic] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [checkingCustomer, setCheckingCustomer] = useState(false);
  const [customerBalance, setCustomerBalance] = useState<any>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    if (userShopId) {
      setFormData(prev => ({ ...prev, vegetableOrderShopId: userShopId }));
    }
  }, [userShopId]);

  // Search Customer by CNIC
  const handleCnicBlur = async () => {
    if (!cnic || !cnic.trim()) return;
    
    if (!userShopId) {
      showError('Shop ID is missing. Please ensure you have a shop assigned.');
      return;
    }

    setCheckingCustomer(true);
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
          (cus: any) => cus.cusCNIC?.toString().trim() === cnic.trim()
        );

        if (foundCustomer) {
          if (foundCustomer.cusStatus === 1) {
            setCustomer(null);
            setCustomerBalance(null);
            setFormData((prev) => ({ ...prev, vegetableOrderCusId: "" }));
            showError("This customer has been deleted. Please contact admin to restore.");
          } else {
            setCustomer(foundCustomer);
            setFormData((prev) => ({ ...prev, vegetableOrderCusId: foundCustomer._id }));
            showSuccess("Customer found successfully!");
            await fetchCustomerBalance(foundCustomer._id);
          }
        } else {
          setCustomer(null);
          setCustomerBalance(null);
          setFormData((prev) => ({ ...prev, vegetableOrderCusId: "" }));
          showError("Your shop has no customer registered with this CNIC number. Please register the customer first.");
        }
      } else {
        setCustomer(null);
        setCustomerBalance(null);
        setFormData((prev) => ({ ...prev, vegetableOrderCusId: "" }));
        showError(shopCustomersResponse.data.message || "Error fetching shop customers.");
      }
    } catch (error: any) {
      console.error("Error checking customer:", error);
      setCustomer(null);
      setCustomerBalance(null);
      setFormData((prev) => ({ ...prev, vegetableOrderCusId: "" }));
      showError(error.response?.data?.message || "Error checking customer. Please try again.");
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
        { shopId: userShopId, cusId: customerId },
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
        setCustomerBalance({ cusBlane: 0, blance: 0 });
      }
    } catch (error: any) {
      console.error("Error fetching customer balance:", error);
      setCustomerBalance({ cusBlane: 0, blance: 0 });
    } finally {
      setLoadingBalance(false);
    }
  };

  // Auto-calculations for Sabzi Mandi
  useEffect(() => {
    const pricePisce = parseFloat(formData.pricePisce as string) || 0;
    const totalPisces = parseFloat(formData.totalPisces as string) || 0;
    const baseTotal = pricePisce * totalPisces; // Base Total = Price per Piece × Total Pieces
    
    // Rent & Delivery is a real amount (subtracted from base)
    const rentDelivery = parseFloat(formData.RentDelivery as string) || 0;
    
    // Commission is calculated on base total and subtracted
    const commissionRate = parseFloat(formData.commissioneRate as string) || 0;
    const commissionTotal = (baseTotal / 100) * commissionRate;
    
    // Mazdoori is calculated on base total and subtracted
    const mazdoriRate = parseFloat(formData.mazdoriRate as string) || 0;
    const mazdoriTotal = (baseTotal / 100) * mazdoriRate;
    
    // Total Price = Base Total - Rent Delivery - Commission - Mazdoori
    const totalPrice = baseTotal - rentDelivery - commissionTotal - mazdoriTotal;
    const retrunPayment = parseFloat(formData.retrunPayment as string) || 0;
    const afterReturn = Math.max(0, totalPrice - retrunPayment);

    setFormData(prev => ({
      ...prev,
      totalPrice: totalPrice.toFixed(2),
      commissioneTotal: commissionTotal.toFixed(2),
      mazdoriTotal: mazdoriTotal.toFixed(2),
      afterRetrunPayemnt: afterReturn.toFixed(2)
    }));
  }, [
    formData.pricePisce,
    formData.totalPisces,
    formData.RentDelivery,
    formData.commissioneRate,
    formData.mazdoriRate,
    formData.retrunPayment
  ]);

  // Clear Return Payment when customer has no balance (field disabled)
  useEffect(() => {
    const shouldDisable = !customerBalance || (Number(customerBalance?.blance) || 0) <= 0;
    if (shouldDisable && (formData.retrunPayment !== "" && formData.retrunPayment !== undefined)) {
      setFormData(prev => ({ ...prev, retrunPayment: "", afterRetrunPayemnt: prev.totalPrice ?? "" }));
    }
  }, [customerBalance]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof VegetableOrderForm, string>> = {};
    
    if (!formData.vegetableOrderUserId) newErrors.vegetableOrderUserId = "User ID is required";
    if (!formData.vegetableOrderCusId) newErrors.vegetableOrderCusId = "Customer is required";
    if (!formData.vegetableOrderCropId) newErrors.vegetableOrderCropId = "Crop ID is required";
    if (!formData.vegetableOrderBapariId) newErrors.vegetableOrderBapariId = "Buyer Name is required";
    if (!formData.pricePisce) newErrors.pricePisce = "Price per piece is required";
    if (!formData.totalPisces) newErrors.totalPisces = "Total pieces is required";
    if (!formData.commissioneRate) newErrors.commissioneRate = "Commission rate is required";
    if (!formData.mazdoriRate) newErrors.mazdoriRate = "Mazdoori rate is required";
    
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showError("Please fill all required fields.");
      return;
    }

    const confirmed = await confirmCreate('this Sabzi Mandi order');
    if (!confirmed) return;

    setLoading(true);
    setErrors({});
    showLoading('Creating order...');

    const payload = {
      ...formData,
      retrunPayment: parseFloat(String(formData.retrunPayment)) || 0,
      afterRetrunPayemnt: parseFloat(String(formData.afterRetrunPayemnt)) || 0,
    };

    try {
      const response = await axios.post(
        `${ServerSetting.serUrl}/api/addvegetableorder`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 200) {
        closeAlert();
        showSuccess(response.data.message || "Order created successfully!");
        setTimeout(() => {
          navigate(`/crop-receipt-list/${userId}/${cropId}`);
        }, 1500);
      } else {
        closeAlert();
        showError(response.data.message || "Failed to create order.");
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      closeAlert();
      showError(
        error.response?.data?.message || "Failed to create order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header Section */}
      <PageHeader
        title={t('add_sabzi_mandi_order')}
        description="Create a new vegetable order receipt for your shop"
        backTo={userId && cropId ? `/cropmenu/${userId}/${cropId}` : '/getassginshopcrops'}
        backLabel={t('back_to_crop_menu')}
        icon="🥬"
      />

      {/* Form Card */}
      <div className="panel">
        {/* CNIC Search Section */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-blue-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <IconCreditCard className="w-5 h-5 mr-2 text-primary-600" />
            Search Customer by CNIC
          </h3>
          <FormField
            label="Customer CNIC"
            name="cnic"
            type="text"
            value={cnic}
            onChange={(e) => {
              setCnic(e.target.value.replace(/\D/g, "").slice(0, 13));
              if (customer) {
                setCustomer(null);
                setCustomerBalance(null);
                setFormData(prev => ({ ...prev, vegetableOrderCusId: "" }));
              }
            }}
            onBlur={handleCnicBlur}
            placeholder="Enter 13-digit CNIC number"
            icon={<IconCreditCard className="w-5 h-5" />}
            helpText="Enter customer CNIC to search in your shop's customers"
            disabled={checkingCustomer || loading}
          />
          {checkingCustomer && (
            <div className="mt-2 text-sm text-primary-600 flex items-center">
              <span className="animate-spin border-2 border-primary-600 border-t-transparent rounded-full w-4 h-4 inline-block mr-2"></span>
              Checking customer...
            </div>
          )}
        </div>

        {/* Customer Info Card */}
        {customer && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-green-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <IconUser className="w-5 h-5 mr-2 text-green-600" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <IconUser className="w-5 h-5 mr-2 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {customer.cusNameF} {customer.cusNameL}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <IconCreditCard className="w-5 h-5 mr-2 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">CNIC</p>
                  <p className="font-semibold text-gray-800 dark:text-white font-mono">
                    {customer.cusCNIC}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <IconPhone className="w-5 h-5 mr-2 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-semibold text-gray-800 dark:text-white font-mono">
                    {customer.cusNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <IconMapPin className="w-5 h-5 mr-2 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {customer.cusAddress}
                  </p>
                </div>
              </div>
            </div>
            {customerBalance && (
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border">
                <p className="text-sm text-gray-600 dark:text-gray-400">Customer Balance: <span className="font-semibold text-primary-600 dark:text-primary-400">Rs. {customerBalance.blance || 0}</span></p>
              </div>
            )}
          </div>
        )}

        {/* Order Details Section - Sabzi Mandi Specific */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
            <IconCashBanknotes className="w-5 h-5 mr-2 text-primary-600" />
            Sabzi Mandi Order Details
          </h3>
          
          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Sabzi Mandi orders use <strong>pieces</strong> instead of weight (Mann/Kg). Enter price per piece and total number of pieces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buyer Name Section */}
            <div className="md:col-span-2 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-purple-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Buyer Information</h4>
              <FormField
                label="Buyer Name"
                name="vegetableOrderBapariId"
                type="text"
                value={formData.vegetableOrderBapariId}
                onChange={handleChange}
                error={errors.vegetableOrderBapariId}
                placeholder="Enter buyer name"
                required
                icon={<IconUser className="w-5 h-5" />}
              />
            </div>

            {/* Price and Quantity Section */}
            <div className="md:col-span-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-green-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Price & Quantity</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Price per Piece (PKR)"
                  name="pricePisce"
                  type="number"
                  value={formData.pricePisce}
                  onChange={handleChange}
                  error={errors.pricePisce}
                  placeholder="e.g., 50"
                  required
                  icon={<IconCashBanknotes className="w-5 h-5" />}
                />

                <FormField
                  label="Total Pieces"
                  name="totalPisces"
                  type="number"
                  value={formData.totalPisces}
                  onChange={handleChange}
                  error={errors.totalPisces}
                  placeholder="e.g., 100"
                  required
                  icon={<IconCashBanknotes className="w-5 h-5" />}
                />
              </div>
              {formData.pricePisce && formData.totalPisces && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Base Total: <span className="font-semibold text-primary-600 dark:text-primary-400">
                      Rs. {(parseFloat(formData.pricePisce as string || '0') * parseFloat(formData.totalPisces as string || '0')).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Additional Charges */}
            <div className="md:col-span-2 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-yellow-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Additional Charges</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Rent & Delivery (PKR)"
                  name="RentDelivery"
                  type="number"
                  value={formData.RentDelivery}
                  onChange={handleChange}
                  error={errors.RentDelivery}
                  placeholder="Enter rent and delivery charges"
                  icon={<IconCashBanknotes className="w-5 h-5" />}
                />
              </div>
            </div>

            {/* Commission Section */}
            <div className="md:col-span-2 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-purple-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Commission</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Commission Rate (%)"
                  name="commissioneRate"
                  type="number"
                  step="0.01"
                  value={formData.commissioneRate}
                  onChange={handleChange}
                  error={errors.commissioneRate}
                  placeholder="e.g., 2.5"
                  required
                  icon={<IconCashBanknotes className="w-5 h-5" />}
                />

                <FormField
                  label="Commission Total (PKR)"
                  name="commissioneTotal"
                  type="number"
                  value={formData.commissioneTotal}
                  onChange={handleChange}
                  error={errors.commissioneTotal}
                  placeholder="Auto-calculated on base amount"
                  readOnly
                  icon={<IconCashBanknotes className="w-5 h-5" />}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Commission is calculated on base amount (Price × Pieces), not on total price
              </p>
            </div>

            {/* Mazdoori Section */}
            <div className="md:col-span-2 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-indigo-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Mazdoori (Labor Charges)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Mazdoori Rate (%)"
                  name="mazdoriRate"
                  type="number"
                  step="0.01"
                  value={formData.mazdoriRate}
                  onChange={handleChange}
                  error={errors.mazdoriRate}
                  placeholder="e.g., 1.5"
                  required
                  icon={<IconCashBanknotes className="w-5 h-5" />}
                />

                <FormField
                  label="Mazdoori Total (PKR)"
                  name="mazdoriTotal"
                  type="number"
                  value={formData.mazdoriTotal}
                  onChange={handleChange}
                  error={errors.mazdoriTotal}
                  placeholder="Auto-calculated on base amount"
                  readOnly
                  icon={<IconCashBanknotes className="w-5 h-5" />}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Mazdoori is calculated on base amount (Price × Pieces), not on total price
              </p>
            </div>

            {/* Total Price = Net (customer balance amount) */}
            <div className="md:col-span-2 p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border-2 border-primary-200 dark:border-primary-800">
              <FormField
                label="Net Total Price (PKR) — Customer balance mein add"
                name="totalPrice"
                type="number"
                value={formData.totalPrice}
                onChange={handleChange}
                error={errors.totalPrice}
                placeholder="Auto-calculated: Base - Rent - Commission - Mazdoori"
                readOnly
                icon={<IconCashBanknotes className="w-5 h-5" />}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                (Price × Pieces) - Rent - Commission - Mazdoori. Yeh amount customer ke balance / buyer list mein add hoti hai.
              </p>
            </div>

            {/* Return Payment - disabled when customer not selected or customer owes nothing (blance = 0) */}
            <div className="md:col-span-2 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-amber-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Return Payment</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Amount returned to customer. Allocates to their loan remaining (oldest first) and marks loans complete when fully paid. <span className="text-amber-600 dark:text-amber-400 font-medium">Return Payment sirf tab enable hota hai jab customer ka shop par balance ho (Customer Owes to Shop &gt; 0).</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Return Payment (PKR)"
                  name="retrunPayment"
                  type="number"
                  value={formData.retrunPayment}
                  onChange={handleChange}
                  error={errors.retrunPayment}
                  placeholder="e.g. 5000"
                  icon={<IconCashBanknotes className="w-5 h-5" />}
                  disabled={!customerBalance || (Number(customerBalance?.blance) || 0) <= 0}
                />
                <FormField
                  label="After Return Payment (PKR)"
                  name="afterRetrunPayemnt"
                  type="number"
                  value={formData.afterRetrunPayemnt}
                  onChange={handleChange}
                  error={errors.afterRetrunPayemnt}
                  placeholder="Auto-calculated"
                  readOnly
                  icon={<IconCashBanknotes className="w-5 h-5" />}
                  disabled={!customerBalance || (Number(customerBalance?.blance) || 0) <= 0}
                />
              </div>
            </div>

            {/* Order Type Settings */}
            <div className="md:col-span-2 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Order Type Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
                    Pieces Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <IconCashBanknotes className="w-5 h-5 text-gray-400" />
                    </div>
                    <select
                      name="piscesType"
                      value={formData.piscesType}
                      onChange={handleChange}
                      className={`form-select pl-10 ${errors.piscesType ? 'border-red-500' : ''}`}
                      required
                    >
                      <option value={0}>Standard</option>
                      <option value={1}>Special</option>
                    </select>
                  </div>
                  {errors.piscesType && (
                    <p className="text-red-500 text-sm mt-1">{errors.piscesType}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
                    Market Type
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <IconCashBanknotes className="w-5 h-5 text-gray-400" />
                    </div>
                    <select
                      name="vegetableOrderMarket"
                      value={formData.vegetableOrderMarket}
                      onChange={handleChange}
                      className="form-select pl-10"
                    >
                      <option value={0}>Local Market</option>
                      <option value={1}>Export Market</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        {(formData.pricePisce && formData.totalPisces) && (
          <div className="mb-8 p-6 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border-2 border-primary-200 dark:border-primary-800">
            <h3 className="text-xl font-bold text-primary-700 dark:text-primary-400 mb-4 flex items-center">
              <IconCashBanknotes className="w-6 h-6 mr-2" />
              Payment Summary
            </h3>
            <div className="space-y-2">
              {/* Amount from buyer (gross) */}
              <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border">
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Amount from buyer (Price × Pieces)</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Yeh amount buyer se leni hoti hai (order total)</p>
                </div>
                <span className="font-semibold text-gray-800 dark:text-white">
                  Rs. {(parseFloat(formData.pricePisce as string || '0') * parseFloat(formData.totalPisces as string || '0')).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              
              {/* Deductions */}
              {(formData.RentDelivery && parseFloat(formData.RentDelivery as string) > 0) || 
               (formData.commissioneTotal && parseFloat(formData.commissioneTotal as string) > 0) || 
               (formData.mazdoriTotal && parseFloat(formData.mazdoriTotal as string) > 0) ? (
                <>
                  {formData.RentDelivery && parseFloat(formData.RentDelivery as string) > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border">
                      <span className="text-gray-700 dark:text-gray-300">- Rent & Delivery:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        - Rs. {parseFloat(formData.RentDelivery as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {formData.commissioneTotal && parseFloat(formData.commissioneTotal as string) > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border">
                      <span className="text-gray-700 dark:text-gray-300">- Commission Total ({formData.commissioneRate}%):</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        - Rs. {parseFloat(formData.commissioneTotal as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {formData.mazdoriTotal && parseFloat(formData.mazdoriTotal as string) > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border">
                      <span className="text-gray-700 dark:text-gray-300">- Mazdoori Total ({formData.mazdoriRate}%):</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        - Rs. {parseFloat(formData.mazdoriTotal as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </>
              ) : null}
              
              {/* Final Net Total = Customer balance amount */}
              <hr className="my-3 border-gray-300 dark:border-gray-600" />
              <div className="flex justify-between items-center p-4 bg-primary-100 dark:bg-primary-900/30 rounded border-2 border-primary-300 dark:border-primary-700">
                <div>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">Net Total Price (Customer balance)</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">Rent, Commission, Mazdoori minus ke baad — customer ke balance mein yahi amount add hogi</p>
                </div>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  Rs. {parseFloat(formData.totalPrice as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {/* Return Payment deduction & After Return */}
              {formData.retrunPayment != null && formData.retrunPayment !== '' && parseFloat(String(formData.retrunPayment)) > 0 && (
                <>
                  <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border mt-2">
                    <span className="text-gray-700 dark:text-gray-300">- Return Payment (clears customer loans):</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      - Rs. {parseFloat(String(formData.retrunPayment)).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded border-2 border-amber-200 dark:border-amber-800 mt-2">
                    <p className="text-lg font-bold text-gray-800 dark:text-white">After Return Payment:</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      Rs. {parseFloat(String(formData.afterRetrunPayemnt || '0')).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Return payment is applied to the customer&apos;s loan balance (oldest loans first). Loans are marked complete when fully paid.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-8">
          <Link
            to={`/cropmenu/${userId}/${cropId}`}
            className="btn btn-outline-secondary"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !customer}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 inline-block mr-2"></span>
                Creating...
              </>
            ) : (
              <>
                <IconCashBanknotes className="w-4 h-4 mr-2" />
                Create Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVegetableOrder;
