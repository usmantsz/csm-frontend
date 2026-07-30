import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { useAuthToken } from '../../Hooks/useAuthToken';
import PageHeader from '../../components/Agricultural/PageHeader';

const EditPesticideShop = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [shop, setShop] = useState<any>(null);
    const [owner, setOwner] = useState<any>({});
    const [subscriptions, setSubscriptions] = useState<any[]>([]);

    useEffect(() => {
        dispatch(setPageTitle('Edit Pesticide Shop'));
    }, [dispatch]);

    useEffect(() => {
        if (!token || !id) return;
        axios
            .get(`${ServerSetting.apiUrl}/pesticide-pos/shops/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => {
                if (r.data?.status === 200 && r.data.data) {
                    setShop(r.data.data);
                    const o = r.data.data.shopOwnerId;
                    setOwner(o ? { userNameF: o.userNameF, userNameL: o.userNameL, userEmail: o.userEmail, userPhone: o.userPhone, userAdress: o.userAdress, userCity: o.userCity, userProvince: o.userProvince } : {});
                }
            })
            .catch(() => Notification({ text: 'Failed to load shop', color: 'danger' }))
            .finally(() => setLoading(false));

        axios.get(`${ServerSetting.apiUrl}/pesticide-pos/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => { if (r.data?.status === 200 && Array.isArray(r.data.data)) setSubscriptions(r.data.data); })
            .catch(() => {});
    }, [token, id]);

    const handleShopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!shop) return;
        setShop({ ...shop, [e.target.name]: e.target.value });
    };
    const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOwner((p: any) => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!shop || !token || !id) return;
        setSaving(true);
        const payload = {
            shopName: shop.shopName,
            shopRegistrationNumber: shop.shopRegistrationNumber,
            shopPhone: shop.shopPhone,
            shopAddress: shop.shopAddress,
            shopProvince: shop.shopProvince,
            shopCity: shop.shopCity,
            shopLogo: shop.shopLogo,
            posSubscriptionId: shop.posSubscriptionId?._id || shop.posSubscriptionId,
            owner,
        };
        axios
            .put(`${ServerSetting.apiUrl}/pesticide-pos/shops/${id}`, payload, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
            .then((r) => {
                if (r.data?.status === 200) {
                    Notification({ text: 'Shop updated', color: 'success' });
                    navigate('/pesticide-pos/shops');
                } else Notification({ text: r.data?.message || 'Failed', color: 'danger' });
            })
            .catch((err) => Notification({ text: err.response?.data?.message || 'Failed', color: 'danger' }))
            .finally(() => setSaving(false));
    };

    if (loading || !shop) {
        return (
            <div className="panel text-center py-12">
                {loading ? 'Loading...' : 'Shop not found.'}
            </div>
        );
    }

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><Link to="/dashboard" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link to="/pesticide-pos/shops" className="text-primary hover:underline">Pesticide Shop List</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Edit Shop</span></li>
            </ul>
            <PageHeader title="Edit Pesticide Shop" description={shop.shopName} onBack={() => navigate(-1)} backLabel="Back" icon="🏪" />

            <form onSubmit={handleSubmit} className="panel space-y-8">
                <div>
                    <h5 className="text-lg font-semibold mb-4 border-b pb-2">Shop Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Shop Name *</label>
                            <input type="text" name="shopName" className="form-input" value={shop.shopName || ''} onChange={handleShopChange} required />
                        </div>
                        <div>
                            <label className="form-label">Registration Number *</label>
                            <input type="text" name="shopRegistrationNumber" className="form-input" value={shop.shopRegistrationNumber || ''} onChange={handleShopChange} required />
                        </div>
                        <div>
                            <label className="form-label">Shop Phone *</label>
                            <input type="text" name="shopPhone" className="form-input" value={shop.shopPhone || ''} onChange={handleShopChange} required />
                        </div>
                        <div>
                            <label className="form-label">Logo</label>
                            <input type="text" name="shopLogo" className="form-input" value={shop.shopLogo || ''} onChange={handleShopChange} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">Address *</label>
                            <input type="text" name="shopAddress" className="form-input" value={shop.shopAddress || ''} onChange={handleShopChange} required />
                        </div>
                        <div>
                            <label className="form-label">Province</label>
                            <input type="text" name="shopProvince" className="form-input" value={shop.shopProvince || ''} onChange={handleShopChange} />
                        </div>
                        <div>
                            <label className="form-label">City</label>
                            <input type="text" name="shopCity" className="form-input" value={shop.shopCity || ''} onChange={handleShopChange} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">POS Subscription</label>
                            <select
                                className="form-select"
                                value={shop.posSubscriptionId?._id || shop.posSubscriptionId || ''}
                                onChange={(e) => setShop({ ...shop, posSubscriptionId: e.target.value })}
                            >
                                {subscriptions.map((s) => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <h5 className="text-lg font-semibold mb-4 border-b pb-2">Owner Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">First Name</label>
                            <input type="text" name="userNameF" className="form-input" value={owner.userNameF || ''} onChange={handleOwnerChange} />
                        </div>
                        <div>
                            <label className="form-label">Last Name</label>
                            <input type="text" name="userNameL" className="form-input" value={owner.userNameL || ''} onChange={handleOwnerChange} />
                        </div>
                        <div>
                            <label className="form-label">Email</label>
                            <input type="email" name="userEmail" className="form-input" value={owner.userEmail || ''} onChange={handleOwnerChange} />
                        </div>
                        <div>
                            <label className="form-label">Phone</label>
                            <input type="text" name="userPhone" className="form-input" value={owner.userPhone || ''} onChange={handleOwnerChange} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">Address</label>
                            <input type="text" name="userAdress" className="form-input" value={owner.userAdress || ''} onChange={handleOwnerChange} />
                        </div>
                        <div>
                            <label className="form-label">Province</label>
                            <input type="text" name="userProvince" className="form-input" value={owner.userProvince || ''} onChange={handleOwnerChange} />
                        </div>
                        <div>
                            <label className="form-label">City</label>
                            <input type="text" name="userCity" className="form-input" value={owner.userCity || ''} onChange={handleOwnerChange} />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                    <Link to="/pesticide-pos/shops" className="btn btn-outline-secondary">Cancel</Link>
                </div>
            </form>
        </div>
    );
};

export default EditPesticideShop;
