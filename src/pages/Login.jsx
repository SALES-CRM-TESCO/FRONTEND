import { useEffect, useState } from 'react';
import { ShieldCheck, AtSign, Eye, EyeOff, CircleCheck } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox } from '../components/ui.jsx';

const FEATURES = ['Project Handover Forms', 'Client & Scope Details', 'File Attachments', 'Send to Execution', 'Status Tracking'];

function SitePhoto() {
  return (
    <figure className="site-photo">
      <img src="/login-site-bright.jpg" alt="Steel structure under construction" />
      <figcaption>
        <span className="sp-dot" /> Seamless handovers
        <small>Sales → Execution · Attachments · Live status</small>
      </figcaption>
    </figure>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [setup, setSetup] = useState(false);
  const [f, setF] = useState({ role: 'sales_team', name: '', username: '', password: '', phone: '' });
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api('/auth/setup-status').then((d) => setSetup(d.needsSetup)).catch(() => {}); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const d = await api(setup ? '/auth/setup' : '/auth/login', { method: 'POST', body: f });
      login(d.token, d.user, remember);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <div className="auth-main">
        <section className="auth-hero">
          <div className="auth-brand"><img src="/tescologo2.png" alt="Tesco Structures" /></div>
          <h1>Sales to Execution,<br />One Clean Handover</h1>
          <p>Prepare project handover forms with client details, scope and attachments, then send them straight to the Execution team — tracked from draft to accepted.</p>
          <SitePhoto />
          <ul className="auth-feat">
            {FEATURES.map((t) => <li key={t}><CircleCheck size={16} /> {t}</li>)}
          </ul>
        </section>

        <section className="auth-card">
          <img className="auth-card-logo" src="/tescologo2.png" alt="Tesco Structures" />
          <h2>{setup ? 'Get Started' : <>Welcome Back <span className="wave">👋</span></>}</h2>
          <p>{setup ? 'Create the Sales Head account to set up the portal.' : 'Sign in to continue to the Sales portal.'}</p>
          <form onSubmit={submit}>
            <ErrorBox error={err} />
            {!setup && (
              <label className="field">
                <span className="label">Role</span>
                <div className="ifield">
                  <select className="role-select" value={f.role} onChange={set('role')}>
                    <option value="sales_head">Sales Head</option>
                    <option value="sales_team">Sales Team</option>
                  </select>
                  <ShieldCheck size={16} />
                </div>
              </label>
            )}
            {setup && (
              <label className="field"><span className="label">Full Name</span><div className="ifield"><input value={f.name} onChange={set('name')} placeholder="Your name" required /></div></label>
            )}
            <label className="field">
              <span className="label">{setup ? 'Username' : 'Username / Employee ID'}</span>
              <div className="ifield"><input value={f.username} onChange={set('username')} placeholder={setup ? 'e.g. saleshead' : 'e.g. ramesh or EMP001'} autoCapitalize="none" autoComplete="username" required /><AtSign size={16} /></div>
            </label>
            <label className="field">
              <span className="label">Password</span>
              <div className="ifield">
                <input type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} placeholder="Enter password" autoComplete={setup ? 'new-password' : 'current-password'} required minLength={setup ? 8 : undefined} />
                <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </label>
            {setup && <label className="field"><span className="label">Phone (optional)</span><div className="ifield"><input value={f.phone} onChange={set('phone')} inputMode="tel" /></div></label>}
            {!setup && <label className="check small"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember Me</label>}
            <button className="btn primary block lg" disabled={busy || !f.username || !f.password}>{busy ? 'Please wait…' : setup ? 'Create Sales Head & Continue' : 'Login to Dashboard'}</button>
          </form>
        </section>
      </div>
      <footer className="auth-foot">
        <div className="auth-foot-in">
          <span>© {new Date().getFullYear()} Tesco Structures · Sales Portal. All rights reserved.</span>
          <span>Credentials are issued by the Sales Head</span>
        </div>
      </footer>
    </div>
  );
}
