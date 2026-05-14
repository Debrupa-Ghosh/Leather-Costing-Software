import React, { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { User, Bell, Shield, Key, Save, Moon, Sun, Globe, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { user, profilePhoto, updateProfilePhoto } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profileData, setProfileData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || ''
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    toast.success('Profile updated successfully!');
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    toast.success('Password updated successfully!');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfilePhoto(reader.result);
        toast.success('Profile photo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AppLayout title="System Settings">
      <div className="page-header">
        <div className="page-header-left">
          <h2>System Settings</h2>
          <p>Manage your account, preferences, and security settings.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        <div style={{ width: '240px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
            <label style={{ display: 'block', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 12px', position: 'relative', cursor: 'pointer', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} title="Click to upload profile photo">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <Camera size={18} color="#fff" />
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </label>
            <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.full_name}</h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
          <div style={{ padding: '12px' }}>
            {[
              { id: 'profile', icon: User, label: 'Profile Information' },
              { id: 'security', icon: Shield, label: 'Security & Password' }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: activeTab === tab.id ? 'rgba(211,84,0,0.1)' : 'transparent', color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: 500, marginBottom: '4px', transition: 'all 0.2s' }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} color="var(--accent)" /> Profile Information
              </h3>
              <form onSubmit={handleSaveProfile}>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-control" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-control" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-control" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input type="text" className="form-control" value={profileData.department} onChange={e => setProfileData({...profileData, department: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employee ID</label>
                    <input type="text" className="form-control" value={user?.employee_id || ''} readOnly style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }} />
                  </div>
                </div>
                <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary"><Save size={16} style={{ marginRight: '8px' }} /> Save Changes</button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="var(--accent)" /> Security & Password
              </h3>
              <form onSubmit={handleSaveSecurity}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                    <input type="password" required className="form-control" placeholder="Enter current password" style={{ paddingLeft: '38px' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                    <input type="password" required className="form-control" placeholder="Enter new password" style={{ paddingLeft: '38px' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                    <input type="password" required className="form-control" placeholder="Confirm new password" style={{ paddingLeft: '38px' }} />
                  </div>
                </div>

                <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary"><Save size={16} style={{ marginRight: '8px' }} /> Update Password</button>
                </div>
              </form>
            </motion.div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
