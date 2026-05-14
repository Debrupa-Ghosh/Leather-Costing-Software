import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader, ArrowLeft, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password, 3: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      toast.success(res?.message || 'Verification code sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Email address not found');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the verification code');
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email, otp, newPassword);
      toast.success(res?.message || 'Password reset successfully! 🎉');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid verification code or code expired');
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
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 700, marginBottom: '8px' }}>
              {step === 1 && 'Forgot Password?'}
              {step === 2 && 'Secure Password Reset'}
              {step === 3 && 'Password Updated!'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {step === 1 && 'Enter your registered email address to receive a secure OTP verification code.'}
              {step === 2 && <>Verification code sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong></>}
              {step === 3 && 'Your account credentials have been successfully updated.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleRequestOtp}
              >
                <div className="form-group">
                  <label className="form-label">Registered Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      className="form-control"
                      type="email"
                      placeholder="employee@leatherpro.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{ paddingLeft: '42px' }}
                      required
                    />
                  </div>
                </div>

                <motion.button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '13px' }}
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {loading ? <><Loader size={16} className="spinning" /> Verifying & Sending OTP...</> : 'Send Verification OTP'}
                </motion.button>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
                    <ArrowLeft size={14} /> Back to Sign In
                  </Link>
                </div>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleResetPassword}
              >
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>6-Digit OTP Code</label>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Change Email
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      className="form-control"
                      type="text"
                      placeholder="e.g. 482910"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      style={{ paddingLeft: '42px', letterSpacing: '4px', fontWeight: 600 }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      className="form-control"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{ paddingLeft: '42px', paddingRight: '42px' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      className="form-control"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{ paddingLeft: '42px', paddingRight: '42px' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '13px' }}
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {loading ? <><Loader size={16} className="spinning" /> Resetting Password...</> : 'Confirm & Reset Password'}
                </motion.button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                style={{ textAlign: 'center', padding: '20px 0' }}
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  style={{ 
                    width: 64, height: 64, background: 'rgba(39, 174, 96, 0.1)', 
                    color: 'var(--success)', borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    margin: '0 auto 20px' 
                  }}
                >
                  <CheckCircle2 size={36} />
                </motion.div>

                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Password Reset Completed!
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
                  You can now sign in to your ERP dashboard using your new security credentials.
                </p>

                <motion.button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '13px' }}
                  onClick={() => navigate('/login')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Proceed to Sign In
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
