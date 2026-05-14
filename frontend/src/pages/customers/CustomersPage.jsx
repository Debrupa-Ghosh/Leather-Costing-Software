import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { Plus, Search, Edit, Trash2, Users, Mail, Phone, MapPin } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    code: '', name: '', company: '', email: '', phone: '',
    address: '', city: '', state: '', country: '', postal_code: '',
    tax_id: '', credit_limit: '', is_export_customer: false, notes: ''
  });

  useEffect(() => {
    loadCustomers();
  }, [search, pagination.page]);

  const loadCustomers = async () => {
    try {
      const params = new URLSearchParams({ page: pagination.page, limit: pagination.limit });
      if (search) params.append('search', search);

      const res = await api.get(`/customers/?${params}`);
      setCustomers(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        credit_limit: parseFloat(form.credit_limit) || 0
      };

      if (editingId) {
        await api.put(`/customers/${editingId}`, payload);
        toast.success('Customer updated!');
      } else {
        await api.post('/customers/', payload);
        toast.success('Customer added!');
      }
      
      setShowModal(false);
      setEditingId(null);
      setForm({
        code: '', name: '', company: '', email: '', phone: '',
        address: '', city: '', state: '', country: '', postal_code: '',
        tax_id: '', credit_limit: '', is_export_customer: false, notes: ''
      });
      loadCustomers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save customer');
    }
  };

  const handleEdit = (customer) => {
    setEditingId(customer.id);
    setForm({
      code: customer.code || '',
      name: customer.name || '',
      company: customer.company || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      country: customer.country || '',
      postal_code: customer.postal_code || '',
      tax_id: customer.tax_id || '',
      credit_limit: customer.credit_limit || '',
      is_export_customer: customer.is_export_customer || false,
      notes: customer.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Deleted');
      loadCustomers();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <AppLayout title="Customer Management">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Customers</h2>
          <p>Manage your client database and credit limits.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ code: '', name: '', company: '', email: '', phone: '', address: '', city: '', state: '', country: '', postal_code: '', tax_id: '', credit_limit: '', is_export_customer: false, notes: '' }); setShowModal(true); }}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div className="navbar-search" style={{ width: '320px' }}>
          <Search size={14} color="var(--text-secondary)" />
          <input placeholder="Search customers by name, code, company..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-title">
            <Users size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Customer List
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{pagination.total} clients</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Customer Info</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Orders</th>
              <th>Credit Limit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>No customers found</td></tr>
            ) : customers.map((c, i) => (
              <motion.tr key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <td><code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{c.code}</code></td>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.company || '—'}</div>
                  {c.is_export_customer && <span className="badge badge-accent" style={{ marginTop: 4, fontSize: 10 }}>Export</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginBottom: 2 }}>
                    <Mail size={12} color="var(--text-secondary)" /> {c.email || '—'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <Phone size={12} color="var(--text-secondary)" /> {c.phone || '—'}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <MapPin size={12} color="var(--text-secondary)" /> {c.city ? `${c.city}, ` : ''}{c.country || '—'}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.total_orders}</div>
                  <div style={{ fontSize: 12, color: 'var(--success)' }}>${c.total_revenue?.toLocaleString()}</div>
                </td>
                <td style={{ fontWeight: 500 }}>${c.credit_limit?.toLocaleString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-outline btn-sm" style={{ padding: '5px 8px' }} title="Edit" onClick={() => handleEdit(c)}><Edit size={13} /></button>
                    <button className="btn btn-sm" style={{ padding: '5px 8px', background: 'rgba(169,50,38,0.1)', color: 'var(--danger)', border: '1px solid rgba(169,50,38,0.2)' }} onClick={() => handleDelete(c.id)} title="Delete"><Trash2 size={13} /></button>
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
              <h3 className="modal-title">{editingId ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Customer Code <span className="required">*</span></label>
                  <input className="form-control" placeholder="e.g. CUST001" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                </div>
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
                  <label className="form-label">Credit Limit ($)</label>
                  <input className="form-control" type="number" step="0.01" value={form.credit_limit} onChange={e => setForm({ ...form, credit_limit: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-control" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-control" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
                </div>
              </div>
              
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 20 }}>
                <input type="checkbox" id="isExport" checked={form.is_export_customer} onChange={e => setForm({ ...form, is_export_customer: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                <label htmlFor="isExport" style={{ fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Is Export Customer</label>
              </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Internal Notes</label>
                  <textarea className="form-control" rows={2} placeholder="Additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? <><Edit size={15} /> Update Customer</> : <><Plus size={15} /> Save Customer</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}
