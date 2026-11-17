import { Link, useNavigate } from 'react-router-dom';
import { FileStack, Clock, RotateCcw, CheckCircle2, Plus, FileText } from 'lucide-react';
import { useLiveApi as useApi } from '../hooks.js';
import { fmtDateTime, inr } from '../api.js';
import { Badge, Loader, ErrorBox, Empty } from '../components/ui.jsx';
import { useAuth } from '../auth.jsx';

const CARDS = [
  ['total', 'Total Handovers', FileStack, 'navy', '/handovers'],
  ['pending', 'Pending with Execution', Clock, 'blue', '/handovers?status=Submitted'],
  ['changesRequested', 'Changes Requested', RotateCcw, 'orange', '/handovers?status=Changes Requested'],
  ['completed', 'Accepted', CheckCircle2, 'green', '/handovers?status=Accepted'],
];

export default function Dashboard() {
  const { isHead } = useAuth();
  const { data, error, loading } = useApi('/handovers/dashboard');
  const list = useApi('/handovers');
  const nav = useNavigate();
  if (loading && !data) return <Loader />;
  if (error) return <ErrorBox error={error} />;
  const d = data || {};
  const recent = (list.data?.handovers || []).slice(0, 8);

  return (
    <div>
      <div className="page-head">
        <div><h2>Dashboard</h2><div className="muted">{isHead ? 'All project handovers' : 'Your project handovers'}</div></div>
        <Link className="btn primary" to="/handovers/new"><Plus size={18} /> New Handover</Link>
      </div>

      <div className="cards">
        {CARDS.map(([k, label, Icon, color, to]) => (
          <button key={k} className={`stat c-${color}`} onClick={() => nav(to)}>
            <div className="stat-icon"><Icon size={20} /></div>
            <div className="stat-val">{d[k] ?? 0}</div>
            <div className="stat-label">{label}</div>
          </button>
        ))}
      </div>

      <div className="cards three">
        <div className="stat c-amber"><div className="stat-icon"><FileText size={20} /></div><div className="stat-val">{d.draft ?? 0}</div><div className="stat-label">Drafts</div></div>
        <div className="stat c-purple"><div className="stat-icon"><Clock size={20} /></div><div className="stat-val">{d.underReview ?? 0}</div><div className="stat-label">Under Review</div></div>
        <div className="stat c-teal"><div className="stat-icon"><CheckCircle2 size={20} /></div><div className="stat-val">{inr(d.totalValue || 0)}</div><div className="stat-label">Total Project Value</div></div>
      </div>

      <section className="panel">
        <div className="panel-head"><h3>Recent Handovers</h3><Link to="/handovers" className="link">View all</Link></div>
        {recent.length === 0 ? (
          <Empty icon={FileStack} title="No handovers yet"><Link className="btn primary mt" to="/handovers/new">Create your first handover</Link></Empty>
        ) : (
          <div className="table-wrap">
            <table className="table responsive">
              <thead><tr><th>Reference</th><th>Project</th><th>Client</th><th>Value</th><th>Status</th><th>Updated</th></tr></thead>
              <tbody>
                {recent.map((h) => (
                  <tr key={h.id} className="click" onClick={() => nav(`/handovers/${h.id}`)}>
                    <td data-label="Reference"><strong>{h.ref || 'Draft'}</strong></td>
                    <td data-label="Project">{h.projectName || '—'}{h.details?.projectLocation && <div className="muted small">{h.details.projectLocation}</div>}</td>
                    <td data-label="Client">{h.clientName || '—'}</td>
                    <td data-label="Value">{inr(h.projectValue)}</td>
                    <td data-label="Status"><Badge value={h.status} /></td>
                    <td data-label="Updated">{fmtDateTime(h.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
