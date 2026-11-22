import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { API_CONFIGURED } from '../api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create account.');
    } finally {
      setBusy(false);
    }
  };

  const field = (key, label, type = 'text', extra = {}) => (
    <label>
      {label}
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        {...extra}
      />
    </label>
  );

  return (
    <main className="auth-shell">
      <section className="auth-card wide">
        <div className="brand-mark">@mInspect</div>
        <h1>Create your account</h1>
        <p className="muted">Start managing products, stock and sales.</p>
        {!API_CONFIGURED && (
          <p className="error">Live backend is not configured yet; registration is disabled.</p>
        )}
        <form onSubmit={submit} className="stack">
          {field('name', 'Full name', 'text', { autoComplete: 'name', required: true })}
          {field('email', 'Email address', 'email', { autoComplete: 'email', required: true })}
          {field('phone', 'Phone number', 'tel', { autoComplete: 'tel' })}
          {field('password', 'Password', 'password', { autoComplete: 'new-password', minLength: 8, required: true })}
          {field('password_confirmation', 'Confirm password', 'password', { autoComplete: 'new-password', minLength: 8, required: true })}
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit" disabled={busy || !API_CONFIGURED}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="muted center">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
