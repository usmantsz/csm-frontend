import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { useAuthToken } from '../../Hooks/useAuthToken';
import PageHeader from '../../components/Agricultural/PageHeader';

const EditPosSubscription = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ _id: '', name: '', description: '', price: '', durationDays: '30', isActive: true });

    useEffect(() => {
        dispatch(setPageTitle('Edit POS Subscription'));
    }, [dispatch]);

    useEffect(() => {
        if (!token || !id) return;
        axios
            .get(`${ServerSetting.apiUrl}/pesticide-pos/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => {
                if (r.data?.status === 200 && Array.isArray(r.data.data)) {
                    const sub = r.data.data.find((s: any) => s._id === id);
                    if (sub) {
                        setForm({
                            _id: sub._id,
                            name: sub.name || '',
                            description: sub.description || '',
                            price: String(sub.price ?? ''),
                            durationDays: String(sub.durationDays ?? '30'),
                            isActive: sub.isActive !== false,
                        });
                    }
                }
            })
            .catch(() => Notification({ text: 'Failed to load subscription', color: 'danger' }))
            .finally(() => setLoading(false));
    }, [token, id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name?.trim() || !token) return;
        setSaving(true);
        axios
            .put(`${ServerSetting.apiUrl}/pesticide-pos/subscriptions/edit`, {
                _id: form._id,
                name: form.name.trim(),
                description: form.description.trim(),
                price: Number(form.price) || 0,
                durationDays: Number(form.durationDays) || 30,
                isActive: form.isActive,
            }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
            .then((r) => {
                if (r.data?.status === 200) {
                    Notification({ text: 'Subscription updated', color: 'success' });
                    navigate('/pesticide-pos/subscriptions');
                } else Notification({ text: r.data?.message || 'Failed', color: 'danger' });
            })
            .catch((err) => Notification({ text: err.response?.data?.message || 'Failed', color: 'danger' }))
            .finally(() => setSaving(false));
    };

    if (loading && !form._id) {
        return (
            <div className="panel text-center py-12">Loading...</div>
        );
    }

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><Link to="/dashboard" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link to="/pesticide-pos/subscriptions" className="text-primary hover:underline">Subscription for POS</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Edit Subscription</span></li>
            </ul>
            <PageHeader title="Edit POS Subscription" description={form.name} onBack={() => navigate(-1)} backLabel="Back" icon="📋" />

            <form onSubmit={handleSubmit} className="panel max-w-xl space-y-4">
                <div>
                    <label className="form-label">Name *</label>
                    <input type="text" className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                    <label className="form-label">Description</label>
                    <input type="text" className="form-input" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                    <label className="form-label">Price (Rs.)</label>
                    <input type="number" className="form-input" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} min="0" />
                </div>
                <div>
                    <label className="form-label">Duration (days)</label>
                    <input type="number" className="form-input" value={form.durationDays} onChange={(e) => setForm((p) => ({ ...p, durationDays: e.target.value }))} min="1" />
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                    <label htmlFor="isActive">Active</label>
                </div>
                <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                    <Link to="/pesticide-pos/subscriptions" className="btn btn-outline-secondary">Cancel</Link>
                </div>
            </form>
        </div>
    );
};

export default EditPosSubscription;
