import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function GoogleCallback() {
  const [params] = useSearchParams();
  const { acceptToken } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setMessage('No sign-in token was returned.');
      return;
    }
    acceptToken(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => setMessage('Could not complete Google sign-in.'));
  }, [params, acceptToken, navigate]);

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark">@mInspect</div>
        <h1>Google sign-in</h1>
        <p className="muted">{message}</p>
        <Link to="/login">Back to sign in</Link>
      </section>
    </main>
  );
}
