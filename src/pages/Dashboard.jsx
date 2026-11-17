import { Link, useNavigate } from 'react-router-dom';
import { FileStack, CheckCircle2, Plus, IndianRupee } from 'lucide-react';
import { useLiveApi as useApi } from '../hooks.js';
import { fmtDateTime, inr } from '../api.js';
import { Badge, Loader, ErrorBox, Empty } from '../components/ui.jsx';
import { useAuth } from '../auth.jsx';
import StatCard from '../components/StatCard.jsx';

const CARDS = [
  { k: 'total', title: 'Total Handovers', icon: <FileStack size={20} />, trend: 'All forms', desc: 'Handovers', color: '#4F46E5', bg: '#E0E7FF', to: '/handovers' },
  { k: 'completed', title: 'Accepted', icon: <CheckCircle2 size={20} />, trend: 'By Execution', desc: 'Accepted', color: '#22C55E', bg: '#DCFCE7', to: '/handovers?status=Accepted' },
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

      <div className="dcards">
        {CARDS.map((c) => (
          <StatCard key={c.k} title={c.title} value={d[c.k] ?? 0} icon={c.icon} trend={c.trend} desc={c.desc} color={c.color} bg={c.bg} onClick={() => nav(c.to)} />
        ))}
        <StatCard title="Total Project Value" value={inr(d.totalValue || 0)} icon={<IndianRupee size={20} />} trend="Combined" desc="Order value" color="#0D9488" bg="#CCFBF1" />
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
