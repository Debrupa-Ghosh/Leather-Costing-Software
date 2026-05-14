import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, Phone, Briefcase, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const roles = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'factory_manager', label: 'Factory Manager' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'production_manager', label: 'Production Manager' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
  { value: 'worker', label: 'Worker' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '',
    department: '', role: 'worker'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) {
      toast.error('Please fill required fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="auth-page">
      <div className="auth-container">
        <motion.div
          className="auth-card"
          style={{ maxWidth: '520px' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>
              Create Account
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Join LeatherPro AI ERP</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input className="form-control" placeholder="John Smith" style={{ paddingLeft: '38px' }} {...f('full_name')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input className="form-control" placeholder="+1 234 567 8900" style={{ paddingLeft: '38px' }} {...f('phone')} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input className="form-control" type="email" placeholder="your@email.com" style={{ paddingLeft: '38px' }} {...f('email')} />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Department</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input className="form-control" placeholder="e.g. Production" style={{ paddingLeft: '38px' }} {...f('department')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" {...f('role')}>
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input className="form-control" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" style={{ paddingLeft: '38px', paddingRight: '38px' }} {...f('password')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <motion.button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px' }}
              type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            >
              {loading ? <><Loader size={15} /> Creating Account...</> : 'Create Account'}
            </motion.button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
