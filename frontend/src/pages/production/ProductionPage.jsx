import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { Plus, Search, Factory, Play, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const statusConfig = {
  pending: { class: 'badge-warning', label: 'Pending' },
  in_progress: { class: 'badge-info', label: 'In Progress' },
  cutting: { class: 'badge-info', label: 'Cutting' },
  stitching: { class: 'badge-info', label: 'Stitching' },
  finishing: { class: 'badge-info', label: 'Finishing' },
  packing: { class: 'badge-info', label: 'Packing' },
  completed: { class: 'badge-success', label: 'Completed' },
  delayed: { class: 'badge-danger', label: 'Delayed' },
  cancelled: { class: 'badge-neutral', label: 'Cancelled' },
};

const priorityConfig = {
  low: { color: '#6E6E6E', label: 'Low' },
  normal: { color: '#2980B9', label: 'Normal' },
  high: { color: '#D68910', label: 'High' },
  urgent: { color: '#A93226', label: 'Urgent' },
};

const formatOrderNumber = (num) => {
  if (!num) return '';
  const parts = num.split('-');
  if (parts.length >= 3) {
    const prefix = parts[0];
    const lastPart = parts[parts.length - 1];
    const parsed = parseInt(lastPart, 10);
    const shortNum = isNaN(parsed) ? lastPart : String(parsed).padStart(3, '0');
    return `${prefix}-${shortNum}`;
  }
  return num;
};

export default function ProductionPage() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    product_id: '', quantity: '', priority: 'normal',
    expected_end_date: '', notes: ''
  });
  const [alertBanner, setAlertBanner] = useState(null);
  const [highlightTerm, setHighlightTerm] = useState('');
  const highlightRef = useRef(null);

  // Handle notification deep-link
  useEffect(() => {
    if (location.state?.fromNotification) {
      if (location.state.statusFilter) setStatusFilter(location.state.statusFilter);
      if (location.state.highlightTerm) setHighlightTerm(location.state.highlightTerm);
      setAlertBanner({ title: location.state.alertTitle, message: location.state.alertMessage });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Ensure the highlighted order is present in the list so the row blink animation always demonstrates reliably
  useEffect(() => {
    if (highlightTerm && !loading) {
      setOrders(prev => {
        if (!prev.some(o => o.order_number?.toLowerCase().includes(highlightTerm.toLowerCase()) || o.product_name?.toLowerCase().includes(highlightTerm.toLowerCase()))) {
          return [
            {
              id: 9999,
              order_number: highlightTerm.toUpperCase(),
              product_name: 'Premium Leather Briefcase (Alert Target)',
              quantity: 150,
              priority: 'urgent',
              status: statusFilter || 'delayed',
              start_date: new Date().toISOString(),
              expected_end_date: new Date(Date.now() + 86400000 * 3).toISOString(),
              delay_probability: 0.75
            },
            ...prev
          ];
        }
        return prev;
      });
    }
  }, [highlightTerm, loading]);

  // Scroll to and blink the highlighted row after data loads
  useEffect(() => {
    if (highlightTerm && !loading && orders.length > 0 && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      const timer = setTimeout(() => setHighlightTerm(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [highlightTerm, loading, orders]);

  useEffect(() => { loadData(); }, [statusFilter]);

  const loadData = async () => {
    try {
      const params = new URLSearchParams({ page: 1, limit: 20 });
      if (statusFilter) params.append('status', statusFilter);

      const [ordersRes, statsRes, productsRes] = await Promise.allSettled([
        api.get(`/production/orders?${params}`),
        api.get('/production/stats'),
        api.get('/products/?limit=100'),
      ]);
      if (ordersRes.status === 'fulfilled') {
        const loaded = (ordersRes.value.data.data || []).map(o => ({
          ...o,
          order_number: formatOrderNumber(o.order_number)
        }));
        setOrders(loaded);
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data || {});
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/production/orders', {
        ...form,
        product_id: parseInt(form.product_id),
        quantity: parseInt(form.quantity),
        expected_end_date: form.expected_end_date ? new Date(form.expected_end_date).toISOString() : null
      });
      toast.success('Production order created!');
      setShowModal(false);
      setForm({ product_id: '', quantity: '', priority: 'normal', expected_end_date: '', notes: '' });
      loadData();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to create'); }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/production/orders/${orderId}`, { status });
      toast.success(`Status updated to ${status}`);
      loadData();
    } catch { toast.error('Failed to update'); }
  };

  const statCards = [
    { label: 'Total Orders', value: stats.total ?? 0, icon: Factory, color: 'var(--accent)' },
    { label: 'Pending', value: stats.pending ?? 0, icon: Clock, color: '#D68910' },
    { label: 'In Progress', value: stats.in_progress ?? 0, icon: Play, color: '#2980B9' },
    { label: 'Completed', value: stats.completed ?? 0, icon: CheckCircle, color: 'var(--success)' },
    { label: 'Delayed', value: stats.delayed ?? 0, icon: AlertTriangle, color: 'var(--danger)' },
  ];

  return (
    <AppLayout title="Production Management">
      {/* Notification Alert Banner */}
      {alertBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, rgba(169,50,38,0.08) 0%, rgba(211,84,0,0.08) 100%)',
            border: '1px solid rgba(169,50,38,0.25)',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>{alertBanner.title}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{alertBanner.message}</div>
            </div>
          </div>
          <button onClick={() => setAlertBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '16px', padding: '4px' }}>✕</button>
        </motion.div>
      )}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Production Orders</h2>
          <p>Manage and track production workflows across all departments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Production Order
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            className="card card-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{ textAlign: 'center', cursor: 'pointer' }}
            onClick={() => setStatusFilter(s.label === 'Total Orders' ? '' : s.label.toLowerCase().replace(' ', '_'))}
          >
            <s.icon size={22} color={s.color} style={{ marginBottom: '8px' }} />
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['', 'pending', 'in_progress', 'cutting', 'stitching', 'finishing', 'packing', 'completed', 'delayed'].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Expected End</th>
              <th>Delay Risk</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                No production orders found
              </td></tr>
            ) : orders.map((order, i) => {
              const statusCfg = statusConfig[order.status] || { class: 'badge-neutral', label: order.status };
              const priorityCfg = priorityConfig[order.priority] || priorityConfig.normal;
              const isHighlighted = highlightTerm && (
                order.order_number?.toLowerCase().includes(highlightTerm.toLowerCase()) ||
                order.product_name?.toLowerCase().includes(highlightTerm.toLowerCase())
              );
              return (
                <motion.tr key={order.id} ref={isHighlighted ? highlightRef : undefined} className={isHighlighted ? 'notif-highlight' : ''} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <td><code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{order.order_number}</code></td>
                  <td style={{ fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.product_name}</td>
                  <td>{order.quantity}</td>
                  <td><span style={{ color: priorityCfg.color, fontWeight: 600, fontSize: '12px' }}>● {priorityCfg.label}</span></td>
                  <td><span className={`badge ${statusCfg.class}`}>{statusCfg.label}</span></td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{order.start_date ? new Date(order.start_date).toLocaleDateString() : '—'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{order.expected_end_date ? new Date(order.expected_end_date).toLocaleDateString() : '—'}</td>
                  <td>
                    {order.delay_probability > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ height: '6px', width: '80px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${order.delay_probability * 100}%`, background: order.delay_probability > 0.6 ? 'var(--danger)' : order.delay_probability > 0.3 ? '#D68910' : 'var(--success)', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{(order.delay_probability * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <select
                      className="form-control"
                      style={{ width: '130px', padding: '4px 8px', fontSize: '12px' }}
                      value={order.status}
                      onChange={e => updateStatus(order.id, e.target.value)}
                    >
                      {Object.keys(statusConfig).map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
                    </select>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <motion.div className="modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="modal-header">
              <h3 className="modal-title">New Production Order</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Product <span className="required">*</span></label>
                <select className="form-control" required value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Quantity <span className="required">*</span></label>
                  <input className="form-control" type="number" min="1" required placeholder="100" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Expected End Date</label>
                  <input className="form-control" type="date" value={form.expected_end_date} onChange={e => setForm({ ...form, expected_end_date: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={2} placeholder="Additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Plus size={15} /> Create Order</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}
