import { useState } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { api, replaceToken } from '../api.js';
import { Field, ErrorBox } from '../components/ui.jsx';

export default function Account() {
  const { user, isHead, logout } = useAuth();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const change = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
    if (f.newPassword !== f.confirm) { setErr('New passwords do not match'); return; }
    setBusy(true);
    try {
      const d = await api('/auth/change-password', { method: 'POST', body: { currentPassword: f.currentPassword, newPassword: f.newPassword } });
      if (d.token) replaceToken(d.token);
      setMsg('Password updated'); setF({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <div className="narrow">
      <div className="page-head"><div><h2>My Account</h2><div className="muted">{user.name} · {isHead ? 'Sales Head' : 'Sales Team'}</div></div></div>

      <section className="form-sec">
        <h3>Profile</h3>
        <div className="kv">
          <div><div className="k">Name</div><div className="v">{user.name}</div></div>
          <div><div className="k">Username</div><div className="v">{user.username}</div></div>
          <div><div className="k">Employee ID</div><div className="v">{user.employeeId || '—'}</div></div>
          <div><div className="k">Email</div><div className="v">{user.email || '—'}</div></div>
          <div><div className="k">Phone</div><div className="v">{user.phone || '—'}</div></div>
          <div><div className="k">Role</div><div className="v">{isHead ? 'Sales Head' : 'Sales Team'}</div></div>
        </div>
      </section>

      {isHead && (
        <section className="form-sec">
          <h3>Change Password</h3>
          <form onSubmit={change}>
            <ErrorBox error={err} />
            {msg && <div className="alert ok">{msg}</div>}
            <div className="form-grid">
              <Field label="Current Password" full><input type="password" value={f.currentPassword} onChange={set('currentPassword')} required /></Field>
              <Field label="New Password"><input type="password" value={f.newPassword} onChange={set('newPassword')} minLength={8} required /></Field>
              <Field label="Confirm New Password"><input type="password" value={f.confirm} onChange={set('confirm')} minLength={8} required /></Field>
            </div>
            <button className="btn primary mt" disabled={busy}><KeyRound size={16} /> {busy ? 'Updating…' : 'Update Password'}</button>
          </form>
          <p className="muted small mt">Sales Team members' passwords are reset by the Sales Head from Team & Logins.</p>
        </section>
      )}

      <button className="btn ghost danger mt" onClick={logout}><LogOut size={16} /> Logout</button>
    </div>
  );
}
