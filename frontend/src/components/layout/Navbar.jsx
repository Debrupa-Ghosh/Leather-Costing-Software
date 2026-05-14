import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Settings, RefreshCw, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function Navbar({ title }) {
  const { user, profilePhoto } = useAuth();
  const { currency, setCurrency, isINR, toggleCurrency, symbol } = useCurrency();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const DEFAULT_NOTIFS = [
    { id: 1, type: 'warning', title: 'Low Stock Alert', message: 'Full Grain Cowhide - Nubuck Suede has fallen below reorder point', is_read: false },
    { id: 2, type: 'success', title: 'New Order Received', message: 'Order SO-001 from Smith Retail Group for $12,500', is_read: false },
    { id: 3, type: 'danger', title: 'Production Delay Risk', message: 'PO-003 has 75% delay probability - immediate attention needed', is_read: false },
    { id: 4, type: 'info', title: 'AI Model Updated', message: 'Cost prediction model retrained with 94% accuracy', is_read: true },
    { id: 5, type: 'danger', title: 'Quality Inspection Failed', message: 'QC00003 reported critical defect: Scratch mark on batch items', is_read: false }
  ];

  const loadNotifications = async () => {
    try {
      const res = await api.get('/dashboard/notifications');
      const loaded = res.data?.data?.notifications || [];
      if (loaded.length > 0) {
        setNotifications(loaded);
        setUnreadCount(res.data.data.unread_count || 0);
      } else {
        setNotifications(DEFAULT_NOTIFS);
        setUnreadCount(4);
      }
    } catch {
      setNotifications(DEFAULT_NOTIFS);
      setUnreadCount(4);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/dashboard/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Extract a search keyword from the notification message
  const extractSearchTerm = (n) => {
    const msg = n.message || '';
    // Extract Quality check numbers
    const qcMatch = msg.match(/(QC\d+)/i);
    if (qcMatch) return qcMatch[1];
    // Extract Order/Production numbers (SO-xxx, PO-xxx)
    const orderMatch = msg.match(/(SO-\d+|PO-\d+)/i);
    if (orderMatch) return orderMatch[1];
    // Try to extract material names like "Full Grain Cowhide - Nubuck Suede"
    const dashSplit = msg.split(' - ');
    if (dashSplit.length > 1) return dashSplit[0].trim();
    // Fallback: extract first meaningful phrase
    const beforeHas = msg.split(' has ')[0];
    if (beforeHas && beforeHas.length < 60) return beforeHas.trim();
    return '';
  };

  const handleNotificationClick = async (n) => {
    await markRead(n.id);
    setShowNotifs(false);
    
    const title = n.title?.toLowerCase() || '';
    const msg = n.message?.toLowerCase() || '';
    const searchTerm = extractSearchTerm(n);
    const alertState = { fromNotification: true, alertTitle: n.title, alertMessage: n.message, searchTerm, highlightTerm: searchTerm };
    
    if (title.includes('stock') || msg.includes('stock') || msg.includes('reorder')) {
      navigate('/inventory', { state: { ...alertState, showLowStock: true } });
    } else if (title.includes('production') || msg.includes('delay') || msg.includes('risk')) {
      navigate('/production', { state: { ...alertState, statusFilter: '' } }); // empty filter to show all where target can be highlighted
    } else if (title.includes('qc') || title.includes('quality') || title.includes('defect') || msg.includes('qc')) {
      navigate('/quality', { state: alertState });
    } else if (title.includes('order') || msg.includes('order') || msg.includes('so-') || msg.includes('po-')) {
      navigate('/orders', { state: alertState });
    } else if (title.includes('model') || title.includes('ai') || msg.includes('predict') || msg.includes('retrain')) {
      navigate('/reports', { state: alertState });
    } else {
      navigate('/dashboard', { state: alertState });
    }
  };

  const typeColors = {
    info: '#2980B9', warning: '#D68910', success: '#6B8E23', danger: '#A93226'
  };

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <button 
          onClick={toggleSidebar}
          className="navbar-btn"
          title="Toggle Sidebar"
          style={{ border: 'none', background: 'transparent' }}
        >
          <Menu size={20} color="var(--text-primary)" />
        </button>
        <h2 className="navbar-title" style={{ flex: 'none' }}>{title}</h2>
      </div>

      {/* Actions */}
      <div className="navbar-actions">
        {/* Currency Selector Buttons */}
        <div style={{ display: 'flex', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2px', gap: '2px' }}>
          <button
            onClick={() => setCurrency?.('USD')}
            style={{
              padding: '4px 12px',
              borderRadius: '18px',
              border: 'none',
              background: !isINR ? 'var(--accent)' : 'transparent',
              color: !isINR ? '#fff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            $ USD
          </button>
          <button
            onClick={() => setCurrency?.('INR')}
            style={{
              padding: '4px 12px',
              borderRadius: '18px',
              border: 'none',
              background: isINR ? 'var(--accent)' : 'transparent',
              color: isINR ? '#fff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ₹ INR
          </button>
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="navbar-btn" onClick={() => setShowNotifs(!showNotifs)}>
            <Bell size={17} />
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  width: '340px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
                  zIndex: 300,
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>Notifications</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          setNotifications([]);
                          setUnreadCount(0);
                        }}
                        style={{ border: 'none', background: 'transparent', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, padding: '2px 6px', borderRadius: '4px' }}
                      >
                        Clear All
                      </button>
                    )}
                    {unreadCount > 0 && <span className="badge badge-accent">{unreadCount} new</span>}
                  </div>
                </div>
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      No notifications
                    </div>
                  ) : notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        padding: '14px 20px',
                        borderBottom: '1px solid rgba(229,211,197,0.5)',
                        cursor: 'pointer',
                        background: n.is_read ? 'transparent' : 'rgba(211,84,0,0.03)',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: typeColors[n.type] || 'var(--accent)',
                          marginTop: '5px', flexShrink: 0
                        }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{n.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{n.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="navbar-btn" onClick={() => navigate('/settings')}>
          <Settings size={17} />
        </button>

        {/* User Avatar */}
        <div
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '13px',
            cursor: 'pointer', overflow: 'hidden'
          }}
          onClick={() => navigate('/settings')}
        >
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'LP'
          )}
        </div>
      </div>
    </header>
  );
}
