import Layout from '../components/Layout';
import { useAuth } from '../auth/AuthContext';

const modules = [
  ['Products & variants', 'Catalogue, sizes, colours and SKUs'],
  ['Stock ledger', 'Every receipt, sale, return and adjustment'],
  ['Purchases', 'Supplier bills and receiving'],
  ['Sales', 'Customers, orders and invoices'],
  ['Accounting', 'Receivables, payables and summaries'],
  ['Reports', 'Daily, weekly and product performance'],
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout>
      <section className="hero">
        <div>
          <p className="eyebrow">Business overview</p>
          <h1>Hello, {user?.name?.split(' ')[0] || 'there'}.</h1>
          <p className="muted">Your Craft Kicks operations workspace is ready.</p>
        </div>
        <div className="status-chip">API connected</div>
      </section>

      <section className="stat-grid">
        <article className="stat">
          <p className="stat-label">Signed in as</p>
          <p className="stat-value">{user?.email || '—'}</p>
          <p className="stat-note">Role: {(user?.roles || []).join(', ') || 'none'}</p>
        </article>
        <article className="stat">
          <p className="stat-label">Account status</p>
          <p className="stat-value">{user?.status || '—'}</p>
          <p className="stat-note">Last login {user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'this session'}</p>
        </article>
        <article className="stat">
          <p className="stat-label">Platform</p>
          <p className="stat-value">Phase 1</p>
          <p className="stat-note">Foundation, auth and role setup</p>
        </article>
      </section>

      <section className="panel">
        <h2>Building next</h2>
        <div className="module-grid">
          {modules.map(([title, note]) => (
            <article className="module" key={title}>
              <h3>{title}</h3>
              <p className="muted">{note}</p>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}
