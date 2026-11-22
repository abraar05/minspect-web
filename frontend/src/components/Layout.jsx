import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">@mInspect <span>Craft Kicks</span></div>
        <div className="topbar-actions">
          <span className="user-pill">{user?.name || 'Account'}</span>
          <button className="ghost" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <aside className="sidebar">
        <p className="side-label">Workspace</p>
        <div className="side-item active">Overview</div>
        {user?.roles?.includes('admin') && (
          <Link className="side-item" to="/admin/access">Access management</Link>
        )}
        <p className="side-label">Phase 1</p>
        <div className="side-item muted-item">Products</div>
        <div className="side-item muted-item">Inventory</div>
        <div className="side-item muted-item">Sales</div>
        <div className="side-item muted-item">Purchases</div>
        <div className="side-item muted-item">Reports</div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
