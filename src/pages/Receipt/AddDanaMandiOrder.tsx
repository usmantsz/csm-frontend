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
import IconCreditCard from "../../components/Icon/IconCreditCard";
import IconUser from "../../components/Icon/IconUser";
import IconPhone from "../../components/Icon/IconPhone";
import IconMapPin from "../../components/Icon/IconMapPin";
import IconCashBanknotes from "../../components/Icon/IconCashBanknotes";
import IconTrendingUp from "../../components/Icon/IconTrendingUp";
// Using available icons - replace with actual icons if they exist
// IconScale and IconCalculator may not exist, using alternatives

interface DanaMandiOrderForm {
  danaMandiOrderShopId: string;
  danaMandiOrderUserId: string;
  danaMandiOrderBapariId: string;
  danaMandiOrderCusId: string;
  danaMandiOrderCropId: string;
  priceCrop: number | string;
  weightMann: number | string;
  weightKg: number | string;
  malaKhataName: string;
  malaKhataMan: number | string;
  malaKhataKg: number | string;
  malaKhataPayment: number | string;
  RentDelivery: number | string;
  commissioneRate: number | string;
  commissioneTotal: number | string;
  mazdoriRate: number | string;
  mazdoriTotal: number | string;
  totalPrice: number | string;
  piscesTypeId: string;
  retrunPayment: number | string;
  afterRetrunPayemnt: number | string;
  danaMandiOrderStatus: number | string;
}

