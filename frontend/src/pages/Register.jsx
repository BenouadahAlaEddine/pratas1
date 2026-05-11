import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const user = await register(form.name, form.email, form.password);
      toast.success(`Welcome to ShopWave, ${user.name}! 🎉`);
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">⚡ ShopWave</div>
        <div className="auth-subtitle">Create your account</div>

        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="register-name" type="text" className="form-input" placeholder="John Doe"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="register-email" type="email" className="form-input" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="register-password" type="password" className="form-input" placeholder="Min 6 characters"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input id="register-confirm" type="password" className="form-input" placeholder="Repeat password"
              value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} required />
          </div>
          <button id="register-btn" type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? '⏳ Creating Account...' : '🚀 Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
