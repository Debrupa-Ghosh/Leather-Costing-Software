import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { Plus, Search, Edit, Trash2, Package, Target } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function ProductsPage() {
  const { formatCurrency, symbol } = useCurrency();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    sku: '', name: '', category: 'bag', description: '',
    unit: 'piece', selling_price: '', weight: ''
  });

  useEffect(() => {
    loadProducts();
  }, [search, pagination.page]);

  const loadProducts = async () => {
    try {
      const params = new URLSearchParams({ page: pagination.page, limit: pagination.limit });
      if (search) params.append('search', search);

      const res = await api.get(`/products/?${params}`);
      setProducts(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        selling_price: parseFloat(form.selling_price) || 0,
        weight: form.weight ? parseFloat(form.weight) : null
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products/', payload);
        toast.success('Product created!');
      }
      
      setShowModal(false);
      setEditingId(null);
      setForm({ sku: '', name: '', category: 'bag', description: '', unit: 'piece', selling_price: '', weight: '' });
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      sku: product.sku || '',
      name: product.name || '',
      category: product.category || 'bag',
      description: product.description || '',
      unit: product.unit || 'piece',
      selling_price: product.selling_price || '',
      weight: product.weight || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Deleted');
      loadProducts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <AppLayout title="Products & Costing">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Products</h2>
          <p>Manage your leather product catalog and calculate costs.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ sku: '', name: '', category: 'bag', description: '', unit: 'piece', selling_price: '', weight: '' }); setShowModal(true); }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div className="navbar-search" style={{ width: '320px' }}>
          <Search size={14} color="var(--text-secondary)" />
          <input placeholder="Search products by SKU or name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-title">
            <Package size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Product Catalog
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{pagination.total} items</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Selling Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>No products found</td></tr>
            ) : products.map((p, i) => (
              <motion.tr key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <td><code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{p.sku}</code></td>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td><span className="badge badge-accent">{p.category}</span></td>
                <td>{p.unit}</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(p.selling_price)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-outline btn-sm" style={{ padding: '5px 8px' }} title="Edit" onClick={() => handleEdit(p)}><Edit size={13} /></button>
                    <button className="btn btn-sm" style={{ padding: '5px 8px', background: 'rgba(169,50,38,0.1)', color: 'var(--danger)', border: '1px solid rgba(169,50,38,0.2)' }} onClick={() => handleDelete(p.id)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <motion.div className="modal" style={{ maxWidth: '640px' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">SKU <span className="required">*</span></label>
                  <input className="form-control" placeholder="e.g. LF-BAG-001" required value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Product Name <span className="required">*</span></label>
                  <input className="form-control" placeholder="e.g. Classic Leather Tote" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="bag">Bag</option>
                    <option value="wallet">Wallet</option>
                    <option value="belt">Belt</option>
                    <option value="shoe">Shoe</option>
                    <option value="jacket">Jacket</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input className="form-control" placeholder="e.g. piece, pair" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price ($)</label>
                  <input className="form-control" type="number" step="0.01" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (g)</label>
                  <input className="form-control" type="number" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={2} placeholder="Product description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? <><Edit size={15} /> Update Product</> : <><Plus size={15} /> Add Product</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}
