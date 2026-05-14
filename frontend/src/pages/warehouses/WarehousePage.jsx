import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { Plus, Search, Edit, Trash2, Package, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    location: '',
    capacity: '',
    manager_name: '',
    phone: '',
    is_active: true
  });

  const handleToggleStatus = async (warehouse) => {
    try {
      await api.put(`/inventory/warehouses/${warehouse.id}`, {
        is_active: !warehouse.is_active
      });
      toast.success(`Warehouse ${!warehouse.is_active ? 'reactivated' : 'deactivated'} successfully`);
      loadWarehouses();
    } catch {
      toast.error('Failed to update warehouse status');
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, [search]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/warehouses');
      let data = res.data.data || [];
      if (search) {
        const lowerSearch = search.toLowerCase();
        data = data.filter(w => 
          w.name.toLowerCase().includes(lowerSearch) || 
          (w.code && w.code.toLowerCase().includes(lowerSearch)) ||
          (w.location && w.location.toLowerCase().includes(lowerSearch))
        );
      }
      setWarehouses(data);
    } catch { 
      toast.error('Failed to load warehouses'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        capacity: form.capacity ? parseFloat(form.capacity) : null,
      };

      if (editingId) {
        await api.put(`/inventory/warehouses/${editingId}`, payload);
        toast.success('Warehouse updated!');
      } else {
        await api.post('/inventory/warehouses', payload);
        toast.success('Warehouse added!');
      }
      
      setShowModal(false);
      setEditingId(null);
      setForm({ name: '', location: '', capacity: '', manager_name: '', phone: '', is_active: true });
      loadWarehouses();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save warehouse');
    }
  };

  const handleEdit = (warehouse) => {
    setEditingId(warehouse.id);
    setForm({
      name: warehouse.name || '',
      location: warehouse.location || '',
      capacity: warehouse.capacity || '',
      manager_name: warehouse.manager_name || '',
      phone: warehouse.phone || '',
      is_active: warehouse.is_active ?? true
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this warehouse?')) return;
    try {
      await api.delete(`/inventory/warehouses/${id}`);
      toast.success('Deleted successfully');
      loadWarehouses();
    } catch { 
      toast.error('Failed to delete warehouse'); 
    }
  };

  return (
    <AppLayout title="Warehouse Management">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Warehouses</h2>
          <p>Manage warehouse locations, capacities, and managers</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => { 
            setEditingId(null); 
            setForm({ name: '', location: '', capacity: '', manager_name: '', phone: '', is_active: true }); 
            setShowModal(true); 
          }}>
            <Plus size={16} /> Add Warehouse
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="navbar-search" style={{ width: '320px' }}>
          <Search size={14} color="var(--text-secondary)" />
          <input 
            placeholder="Search by name, code or location..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-title">
            <Package size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Warehouse List
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{warehouses.length} items</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Location</th>
              <th>Capacity</th>
              <th>Manager</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</td></tr>
            ) : warehouses.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '48px' }}>
                  <Package size={40} style={{ color: 'var(--border)', marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No warehouses found</div>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => setShowModal(true)}>
                    <Plus size={14} /> Add First Warehouse
                  </button>
                </td>
              </tr>
            ) : warehouses.map((w, i) => (
              <motion.tr
                key={w.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <td><code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{w.code}</code></td>
                <td style={{ fontWeight: 500 }}>{w.name}</td>
                <td>{w.location || '—'}</td>
                <td>{w.capacity ? `${w.capacity} sqft` : '—'}</td>
                <td>{w.manager_name || '—'}</td>
                <td>{w.phone || '—'}</td>
                <td>
                  <span className={`badge ${w.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {w.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-outline btn-sm" style={{ padding: '5px 8px' }} title="Edit" onClick={() => handleEdit(w)}>
                      <Edit size={13} />
                    </button>
                    {w.is_active ? (
                      <button className="btn btn-sm" style={{ padding: '5px 8px', background: 'rgba(169,50,38,0.1)', color: 'var(--danger)', border: '1px solid rgba(169,50,38,0.2)' }} onClick={() => handleDelete(w.id)} title="Deactivate">
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      <button className="btn btn-sm" style={{ padding: '5px 8px', background: 'rgba(39,174,96,0.1)', color: 'var(--success)', border: '1px solid rgba(39,174,96,0.2)' }} onClick={() => handleToggleStatus(w)} title="Reactivate">
                        <CheckCircle size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <motion.div className="modal" style={{ maxWidth: '500px' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Warehouse' : 'Add Warehouse'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Warehouse Name <span className="required">*</span></label>
                <input className="form-control" placeholder="e.g. Main Warehouse A" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-control" placeholder="e.g. North Wing, Sector 4" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity (sqft)</label>
                <input className="form-control" type="number" step="0.1" placeholder="e.g. 5000" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Manager Name</label>
                <input className="form-control" placeholder="e.g. John Doe" value={form.manager_name} onChange={e => setForm({ ...form, manager_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" placeholder="e.g. +1 234 567 8900" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>

              {editingId && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                  <input 
                    type="checkbox" 
                    id="is_active_check" 
                    checked={form.is_active} 
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <label htmlFor="is_active_check" style={{ margin: 0, fontWeight: 500, cursor: 'pointer' }}>
                    Warehouse is Active
                  </label>
                </div>
              )}


              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                   {editingId ? <><Edit size={15} /> Update Warehouse</> : <><Plus size={15} /> Add Warehouse</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}
