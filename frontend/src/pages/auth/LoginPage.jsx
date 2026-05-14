import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(211,84,0,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-150px', left: '-100px',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(211,84,0,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div className="auth-container">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <img 
              src="/src/assets/logo.png" 
              alt="Logo" 
              style={{ 
                width: 70, height: 70, borderRadius: '18px', 
                margin: '0 auto 16px', display: 'block',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                objectFit: 'cover'
              }} 
            />
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
              Welcome Back
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Sign in to <strong style={{ color: 'var(--accent)' }}>LeatherPro AI ERP</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Demo credentials */}
            <div style={{
              background: 'rgba(211,84,0,0.06)', border: '1px solid rgba(211,84,0,0.15)',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '24px',
              fontSize: '13px', color: 'var(--text-secondary)'
            }}>
              <strong style={{ color: 'var(--accent)' }}>Demo:</strong> admin@leatherpro.com / admin123
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  className="form-control"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  className="form-control"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '13px' }}
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading ? <><Loader size={16} className="spinning" /> Signing in...</> : 'Sign In to ERP'}
            </motion.button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Create Account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
