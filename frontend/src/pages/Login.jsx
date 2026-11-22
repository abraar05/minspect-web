import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { API_BASE, API_CONFIGURED } from '../api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [params] = useSearchParams();
  const [error, setError] = useState(params.get('error') || '');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark">@mInspect</div>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to your Craft Kicks workspace.</p>
        {!API_CONFIGURED && (
          <p className="error">Live backend is not configured yet; sign-in is disabled.</p>
        )}
        <a
          className={API_CONFIGURED ? 'google-button' : 'google-button disabled'}
          href={API_CONFIGURED ? `${API_BASE}/auth/google/redirect` : undefined}
          aria-disabled={!API_CONFIGURED}
        >
          Continue with Google
        </a>
        <div className="divider"><span>or</span></div>
        <form onSubmit={submit} className="stack">
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit" disabled={busy || !API_CONFIGURED}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="muted center">
          No account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </main>
  );
}
