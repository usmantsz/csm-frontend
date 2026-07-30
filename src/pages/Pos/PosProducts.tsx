import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ServerSetting } from '../../helperComponents/ServerSetting';
import { Notification } from '../../helperComponents/Notification';
import { PosInput } from '../../components/Pos/PosFormField';
import PageHeader from '../../components/Agricultural/PageHeader';
import IconPencil from '../../components/Icon/IconPencil';
import { DataTable } from 'mantine-datatable';
import axios from 'axios';

type Product = {
    _id: string;
    name: string;
    code?: string;
    category?: string;
    batch?: string;
    unit?: string;
    price: number;
    stock: number;
    lowStockThreshold?: number;
};

const NEW_OPTION = '__new__';
const PAGE_SIZES = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

const PosProducts = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const [list, setList] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [form, setForm] = useState({ name: '', code: '', category: '', batch: '', unit: 'pcs', price: 0, stock: 0, lowStockThreshold: 5 });
    const [meta, setMeta] = useState<{ categories: string[]; units: string[] }>({ categories: [], units: ['pcs'] });

    useEffect(() => {
        dispatch(setPageTitle(t('pos_products_title')));
    }, [dispatch, t, i18n.language]);

    const fetchList = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setLoading(true);
        const params: Record<string, string> = { limit: '200' };
        if (search) params.search = search;
        if (category) params.category = category;
        if (lowStockOnly) params.lowStockOnly = 'true';
        const q = new URLSearchParams(params).toString();
        axios
            .get(`${ServerSetting.apiUrl}/pos/products?${q}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((r) => {
                if (r.data?.data) setList(r.data.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [search, category, lowStockOnly]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    const fetchMeta = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        axios
            .get(`${ServerSetting.apiUrl}/pos/products/meta`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
            .then((r) => {
                if (r.data?.data?.categories) setMeta((m) => ({ ...m, categories: r.data.data.categories }));
                if (r.data?.data?.units) setMeta((m) => ({ ...m, units: r.data.data.units }));
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetchMeta();
    }, [fetchMeta]);

    useEffect(() => {
        if (modalOpen) fetchMeta();
    }, [modalOpen, fetchMeta]);

    const openAdd = () => {
        setEditing(null);
        setForm({ name: '', code: '', category: '', batch: '', unit: 'pcs', price: 0, stock: 0, lowStockThreshold: 5 });
        setModalOpen(true);
    };

    const openEdit = (p: Product) => {
        setEditing(p);
        setForm({
            name: p.name,
            code: p.code || '',
            category: p.category || '',
            batch: p.batch || '',
            unit: p.unit || 'pcs',
            price: p.price,
            stock: p.stock,
            lowStockThreshold: p.lowStockThreshold ?? 5,
        });
        setModalOpen(true);
    };

    const saveProduct = () => {
        if (!form.name.trim()) {
            Notification({ text: t('pos_product_name_required'), color: 'warning' });
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) return;
        if (editing) {
            axios
                .put(`${ServerSetting.apiUrl}/pos/products/${editing._id}`, form, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
                .then((r) => {
                    if (r.data?.data) {
                        Notification({ text: t('pos_product_updated'), color: 'success' });
                        setModalOpen(false);
                        fetchList();
                        fetchMeta();
                    } else Notification({ text: r.data?.message || t('pos_update_failed_short'), color: 'danger' });
                })
                .catch((e) => Notification({ text: e.response?.data?.message || t('pos_update_failed_short'), color: 'danger' }));
        } else {
            axios
                .post(`${ServerSetting.apiUrl}/pos/products`, form, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true })
                .then((r) => {
                    if (r.data?.data) {
                        Notification({ text: t('pos_product_added'), color: 'success' });
                        setModalOpen(false);
                        fetchList();
                        fetchMeta();
                    } else Notification({ text: r.data?.message || t('pos_add_failed'), color: 'danger' });
                })
                .catch((e) => Notification({ text: e.response?.data?.message || t('pos_add_failed'), color: 'danger' }));
        }
    };

    const categories = Array.from(new Set(list.map((p) => p.category).filter(Boolean))) as string[];

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('pos_products_title')}
                description={t('pos_products_desc')}
                rightContent={
                    <button type="button" className="btn btn-outline-white" onClick={openAdd}>
                        {t('pos_add_product_btn')}
                    </button>
                }
                icon={<span>📦</span>}
            />

            <div className="panel p-5 rounded-2xl border border-white-dark/10 shadow-sm dark:border-white/5">
                <div className="flex flex-wrap items-end gap-4 mb-5">
                    <div className="w-56">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('pos_search')}</label>
                        <input type="text" placeholder={t('pos_name_or_code')} value={search} onChange={(e) => setSearch(e.target.value)} className="form-input w-full rounded-lg" />
                    </div>
                    <div className="w-44">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('pos_category')}</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-select w-full rounded-lg">
                            <option value="">{t('pos_all_categories')}</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pb-2">
                        <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} className="form-checkbox rounded text-primary-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('pos_low_stock_only')}</span>
                    </label>
                </div>
                {loading ? (
                    <div className="flex justify-center py-8"><span className="animate-spin inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
                ) : (
                    <div className="datatables">
                        <DataTable
                            idAccessor="_id"
                            className="whitespace-nowrap table-hover"
                            highlightOnHover
                            records={list.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)}
                            columns={[
                                { accessor: 'name', title: t('pos_col_name'), render: (p) => <span className="font-medium">{p.name}</span> },
                                { accessor: 'code', title: t('pos_col_code'), render: (p) => p.code || '—' },
                                { accessor: 'category', title: t('pos_category'), render: (p) => p.category || '—' },
                                { accessor: 'price', title: t('pos_col_price'), textAlignment: 'right', render: (p) => `Rs ${p.price.toLocaleString()}` },
                                {
                                    accessor: 'stock',
                                    title: t('pos_col_stock'),
                                    textAlignment: 'right',
                                    render: (p) => <span className={p.stock <= (p.lowStockThreshold ?? 5) ? 'text-amber-600 dark:text-amber-400' : ''}>{p.stock}</span>,
                                },
                                { accessor: 'lowStockThreshold', title: t('pos_col_low'), textAlignment: 'right', render: (p) => p.lowStockThreshold ?? 5 },
                                {
                                    accessor: 'actions',
                                    title: t('pos_col_action'),
                                    textAlignment: 'right',
                                    render: (p) => (
                                        <button type="button" className="btn btn-sm btn-outline-primary rounded-lg inline-flex items-center gap-1.5" onClick={() => openEdit(p)} title={t('pos_edit_product_title')}>
                                            <IconPencil className="w-4 h-4" />
                                            {t('pos_edit')}
                                        </button>
                                    ),
                                },
                            ]}
                            totalRecords={list.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={(size) => { setPageSize(size); setPage(1); }}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) => t('pos_pagination_products', { from, to, total: totalRecords })}
                            noRecordsText={t('pos_no_products_table')}
                        />
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
                    <div className="bg-white dark:bg-[#0e1726] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-white-dark/10">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{editing ? t('pos_edit_product_title') : t('pos_add_product_title')}</h3>
                            <p className="text-sm text-gray-500 mt-0.5">{editing ? t('pos_edit_product_sub') : t('pos_add_product_sub')}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <PosInput label={t('pos_product_name')} required placeholder={t('pos_product_name_ph')} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                            <PosInput label={t('pos_code_sku')} hint={t('pos_code_hint')} placeholder={t('pos_code_ph')} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('pos_category')}</label>
                                <select
                                    value={meta.categories.includes(form.category) ? form.category : NEW_OPTION}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === NEW_OPTION) setForm((f) => ({ ...f, category: '' }));
                                        else setForm((f) => ({ ...f, category: v }));
                                    }}
                                    className="form-select w-full rounded-lg border border-white-dark/20 bg-white dark:bg-white/5 focus:border-primary-500"
                                >
                                    <option value="">{t('pos_select_placeholder')}</option>
                                    {meta.categories.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                    <option value={NEW_OPTION}>{t('pos_add_new_category')}</option>
                                </select>
                                {(!form.category || !meta.categories.includes(form.category)) && (
                                    <input
                                        type="text"
                                        placeholder={t('pos_new_category_ph')}
                                        value={form.category}
                                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                                        className="form-input w-full rounded-lg mt-2 border border-white-dark/20"
                                    />
                                )}
                            </div>
                            <PosInput label={t('pos_batch')} placeholder={t('pos_batch_ph')} value={form.batch} onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))} />
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('pos_unit')}</label>
                                <select
                                    value={meta.units.includes(form.unit) ? form.unit : NEW_OPTION}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === NEW_OPTION) setForm((f) => ({ ...f, unit: '' }));
                                        else setForm((f) => ({ ...f, unit: v }));
                                    }}
                                    className="form-select w-full rounded-lg border border-white-dark/20 bg-white dark:bg-white/5 focus:border-primary-500"
                                >
                                    <option value="">{t('pos_select_placeholder')}</option>
                                    {meta.units.map((u) => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                    <option value={NEW_OPTION}>{t('pos_add_new_unit')}</option>
                                </select>
                                {(!form.unit || !meta.units.includes(form.unit)) && (
                                    <input
                                        type="text"
                                        placeholder={t('pos_unit_ph')}
                                        value={form.unit}
                                        onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                                        className="form-input w-full rounded-lg mt-2 border border-white-dark/20"
                                    />
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <PosInput label={t('pos_price_rs')} type="number" min={0} placeholder="0" value={form.price || ''} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))} />
                                <PosInput label={t('pos_col_stock')} type="number" min={0} placeholder="0" value={form.stock || ''} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) || 0 }))} />
                            </div>
                            <PosInput label={t('pos_low_stock_alert')} hint={t('pos_low_stock_hint')} type="number" min={0} placeholder="5" value={form.lowStockThreshold || ''} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: Number(e.target.value) ?? 5 }))} />
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button type="button" className="btn btn-primary flex-1 rounded-xl py-2.5 font-semibold" onClick={saveProduct}>{t('pos_save_product')}</button>
                            <button type="button" className="btn btn-outline-secondary rounded-xl" onClick={() => setModalOpen(false)}>{t('pos_cancel')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PosProducts;
