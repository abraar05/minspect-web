import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import Layout from '../components/Layout';

export default function AdminAccess() {
  const [accounts, setAccounts] = useState([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api('/admin/allowed-google-accounts')
      .then(setAccounts)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  async function add(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/admin/allowed-google-accounts', {
        method: 'POST',
        body: { email, name: name || null },
      });
      setEmail('');
      setName('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(record) {
    await api(`/admin/allowed-google-accounts/${record.id}`, {
      method: 'PATCH',
      body: { active: !record.active },
    });
    load();
  }

  async function remove(record) {
    if (!window.confirm(`Remove ${record.email}?`)) return;
    await api(`/admin/allowed-google-accounts/${record.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <Layout>
    <div className="stack">
      <header>
        <h1>Access management</h1>
        <p className="muted">Only approved Google accounts can sign in.</p>
      </header>

      <section className="panel">
        <form className="inline-form" onSubmit={add}>
          <input
            type="email"
            placeholder="approved@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            placeholder="Label (optional)"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button className="primary" disabled={busy}>{busy ? 'Adding…' : 'Allow account'}</button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="panel">
        <table>
          <thead>
            <tr><th>Google account</th><th>Status</th><th>Added by</th><th /></tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>
                  <strong>{account.email}</strong>
                  {account.name && <div className="muted">{account.name}</div>}
                </td>
                <td>
                  <button className={account.active ? 'badge active' : 'badge'} onClick={() => toggle(account)}>
                    {account.active ? 'Allowed' : 'Disabled'}
                  </button>
                </td>
                <td>{account.added_by?.name || '—'}</td>
                <td><button className="danger-link" onClick={() => remove(account)}>Remove</button></td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan="4" className="muted">No Google accounts are approved yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
    </Layout>
  );
}
