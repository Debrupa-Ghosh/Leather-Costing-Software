import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { Plus, Search, Edit, Trash2, Truck, Mail, Phone, MapPin, Star } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '',
    address: '', city: '', country: '', tax_number: '',
    quality_rating: '', delivery_rating: '', price_rating: '',
    payment_terms: '', lead_time_days: 7, notes: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, [search, pagination.page]);

  const loadSuppliers = async () => {
    try {
      const params = new URLSearchParams({ page: pagination.page, limit: pagination.limit });
      if (search) params.append('search', search);

      const res = await api.get(`/suppliers/?${params}`);
      setSuppliers(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        quality_rating: parseFloat(form.quality_rating) || 0,
        delivery_rating: parseFloat(form.delivery_rating) || 0,
        price_rating: parseFloat(form.price_rating) || 0,
        lead_time_days: parseInt(form.lead_time_days) || 7
      };

      if (editingId) {
        await api.put(`/suppliers/${editingId}`, payload);
        toast.success('Supplier updated!');
      } else {
        await api.post('/suppliers/', payload);
        toast.success('Supplier added!');
      }
      
      setShowModal(false);
      setEditingId(null);
      setForm({
        name: '', company: '', email: '', phone: '',
        address: '', city: '', country: '', tax_number: '',
        quality_rating: '', delivery_rating: '', price_rating: '',
        payment_terms: '', lead_time_days: 7, notes: ''
      });
      loadSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save supplier');
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name || '',
      company: supplier.company || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      country: supplier.country || '',
      tax_number: supplier.tax_number || '',
      quality_rating: supplier.quality_rating || '',
      delivery_rating: supplier.delivery_rating || '',
      price_rating: supplier.price_rating || '',
      payment_terms: supplier.payment_terms || '',
      lead_time_days: supplier.lead_time_days || 7,
      notes: supplier.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Deleted');
      loadSuppliers();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <AppLayout title="Supplier Management">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Suppliers</h2>
          <p>Manage your raw material providers and their performance ratings.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ name: '', company: '', email: '', phone: '', address: '', city: '', country: '', tax_number: '', quality_rating: '', delivery_rating: '', price_rating: '', payment_terms: '', lead_time_days: 7, notes: '' }); setShowModal(true); }}>
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div className="navbar-search" style={{ width: '320px' }}>
          <Search size={14} color="var(--text-secondary)" />
          <input placeholder="Search suppliers by name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-title">
            <Truck size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Supplier List
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{pagination.total} suppliers</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Supplier Info</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Rating</th>
              <th>Lead Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>No suppliers found</td></tr>
            ) : suppliers.map((s, i) => (
              <motion.tr key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <td><code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{s.code}</code></td>
                <td>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.company || '—'}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginBottom: 2 }}>
                    <Mail size={12} color="var(--text-secondary)" /> {s.email || '—'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <Phone size={12} color="var(--text-secondary)" /> {s.phone || '—'}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <MapPin size={12} color="var(--text-secondary)" /> {s.city ? `${s.city}, ` : ''}{s.country || '—'}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <Star size={14} color="var(--warning)" fill="var(--warning)" /> {s.overall_rating?.toFixed(1) || '0.0'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Q:{s.quality_rating} D:{s.delivery_rating} P:{s.price_rating}
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{s.lead_time_days} days</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-outline btn-sm" style={{ padding: '5px 8px' }} title="Edit" onClick={() => handleEdit(s)}><Edit size={13} /></button>
                    <button className="btn btn-sm" style={{ padding: '5px 8px', background: 'rgba(169,50,38,0.1)', color: 'var(--danger)', border: '1px solid rgba(169,50,38,0.2)' }} onClick={() => handleDelete(s.id)} title="Delete"><Trash2 size={13} /></button>
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
              <h3 className="modal-title">{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Contact Name <span className="required">*</span></label>
                  <input className="form-control" placeholder="John Doe" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input className="form-control" placeholder="Company Ltd." value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" placeholder="+1..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-control" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-control" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Number</label>
                  <input className="form-control" value={form.tax_number} onChange={e => setForm({ ...form, tax_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Lead Time (Days)</label>
                  <input className="form-control" type="number" min="1" value={form.lead_time_days} onChange={e => setForm({ ...form, lead_time_days: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Quality Rating (0-5)</label>
                  <input className="form-control" type="number" step="0.1" min="0" max="5" value={form.quality_rating} onChange={e => setForm({ ...form, quality_rating: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Rating (0-5)</label>
                  <input className="form-control" type="number" step="0.1" min="0" max="5" value={form.delivery_rating} onChange={e => setForm({ ...form, delivery_rating: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Price Rating (0-5)</label>
                  <input className="form-control" type="number" step="0.1" min="0" max="5" value={form.price_rating} onChange={e => setForm({ ...form, price_rating: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Terms</label>
                  <input className="form-control" placeholder="e.g. Net 30" value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Internal Notes</label>
                  <textarea className="form-control" rows={2} placeholder="Additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? <><Edit size={15} /> Update Supplier</> : <><Plus size={15} /> Save Supplier</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}
