import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import AdminAccess from './pages/AdminAccess';
import Dashboard from './pages/Dashboard';
import GoogleCallback from './pages/GoogleCallback';
import Login from './pages/Login';
import Register from './pages/Register';

function Protected({ children, admin = false }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="auth-shell"><p className="muted">Loading…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !user.roles?.includes('admin')) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = user ? '@mInspect — Dashboard' : '@mInspect — Craft Kicks';
  }, [user]);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route
        path="/admin/access"
        element={<Protected admin><AdminAccess /></Protected>}
      />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
