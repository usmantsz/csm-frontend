import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { ServerSetting } from "./../../helperComponents/ServerSetting";
import { useAuthToken } from "./../../Hooks/useAuthToken";
import { useShopId } from "./../../Hooks/useShopId";
import { useShopIdFromUrl } from "./../../Hooks/useShopIdFromUrl";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setPageTitle } from "./../../store/themeConfigSlice";
import FormField from "./../../components/Agricultural/FormField";
import { showError, showSuccess, showLoading, closeAlert, confirmCreate } from "../../utils/sweetAlert";
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
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { token, user } = useAuthToken();
  const navigate = useNavigate();
  const { shopId: urlShopId } = useShopIdFromUrl();
  const { shopId: userShopIdFromHook, error } = useShopId();
  const { userId, cropId } = useParams<{ userId: string; cropId: string }>();

  useEffect(() => {
    dispatch(setPageTitle(t('create_new_dana_mandi_order')));
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
      showError(t('shop_id_missing'));
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
              t('customer_deleted_contact_admin_restore'),
              t('customer_not_available')
            );
          } else {
            setCustomer(foundCustomer);
            setFormData((prev) => ({ ...prev, danaMandiOrderCusId: foundCustomer._id }));
            showSuccess(t('customer_found_success'));
            // Fetch customer balance
            await fetchCustomerBalance(foundCustomer._id);
          }
        } else {
          setCustomer(null);
          setCustomerBalance(null);
          setFormData((prev) => ({ ...prev, danaMandiOrderCusId: "" }));
          showError(
            t('shop_no_customer_with_cnic'),
            t('customer_not_found')
          );
        }
      } else {
        setCustomer(null);
        setCustomerBalance(null);
        setFormData((prev) => ({ ...prev, danaMandiOrderCusId: "" }));
        showError(shopCustomersResponse.data.message || t('error_fetch_customers'));
      }
    } catch (error: any) {
      console.error("Error checking customer:", error);
      setCustomer(null);
      setCustomerBalance(null);
      setFormData((prev) => ({ ...prev, danaMandiOrderCusId: "" }));
      showError(
        error.response?.data?.message || t('error_checking_customer_retry')
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

    if (!formData.danaMandiOrderUserId) newErrors.danaMandiOrderUserId = t('user_id_missing');
    if (!formData.danaMandiOrderBapariId) newErrors.danaMandiOrderBapariId = t('buyer_name_required');
    if (!formData.danaMandiOrderCusId) newErrors.danaMandiOrderCusId = t('customer_field_required');
    if (!formData.danaMandiOrderCropId) newErrors.danaMandiOrderCropId = t('crop_id_required');
    if (!formData.priceCrop) newErrors.priceCrop = t('price_per_mann_required');
    if (!formData.weightMann) newErrors.weightMann = t('weight_mann_required');
    if (!formData.commissioneRate) newErrors.commissioneRate = t('commission_rate_required');
    if (!formData.mazdoriRate) newErrors.mazdoriRate = t('mazdoori_rate_required');

    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showError(t('please_fill_required_fields'));
      return;
    }

    // Show confirmation dialog
    const confirmed = await confirmCreate(t('dana_mandi_order_lower'));
    if (!confirmed) return;

    setLoading(true);
    setErrors({});
    showLoading(t('creating_order_loading'));

    try {
      const response = await axios.post(
        `${ServerSetting.serUrl}/api/addanamandiorder`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 200) {
        closeAlert();
        showSuccess(response.data.message || t('order_created_success'));
        setTimeout(() => {
          navigate("/dana-mandi-order-list");
        }, 1500);
      } else {
        closeAlert();
        showError(response.data.message || t('failed_create_order'));
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      closeAlert();
      showError(
        error.response?.data?.message || t('error_creating_order_retry')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Form Card */}
      <div className="panel shadow-sm">
        {/* CNIC Search Section */}
        <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-green-200 dark:border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <IconCreditCard className="w-5 h-5 mr-2 text-green-600" />
            {t('search_customer_by_cnic')}
          </h3>
          <FormField
            label={t('customer_cnic_field')}
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
            placeholder={t('enter_13_digit_cnic')}
            icon={<IconCreditCard className="w-5 h-5" />}
            helpText={t('cnic_search_shop_hint')}
            disabled={checkingCustomer || loading}
          />
          {checkingCustomer && (
            <div className="mt-2 text-sm text-green-600 flex items-center">
              <span className="animate-spin border-2 border-green-600 border-t-transparent rounded-full w-4 h-4 inline-block mr-2"></span>
              {t('checking_customer')}
            </div>
          )}
        </div>

        {/* Customer Info Card */}
        {customer && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-green-200 dark:border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <IconUser className="w-5 h-5 mr-2 text-green-600" />
              {t('customer_information')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <IconUser className="w-5 h-5 mr-2 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">{t('name')}</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {customer.cusNameF} {customer.cusNameL}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <IconCreditCard className="w-5 h-5 mr-2 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">{t('cnic')}</p>
                  <p className="font-semibold text-gray-800 dark:text-white font-mono">
                    {customer.cusCNIC}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <IconPhone className="w-5 h-5 mr-2 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">{t('phone')}</p>
                  <p className="font-semibold text-gray-800 dark:text-white font-mono">
                    {customer.cusNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <IconMapPin className="w-5 h-5 mr-2 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">{t('address')}</p>
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
            <IconCashBanknotes className="w-5 h-5 mr-2 text-green-600" />
            {t('create_receipt')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label={t('buyer_name')}
              name="danaMandiOrderBapariId"
              type="text"
              value={formData.danaMandiOrderBapariId}
              onChange={handleChange}
              error={errors.danaMandiOrderBapariId}
              placeholder={t('enter_buyer_name_ph')}
              required
              icon={<IconUser className="w-5 h-5" />}
            />

            <FormField
              label={t('price_per_mann')}
              name="priceCrop"
              type="number"
              value={formData.priceCrop}
              onChange={handleChange}
              error={errors.priceCrop}
              placeholder={t('enter_price_per_mann_ph')}
              required
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label={t('weight_mann_field')}
              name="weightMann"
              type="number"
              value={formData.weightMann}
              onChange={handleChange}
              error={errors.weightMann}
              placeholder={t('enter_weight_mann_ph')}
              required
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label={t('extra_weight_kg_field')}
              name="weightKg"
              type="number"
              value={formData.weightKg}
              onChange={handleChange}
              error={errors.weightKg}
              placeholder={t('enter_extra_weight_kg_ph')}
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label={t('mala_khata_name_field')}
              name="malaKhataName"
              type="text"
              value={formData.malaKhataName}
              onChange={handleChange}
              error={errors.malaKhataName}
              placeholder={t('enter_mala_khata_name_ph')}
              icon={<IconUser className="w-5 h-5" />}
            />

            <FormField
              label={t('mala_khata_mann_field')}
              name="malaKhataMan"
              type="number"
              value={formData.malaKhataMan}
              onChange={handleChange}
              error={errors.malaKhataMan}
              placeholder={t('enter_mala_khata_mann_ph')}
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label={t('mala_khata_kg_field')}
              name="malaKhataKg"
              type="number"
              value={formData.malaKhataKg}
              onChange={handleChange}
              error={errors.malaKhataKg}
              placeholder={t('enter_mala_khata_kg_ph')}
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label={t('mala_khata_payment_field')}
              name="malaKhataPayment"
              type="number"
              value={formData.malaKhataPayment}
              onChange={handleChange}
              error={errors.malaKhataPayment}
              placeholder={t('auto_calculated_ph')}
              readOnly
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label={t('rent_delivery_field')}
              name="RentDelivery"
              type="number"
              value={formData.RentDelivery}
              onChange={handleChange}
              error={errors.RentDelivery}
              placeholder={t('enter_rent_delivery_ph')}
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label={t('commission_rate_field')}
              name="commissioneRate"
              type="number"
              value={formData.commissioneRate}
              onChange={handleChange}
              error={errors.commissioneRate}
              placeholder={t('enter_commission_rate_ph')}
              required
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label={t('commission_total_field')}
              name="commissioneTotal"
              type="number"
              value={formData.commissioneTotal}
              onChange={handleChange}
              error={errors.commissioneTotal}
              placeholder={t('auto_calculated_ph')}
              readOnly
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label={t('mazdoori_rate_field')}
              name="mazdoriRate"
              type="number"
              value={formData.mazdoriRate}
              onChange={handleChange}
              error={errors.mazdoriRate}
              placeholder={t('enter_mazdoori_rate_ph')}
              required
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label={t('mazdoori_total_field')}
              name="mazdoriTotal"
              type="number"
              value={formData.mazdoriTotal}
              onChange={handleChange}
              error={errors.mazdoriTotal}
              placeholder={t('auto_calculated_ph')}
              readOnly
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <FormField
              label={t('total_price_field')}
              name="totalPrice"
              type="number"
              value={formData.totalPrice}
              onChange={handleChange}
              error={errors.totalPrice}
              placeholder={t('auto_calculated_ph')}
              readOnly
              icon={<IconCashBanknotes className="w-5 h-5" />}
            />

            <div>
              <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
                {t('pisces_type_field')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <IconCashBanknotes className="w-5 h-5 text-gray-400" />
                </div>
                <select
                  name="piscesTypeId"
                  value={formData.piscesTypeId}
                  onChange={handleChange}
                  className={`form-select w-full pl-10 ${errors.piscesTypeId ? 'border-danger focus:ring-danger' : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'} transition-all duration-300 focus:ring-2 focus:border-green-500`}
                  disabled={loading}
                >
                  <option value="">{t('select_pisces_type_ph')}</option>
                  <option value="bag50">{t('bag_50kg')}</option>
                  <option value="bag80">{t('bag_80kg')}</option>
                  <option value="bag100">{t('bag_100kg')}</option>
                </select>
              </div>
              {errors.piscesTypeId && (
                <p className="mt-1.5 text-sm text-danger">{errors.piscesTypeId}</p>
              )}
            </div>

            <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">{t('return_payment_enable_hint')}</p>
            <FormField
              label={t('return_payment_field')}
              name="retrunPayment"
              type="number"
              value={formData.retrunPayment}
              onChange={handleChange}
              error={errors.retrunPayment}
              placeholder={t('enter_return_payment_ph')}
              icon={<IconCashBanknotes className="w-5 h-5" />}
              disabled={!customerBalance || (Number(customerBalance?.blance) || 0) <= 0}
            />

            <FormField
              label={t('after_return_payment_field')}
              name="afterRetrunPayemnt"
              type="number"
              value={formData.afterRetrunPayemnt}
              onChange={handleChange}
              error={errors.afterRetrunPayemnt}
              placeholder={t('auto_calculated_ph')}
              readOnly
              icon={<IconCashBanknotes className="w-5 h-5" />}
              disabled={!customerBalance || (Number(customerBalance?.blance) || 0) <= 0}
            />

            {/* Customer Balance Display - Below Return Payment */}
            {customer && (
              <div className="md:col-span-2">
                {loadingBalance ? (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-yellow-200 dark:border-gray-600 shadow-md">
                    <div className="flex items-center justify-center">
                      <span className="animate-spin border-2 border-yellow-600 border-t-transparent rounded-full w-5 h-5 inline-block mr-2"></span>
                      <span className="text-gray-600 dark:text-gray-300">{t('loading_balance')}</span>
                    </div>
                  </div>
                ) : customerBalance !== null && (
                  <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-yellow-200 dark:border-yellow-800 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-400 mb-4 flex items-center">
                      <IconCashBanknotes className="w-6 h-6 mr-2" /> {t('customer_balance_information')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Customer Owes to Shop */}
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-800 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('customer_owes_to_shop')}</p>
                        <p className="text-2xl font-bold flex items-center text-red-600 dark:text-red-400">
                          <IconTrendingUp className="w-6 h-6 inline-block mr-1" />
                          Rs. {(customerBalance.cusBlane || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('amount_customer_needs_to_pay')}
                        </p>
                      </div>

                      {/* Shop Owes to Customer */}
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('shop_owes_to_customer')}</p>
                        <p className="text-2xl font-bold flex items-center text-green-600 dark:text-green-400">
                          <IconTrendingUp className="w-6 h-6 inline-block mr-1 rotate-180" />
                          Rs. {(customerBalance.blance || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('amount_shop_needs_to_pay')}
                        </p>
                      </div>

                      {/* Net Balance */}
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('net_balance_field')}</p>
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
                                {netBalance >= 0 ? t('customer_owes_to_shop') : t('shop_owes_to_customer')}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* After This Order Projection */}
                    {formData.afterRetrunPayemnt && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-yellow-200 dark:border-yellow-800 shadow-sm">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('after_this_order_label')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('order_amount_label')}</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">
                              Rs. {parseFloat(formData.afterRetrunPayemnt as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('projected_net_balance_label')}</p>
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

                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-sm">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>{t('balance_note_title')}</strong>
                        <br />• <strong>{t('customer_owes_to_shop')}:</strong> {t('balance_note_customer_owes')}
                        <br />• <strong>{t('shop_owes_to_customer')}:</strong> {t('balance_note_shop_owes')}
                        <br />• <strong>{t('net_balance_field')}:</strong> {t('balance_note_net_balance')}
                        <br />• {t('balance_note_order_add')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary - Detailed Breakdown */}
        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-md hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-6 flex items-center">
            <IconCashBanknotes className="w-6 h-6 mr-2" />
            {t('payment_breakdown_title')}
          </h3>

          {/* Total Price (Before Deductions) */}
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('total_price_before_deductions')}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                Rs. {parseFloat(formData.totalPrice as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('total_price_calc_formula')}
            </p>
          </div>

          {/* Deductions Section */}
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('deductions_label')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-300">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('rent_delivery_field')}</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  Rs. {parseFloat(formData.RentDelivery as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-300">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('mala_khata_payment_field')}</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  Rs. {parseFloat(formData.malaKhataPayment as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-300">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('commission_total_field')}</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  Rs. {parseFloat(formData.commissioneTotal as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ({formData.commissioneRate}% {t('of_total_price')})
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-300">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('mazdoori_total_field')}</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  Rs. {parseFloat(formData.mazdoriTotal as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ({formData.mazdoriRate}% {t('of_total_price')})
                </p>
              </div>
            </div>
          </div>

          {/* Calculation Summary */}
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">{t('total_price_field')}:</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  Rs. {parseFloat(formData.totalPrice as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">- {t('rent_delivery_field')}:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  - Rs. {parseFloat(formData.RentDelivery as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">- {t('mala_khata_payment_field')}:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  - Rs. {parseFloat(formData.malaKhataPayment as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">- {t('commission_total_field')}:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  - Rs. {parseFloat(formData.commissioneTotal as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">- {t('mazdoori_total_field')}:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  - Rs. {parseFloat(formData.mazdoriTotal as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {parseFloat(formData.retrunPayment as string || '0') > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">- {t('return_payment_field')}:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    - Rs. {parseFloat(formData.retrunPayment as string || '0').toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <hr className="my-2 border-gray-300 dark:border-gray-600" />
              <div className="flex justify-between items-center pt-2">
                <p className="text-lg font-bold text-gray-800 dark:text-white">{t('final_amount_after_return')}</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
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
            {t('cancel')}
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
                {t('creating_order')}
              </>
            ) : (
              <>
                <IconCashBanknotes className="w-5 h-5 mr-2" />
                {t('create_order_btn')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDanaMandiOrder;
