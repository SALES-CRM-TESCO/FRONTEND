import { useState } from 'react';
import { UserPlus, RotateCcw, Power, Copy, Check } from 'lucide-react';
import { useApi } from '../hooks.js';
import { api } from '../api.js';
import { Badge, Loader, ErrorBox, Empty, Modal, Field } from '../components/ui.jsx';
import { useAuth } from '../auth.jsx';

const roleLabel = (r) => (r === 'sales_head' ? 'Sales Head' : 'Sales Team');

function Credentials({ c }) {
  const [copied, setCopied] = useState(false);
  const text = `Sales Portal login\nUsername: ${c.username}${c.employeeId ? `\nEmployee ID: ${c.employeeId}` : ''}\nPassword: ${c.password}`;
  const copy = () => { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); };
  return (
    <div className="cred-card">
      <div><b>Share these credentials now</b> — the password is shown only once.</div>
      <div style={{ marginTop: 6 }}>Username: <code>{c.username}</code>{c.employeeId && <> · Employee ID: <code>{c.employeeId}</code></>} · Password: <code>{c.password}</code></div>
      <button className="btn ghost sm mt" onClick={copy}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy details</>}</button>
    </div>
  );
}

export default function Team() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi('/users');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', employeeId: '', email: '', phone: '', designation: '', role: 'sales_team', password: '', mustChangePassword: false });
  const [cred, setCred] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const users = data?.users || [];
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const create = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const d = await api('/users', { method: 'POST', body: form });
      setCred(d.credentials); setOpen(false);
      setForm({ name: '', username: '', employeeId: '', email: '', phone: '', designation: '', role: 'sales_team', password: '', mustChangePassword: false });
      reload();
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  const reset = async (u) => {
    if (!window.confirm(`Reset password for ${u.name}?`)) return;
    try { const d = await api(`/users/${u.id}/reset-password`, { method: 'POST', body: {} }); setCred(d.credentials); } catch (e) { alert(e.message); }
  };
  const toggle = async (u) => {
    try { await api(`/users/${u.id}/active`, { method: 'POST', body: { active: !u.active } }); reload(); } catch (e) { alert(e.message); }
  };

  if (loading && !data) return <Loader />;

  return (
    <div>
      <div className="page-head">
        <div><h2>Team & Logins</h2><div className="muted">Create and manage Sales team logins</div></div>
        <button className="btn primary" onClick={() => { setErr(''); setOpen(true); }}><UserPlus size={18} /> Create Login</button>
      </div>
      <ErrorBox error={error} />
      {cred && <Credentials c={cred} />}

      {users.length === 0 ? <Empty icon={UserPlus} title="No team logins yet">Create a login for your Sales team members.</Empty> : (
        <div className="table-wrap">
          <table className="table responsive">
            <thead><tr><th>Name</th><th>Username</th><th>Employee ID</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label="Name"><strong>{u.name}</strong>{u.designation && <div className="muted small">{u.designation}</div>}</td>
                  <td data-label="Username">{u.username}</td>
                  <td data-label="Employee ID">{u.employeeId || '—'}</td>
                  <td data-label="Role"><Badge value={roleLabel(u.role)} /></td>
                  <td data-label="Status">{u.active ? <span className="ok">Active</span> : <span className="muted">Disabled</span>}</td>
                  <td data-label="Actions">
                    <div className="row-actions">
                      <button className="btn ghost xs" onClick={() => reset(u)}><RotateCcw size={13} /> Reset</button>
                      {u.id !== user.id && <button className="btn ghost xs" onClick={() => toggle(u)}><Power size={13} /> {u.active ? 'Disable' : 'Enable'}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal title="Create a Sales login" onClose={() => setOpen(false)}>
          <form onSubmit={create}>
            <ErrorBox error={err} />
            <div className="form-grid">
              <Field label="Full Name *"><input value={form.name} onChange={set('name')} required /></Field>
              <Field label="Role"><select value={form.role} onChange={set('role')}><option value="sales_team">Sales Team</option><option value="sales_head">Sales Head</option></select></Field>
              <Field label="Username" hint="Auto-filled from name if left blank"><input value={form.username} onChange={set('username')} autoCapitalize="none" /></Field>
              <Field label="Employee ID"><input value={form.employeeId} onChange={set('employeeId')} /></Field>
              <Field label="Email"><input type="email" value={form.email} onChange={set('email')} /></Field>
              <Field label="Phone"><input value={form.phone} onChange={set('phone')} inputMode="tel" /></Field>
              <Field label="Designation"><input value={form.designation} onChange={set('designation')} /></Field>
              <Field label="Password" hint="Leave blank to auto-generate"><input value={form.password} onChange={set('password')} /></Field>
              <label className="check small full"><input type="checkbox" checked={form.mustChangePassword} onChange={set('mustChangePassword')} /> Require password change on first login</label>
            </div>
            <div className="row-actions" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create Login'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
