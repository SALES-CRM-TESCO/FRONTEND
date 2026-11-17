import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FileStack, Paperclip } from 'lucide-react';
import { useLiveApi as useApi } from '../hooks.js';
import { qs, fmtDateTime, inr } from '../api.js';
import { Badge, Loader, ErrorBox, Empty } from '../components/ui.jsx';
import { useAuth } from '../auth.jsx';

export default function Handovers() {
  const { isHead } = useAuth();
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const { data, error, loading } = useApi(`/handovers${qs({ q })}`);
  const list = data?.handovers || [];

  return (
    <div>
      <div className="page-head">
        <div><h2>Handovers</h2><div className="muted">{isHead ? 'All handover forms' : 'Your handover forms'}</div></div>
        <Link className="btn primary" to="/handovers/new"><Plus size={18} /> New Handover</Link>
      </div>

      <div className="ho-toolbar">
        <div className="search">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ref, project, client…" />
        </div>
      </div>

      {loading && !data ? <Loader /> : error ? <ErrorBox error={error} /> : list.length === 0 ? (
        <Empty icon={FileStack} title="No handovers found"><Link className="btn primary mt" to="/handovers/new">Create a handover</Link></Empty>
      ) : (
        <div className="table-wrap">
          <table className="table responsive">
            <thead><tr><th>Reference</th><th>Project</th><th>Client</th><th>Value</th><th>Owner</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              {list.map((h) => (
                <tr key={h.id} className="click" onClick={() => nav(`/handovers/${h.id}`)}>
                  <td data-label="Reference"><strong>{h.ref || 'Draft'}</strong>{h.attachmentCount > 0 && <span className="chip"><Paperclip size={12} /> {h.attachmentCount}</span>}</td>
                  <td data-label="Project">{h.projectName || '—'}{h.details?.projectLocation && <div className="muted small">{h.details.projectLocation}</div>}</td>
                  <td data-label="Client">{h.clientName || '—'}</td>
                  <td data-label="Value">{inr(h.projectValue)}</td>
                  <td data-label="Owner">{h.createdBy?.name || '—'}</td>
                  <td data-label="Status"><Badge value={h.status} /></td>
                  <td data-label="Updated">{fmtDateTime(h.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