const AddDanaMandiOrder: React.FC = () => {
  const dispatch = useDispatch();
  const { token, user } = useAuthToken();
  const navigate = useNavigate();
  const { shopId: urlShopId } = useShopIdFromUrl();
  const { shopId: userShopIdFromHook, error } = useShopId();
  const { userId, cropId } = useParams<{ userId: string; cropId: string }>();

  useEffect(() => {
    dispatch(setPageTitle('Add Dana Mandi Order'));
  }, [dispatch]);

  // Get shopId from URL (admin view), user object, or useShopId hook
  const userShopId = urlShopId || (user as any)?.shopId || userShopIdFromHook;

  const [formData, setFormData] = useState<DanaMandiOrderForm>({
    danaMandiOrderShopId: userShopId || "",
    danaMandiOrderUserId: userId || "",
    danaMandiOrderBapariId: "",
    danaMandiOrderCusId: "",
    danaMandiOrderCropId: cropId || "",
    priceCrop: "",
    weightMann: "",
    weightKg: "",
    malaKhataName: "",
    malaKhataMan: "",
    malaKhataKg: "",
    malaKhataPayment: "",
    RentDelivery: "",
    commissioneRate: "",
    commissioneTotal: "",
    mazdoriRate: "",
    mazdoriTotal: "",
    totalPrice: "",
    piscesTypeId: "",
    retrunPayment: "",
    afterRetrunPayemnt: "",
    danaMandiOrderStatus: 0
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DanaMandiOrderForm, string>>>({});
  const [loading, setLoading] = useState(false);
  const [cnic, setCnic] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [checkingCustomer, setCheckingCustomer] = useState(false);
  const [customerBalance, setCustomerBalance] = useState<any>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    if (userShopId) {
      setFormData(prev => ({ ...prev, danaMandiOrderShopId: userShopId }));
    }
  }, [userShopId]);

  // ✅ Search Customer by CNIC - Check if customer exists in shop owner's shop
  const handleCnicBlur = async () => {
    if (!cnic || !cnic.trim()) return;
    
    if (!userShopId) {
      showError('Shop ID is missing. Please ensure you have a shop assigned.');
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
            setFormData((prev) => ({ ...prev, danaMandiOrderCusId: "" }));
            showError(
              "This customer has been deleted. Please contact admin to restore.",
              "Customer Not Available"
            );
          } else {
            setCustomer(foundCustomer);
            setFormData((prev) => ({ ...prev, danaMandiOrderCusId: foundCustomer._id }));
            showSuccess("Customer found successfully!");
            // Fetch customer balance
            await fetchCustomerBalance(foundCustomer._id);
          }
        } else {
          setCustomer(null);
          setCustomerBalance(null);
          setFormData((prev) => ({ ...prev, danaMandiOrderCusId: "" }));
          showError(
            "Your shop has no customer registered with this CNIC number. Please register the customer first.",
            "Customer Not Found"
          );
        }
      } else {
        setCustomer(null);
        setCustomerBalance(null);
        setFormData((prev) => ({ ...prev, danaMandiOrderCusId: "" }));
        showError(shopCustomersResponse.data.message || "Error fetching shop customers.");
      }
    } catch (error: any) {
      console.error("Error checking customer:", error);
      setCustomer(null);
      setCustomerBalance(null);
      setFormData((prev) => ({ ...prev, danaMandiOrderCusId: "" }));
      showError(
        error.response?.data?.message || "Error checking customer. Please try again."
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

  // Clear Return Payment when customer has no balance (field disabled)
  useEffect(() => {
    const shouldDisable = !customerBalance || (Number(customerBalance?.blance) || 0) <= 0;
    if (shouldDisable && (formData.retrunPayment !== "" && formData.retrunPayment !== undefined)) {
      setFormData(prev => ({ ...prev, retrunPayment: "", afterRetrunPayemnt: prev.totalPrice ?? "" }));
    }
  }, [customerBalance]);

  // Auto-calculations
  useEffect(() => {
    const priceMann = parseFloat(formData.priceCrop as string) || 0;
    const weightMann = parseFloat(formData.weightMann as string) || 0;
    const weightKg = parseFloat(formData.weightKg as string) || 0;
    const oneKgPrice = priceMann / 40;
    const totalPrice = priceMann * weightMann + weightKg * oneKgPrice;
    const commissionRate = parseFloat(formData.commissioneRate as string) || 0;
    const commissionTotal = (totalPrice / 100) * commissionRate;
    const mazdoriRate = parseFloat(formData.mazdoriRate as string) || 0;
    const mazdoriTotal = (totalPrice / 100) * mazdoriRate;
    const malaKhataMan = parseFloat(formData.malaKhataMan as string) || 0;
    const malaKhataKg = parseFloat(formData.malaKhataKg as string) || 0;
    const malaKhataTotal = malaKhataMan * priceMann + malaKhataKg * oneKgPrice;
    const returnPayment = parseFloat(formData.retrunPayment as string) || 0;
    const afterReturn = totalPrice - returnPayment;

    setFormData(prev => ({
      ...prev,
      totalPrice: totalPrice.toFixed(2),
      commissioneTotal: commissionTotal.toFixed(2),
      mazdoriTotal: mazdoriTotal.toFixed(2),
      malaKhataPayment: malaKhataTotal ? malaKhataTotal.toFixed(2) : "",
      afterRetrunPayemnt: afterReturn.toFixed(2)
    }));
  }, [
    formData.priceCrop,
    formData.weightMann,
    formData.weightKg,
    formData.commissioneRate,
    formData.mazdoriRate,
    formData.malaKhataMan,
    formData.malaKhataKg,
    formData.retrunPayment
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof DanaMandiOrderForm, string>> = {};
    
    if (!formData.danaMandiOrderUserId) newErrors.danaMandiOrderUserId = "User ID is required";
    if (!formData.danaMandiOrderBapariId) newErrors.danaMandiOrderBapariId = "Buyer name is required";
    if (!formData.danaMandiOrderCusId) newErrors.danaMandiOrderCusId = "Customer is required";
    if (!formData.danaMandiOrderCropId) newErrors.danaMandiOrderCropId = "Crop ID is required";
    if (!formData.priceCrop) newErrors.priceCrop = "Price per Mann is required";
    if (!formData.weightMann) newErrors.weightMann = "Weight (Mann) is required";
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

    // Show confirmation dialog
    const confirmed = await confirmCreate('this Dana Mandi order');
    if (!confirmed) return;

    setLoading(true);
    setErrors({});
    showLoading('Creating order...');

    try {
      const response = await axios.post(
        `${ServerSetting.serUrl}/api/addanamandiorder`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 200) {
        closeAlert();
        showSuccess(response.data.message || "Order created successfully!");
        setTimeout(() => {
          navigate("/dana-mandi-order-list");
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
        title="Add Dana Mandi Order"
        description="Create a new order receipt for your shop"
        backTo={userId && cropId ? `/crop-receipt-list/${userId}/${cropId}` : '/getassginshopcrops'}
        backLabel="Back to Receipt List"
        icon="📄"
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
                setFormData(prev => ({ ...prev, danaMandiOrderCusId: "" }));
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
          </div>
        )}

        {/* Order Details Section */}
        <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
            <IconCashBanknotes className="w-5 h-5 mr-2 text-primary-600" />
            Order Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Buyer Name"
              name="danaMandiOrderBapariId"
              type="text"
              value={formData.danaMandiOrderBapariId}
              onChange={handleChange}
              error={errors.danaMandiOrderBapariId}
              placeholder="Enter buyer name"
              required
              icon={<IconUser className="w-5 h-5" />}
            />

            <FormField
              label="Price per Mann"
              name="priceCrop"
              type="number"
              value={formData.priceCrop}
              onChange={handleChange}
              error={errors.priceCrop}
              placeholder="Enter price per mann"
              required
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label="Weight (Mann)"
              name="weightMann"
              type="number"
              value={formData.weightMann}
              onChange={handleChange}
              error={errors.weightMann}
              placeholder="Enter weight in mann"
              required
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label="Extra Weight (Kg)"
              name="weightKg"
              type="number"
              value={formData.weightKg}
              onChange={handleChange}
              error={errors.weightKg}
              placeholder="Enter extra weight in kg"
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label="Mala Khata Name"
              name="malaKhataName"
              type="text"
              value={formData.malaKhataName}
              onChange={handleChange}
              error={errors.malaKhataName}
              placeholder="Enter mala khata name"
              icon={<IconUser className="w-5 h-5" />}
            />

            <FormField
              label="Mala Khata Mann"
              name="malaKhataMan"
              type="number"
              value={formData.malaKhataMan}
              onChange={handleChange}
              error={errors.malaKhataMan}
              placeholder="Enter mala khata mann"
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label="Mala Khata Kg"
              name="malaKhataKg"
              type="number"
              value={formData.malaKhataKg}
              onChange={handleChange}
              error={errors.malaKhataKg}
              placeholder="Enter mala khata kg"
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label="Mala Khata Payment"
              name="malaKhataPayment"
              type="number"
              value={formData.malaKhataPayment}
              onChange={handleChange}
              error={errors.malaKhataPayment}
              placeholder="Auto-calculated"
              readOnly
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label="Rent Delivery"
              name="RentDelivery"
              type="number"
              value={formData.RentDelivery}
              onChange={handleChange}
              error={errors.RentDelivery}
              placeholder="Enter rent delivery"
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label="Commission Rate (%)"
              name="commissioneRate"
              type="number"
              value={formData.commissioneRate}
              onChange={handleChange}
              error={errors.commissioneRate}
              placeholder="Enter commission rate"
              required
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label="Commission Total"
              name="commissioneTotal"
              type="number"
              value={formData.commissioneTotal}
              onChange={handleChange}
              error={errors.commissioneTotal}
              placeholder="Auto-calculated"
              readOnly
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label="Mazdoori Rate (%)"
              name="mazdoriRate"
              type="number"
              value={formData.mazdoriRate}
              onChange={handleChange}
              error={errors.mazdoriRate}
              placeholder="Enter mazdoori rate"
              required
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label="Mazdoori Total"
              name="mazdoriTotal"
              type="number"
              value={formData.mazdoriTotal}
              onChange={handleChange}
              error={errors.mazdoriTotal}
              placeholder="Auto-calculated"
              readOnly
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label="Total Price"
              name="totalPrice"
              type="number"
              value={formData.totalPrice}
              onChange={handleChange}
              error={errors.totalPrice}
              placeholder="Auto-calculated"
              readOnly
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <div>
              <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
                Pisces Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <IconCashBanknotes className="w-5 h-5 text-gray-400" />
                </div>
                <select
                  name="piscesTypeId"
                  value={formData.piscesTypeId}
                  onChange={handleChange}
                  className={`form-select w-full pl-10 ${errors.piscesTypeId ? 'border-danger focus:ring-danger' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'} transition-all duration-300 focus:ring-2 focus:border-primary-500`}
                  disabled={loading}
                >
                  <option value="">Select Pisces Type</option>
                  <option value="bag50">50 Kg Bag</option>
                  <option value="bag80">80 Kg Bag</option>
                  <option value="bag100">100 Kg Bag</option>
                </select>
              </div>
              {errors.piscesTypeId && (
                <p className="mt-1.5 text-sm text-danger">{errors.piscesTypeId}</p>
              )}
            </div>

            <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">Return Payment sirf tab enable hota hai jab customer ka shop par balance ho (Customer Owes to Shop &gt; 0).</p>
            <FormField
              label="Return Payment"
              name="retrunPayment"
              type="number"
              value={formData.retrunPayment}
              onChange={handleChange}
              error={errors.retrunPayment}
              placeholder="Enter return payment"
              icon={<IconCashBanknotes className="w-5 h-5" />}
              disabled={!customerBalance || (Number(customerBalance?.blance) || 0) <= 0}
            />

            <FormField
              label="After Return Payment"
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

            {/* Customer Balance Display - Below Return Payment */}
            {customer && (
              <div className="md:col-span-2">
                {loadingBalance ? (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-yellow-200 dark:border-gray-600">
                    <div className="flex items-center justify-center">
                      <span className="animate-spin border-2 border-yellow-600 border-t-transparent rounded-full w-5 h-5 inline-block mr-2"></span>
                      <span className="text-gray-600 dark:text-gray-300">Loading balance...</span>
                    </div>
                  </div>
                ) : customerBalance !== null && (
                  <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
                    <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-400 mb-4 flex items-center">
                      <IconCashBanknotes className="w-6 h-6 mr-2" /> Customer Balance Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Customer Owes to Shop */}
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Customer Owes to Shop</p>
                        <p className="text-2xl font-bold flex items-center text-red-600 dark:text-red-400">
                          <IconTrendingUp className="w-6 h-6 inline-block mr-1" />
                          Rs. {(customerBalance.cusBlane || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Amount customer needs to pay
                        </p>
                      </div>
                      
                      {/* Shop Owes to Customer */}
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-green-200 dark:border-green-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Shop Owes to Customer</p>
                        <p className="text-2xl font-bold flex items-center text-green-600 dark:text-green-400">
                          <IconTrendingUp className="w-6 h-6 inline-block mr-1 rotate-180" />
                          Rs. {(customerBalance.blance || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Amount shop needs to pay
                        </p>
                      </div>
                      
                      {/* Net Balance */}
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Balance</p>
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
                                {netBalance >= 0 ? 'Customer owes to shop' : 'Shop owes to customer'}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* After This Order Projection */}
                    {formData.afterRetrunPayemnt && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">After This Order:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Order Amount:</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">
                              Rs. {parseFloat(formData.afterRetrunPayemnt as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Projected Net Balance:</p>
                            {(() => {
                              const orderAmount = parseFloat(formData.afterRetrunPayemnt as string || '0');
                              const currentNet = (customerBalance.cusBlane || 0) - (customerBalance.blance || 0);
                              const projectedNet = currentNet + orderAmount; // Order amount increases customer's debt
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
                        <strong>Note:</strong> 
                        <br />• <strong>Customer Owes:</strong> Amount customer needs to pay to shop (cusBlane)
                        <br />• <strong>Shop Owes:</strong> Amount shop needs to pay to customer (blance)
                        <br />• <strong>Net Balance:</strong> Overall balance (Customer Owes - Shop Owes)
                        <br />• This order amount will be added to customer's balance.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary - Detailed Breakdown */}
        <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border-2 border-primary-200 dark:border-primary-800">
          <h3 className="text-xl font-bold text-primary-700 dark:text-primary-400 mb-6 flex items-center">
            <IconCashBanknotes className="w-6 h-6 mr-2" />
            Payment Breakdown & Total Amount
          </h3>
          
          {/* Total Price (Before Deductions) */}
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Price (Before Deductions)</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                Rs. {parseFloat(formData.totalPrice as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Calculated from: (Price per Mann × Weight Mann) + (Price per Kg × Weight Kg)
            </p>
          </div>

          {/* Deductions Section */}
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Deductions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">Rent Delivery</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  Rs. {parseFloat(formData.RentDelivery as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">Mala Khata Payment</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  Rs. {parseFloat(formData.malaKhataPayment as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">Commission Total</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  Rs. {parseFloat(formData.commissioneTotal as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ({formData.commissioneRate}% of Total Price)
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">Mazdoori Total</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  Rs. {parseFloat(formData.mazdoriTotal as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ({formData.mazdoriRate}% of Total Price)
                </p>
              </div>
            </div>
          </div>

          {/* Calculation Summary */}
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Total Price:</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  Rs. {parseFloat(formData.totalPrice as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">- Rent Delivery:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  - Rs. {parseFloat(formData.RentDelivery as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">- Mala Khata Payment:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  - Rs. {parseFloat(formData.malaKhataPayment as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">- Commission Total:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  - Rs. {parseFloat(formData.commissioneTotal as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">- Mazdoori Total:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  - Rs. {parseFloat(formData.mazdoriTotal as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {parseFloat(formData.retrunPayment as string || '0') > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">- Return Payment:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    - Rs. {parseFloat(formData.retrunPayment as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <hr className="my-2 border-gray-300 dark:border-gray-600" />
              <div className="flex justify-between items-center pt-2">
                <p className="text-lg font-bold text-gray-800 dark:text-white">Final Amount (After Return Payment):</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  Rs. {parseFloat(formData.afterRetrunPayemnt as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/dana-mandi-order-list"
            className="btn btn-outline-primary"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || checkingCustomer}
            className={`btn btn-primary ${loading || checkingCustomer ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5 inline-block mr-2"></span>
                Creating...
              </>
            ) : (
              <>
                <IconCashBanknotes className="w-5 h-5 mr-2" />
                Create Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDanaMandiOrder;
