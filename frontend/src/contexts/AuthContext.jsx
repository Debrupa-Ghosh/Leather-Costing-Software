import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('profilePhoto') || null);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, access_token, refresh_token } = res.data.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { user, access_token, refresh_token } = res.data.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (email, otp, new_password) => {
    const res = await api.post('/auth/reset-password', { email, otp, new_password });
    return res.data;
  };

  const updateProfilePhoto = (photoBase64) => {
    if (photoBase64) {
      localStorage.setItem('profilePhoto', photoBase64);
      setProfilePhoto(photoBase64);
    } else {
      localStorage.removeItem('profilePhoto');
      setProfilePhoto(null);
    }
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') return user.role === roles;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, forgotPassword, resetPassword, hasRole, loadUser, profilePhoto, updateProfilePhoto }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
