import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import {
  LayoutDashboard, Package, Layers, Factory, ShoppingCart,
  Users, Truck, ClipboardCheck, BarChart3, Settings, LogOut,
  Brain, Warehouse, FileText, ChevronLeft, Camera
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
      { label: 'AI Insights', icon: Brain, to: '/ai-insights' },
    ]
  },
  {
    title: 'Manufacturing',
    items: [
      { label: 'Raw Materials', icon: Package, to: '/inventory' },
      { label: 'Products', icon: Layers, to: '/products' },
      { label: 'BOM', icon: FileText, to: '/bom' },
      { label: 'Production', icon: Factory, to: '/production' },
      { label: 'Warehouses', icon: Warehouse, to: '/warehouses' },
    ]
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Orders', icon: ShoppingCart, to: '/orders' },
      { label: 'Customers', icon: Users, to: '/customers' },
      { label: 'Suppliers', icon: Truck, to: '/suppliers' },
    ]
  },
  {
    title: 'Quality & Reports',
    items: [
      { label: 'Quality Control', icon: ClipboardCheck, to: '/quality' },
      { label: 'Reports', icon: BarChart3, to: '/reports' },
    ]
  },
  {
    title: 'Administration',
    items: [
      { label: 'Settings', icon: Settings, to: '/settings' },
    ]
  }
];

const SidebarItem = ({ item, isCollapsed }) => (
  <NavLink 
    to={item.to} 
    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
    title={isCollapsed ? item.label : undefined}
    style={{ 
      justifyContent: isCollapsed ? 'center' : 'flex-start', 
      paddingLeft: isCollapsed ? 0 : '20px', 
      paddingRight: isCollapsed ? 0 : '20px' 
    }}
  >
    <item.icon className="sidebar-icon" size={17} style={{ margin: isCollapsed ? '0 auto' : undefined }} />
    {!isCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
    {!isCollapsed && item.badge && <span className="sidebar-badge">{item.badge}</span>}
  </NavLink>
);

export default function Sidebar() {
  const { user, logout, profilePhoto, updateProfilePhoto } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfilePhoto(reader.result);
        toast.success('Profile photo updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'LP';
  const roleLabels = {
    super_admin: 'Super Admin',
    factory_manager: 'Factory Manager',
    accountant: 'Accountant',
    production_manager: 'Production Mgr',
    inventory_manager: 'Inventory Mgr',
    worker: 'Worker'
  };

  return (
    <motion.aside
      className="sidebar"
      style={{ width: isCollapsed ? '72px' : '260px', transition: 'width 0.3s ease' }}
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Logo */}
      <div className="sidebar-logo" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', paddingLeft: isCollapsed ? 0 : '20px', paddingRight: isCollapsed ? 0 : '20px', position: 'relative' }}>
        <img src="/src/assets/logo.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
        {!isCollapsed && (
          <div className="sidebar-logo-text" style={{ flex: 1, minWidth: 0 }}>
            <h1>LeatherPro</h1>
            <span style={{ display: 'block', whiteSpace: 'nowrap', fontSize: '9px', letterSpacing: '0.5px' }}>MANAGE • TRACK • OPTIMIZE</span>
          </div>
        )}
        {!isCollapsed && (
          <button 
            onClick={toggleSidebar} 
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '6px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Close Sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map(section => (
          <div key={section.title}>
            {!isCollapsed && <div className="sidebar-section-title">{section.title}</div>}
            {isCollapsed && <div style={{ height: '12px' }} />}
            {section.items.map(item => (
              <SidebarItem key={item.to} item={item} isCollapsed={isCollapsed} />
            ))}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer" style={{ padding: isCollapsed ? '16px 0' : '16px 20px', display: 'flex', justifyContent: 'center' }}>
        <div className="user-card" style={{ width: '100%', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
          <label className="user-avatar" style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative', margin: 0 }} title="Click to change profile photo">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
              <Camera size={14} color="#fff" />
            </div>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </label>
          {!isCollapsed && (
            <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.full_name || 'User'}
              </h4>
              <span>{roleLabels[user?.role] || user?.role}</span>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
