import { useEffect, useRef, useState } from 'react';
import { PenTool, Plus, Paperclip, Download, FileText, X, BellRing } from 'lucide-react';
import { api, downloadFile, fmtDate } from '../api.js';
import { Badge, Loader, ErrorBox, Empty, Field } from '../components/ui.jsx';

const PROJECT_TYPES = ['PEB', 'Mangalore Tile Roofing', 'Glass Roofing', 'Tensile', 'Residential', 'Other'];
const PRIORITIES = ['Low', 'Normal', 'Medium', 'High', 'Urgent'];

const readAsBase64 = (file) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(fr.result);
  fr.onerror = () => reject(new Error('Could not read the file'));
  fr.readAsDataURL(file);
});

export default function DesignRequests() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState({ items: [], unread: 0 });
  const [showForm, setShowForm] = useState(false);
  const first = useRef(true);

  const load = () => api('/design-requests').then((d) => setRows(d.requests || [])).catch((e) => setErr(e.message)).finally(() => { first.current = false; });
  const loadNotes = () => api('/design-requests/notifications').then(setNote).catch(() => {});
  useEffect(() => {
    load(); loadNotes();
    const t = setInterval(() => { load(); loadNotes(); }, 15000);
    return () => clearInterval(t);
  }, []);
  const clearNotes = async () => { try { await api('/design-requests/notifications/read-all', { method: 'POST' }); loadNotes(); } catch { /* ignore */ } };

  return (
    <div>
      <div className="page-head">
        <div><h2>Design Requests</h2><div className="muted">Raise design requirements to the Design team and track approvals</div></div>
        <div className="row-actions"><button className="btn primary" onClick={() => setShowForm(true)}><Plus size={16} /> New Design Request</button></div>
      </div>

      {note.unread > 0 && (
        <div className="alert ok" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span><BellRing size={15} /> {note.unread} design update(s) from the Design team: {note.items.filter((n) => !n.read).slice(0, 2).map((n) => n.title).join(', ')}</span>
          <button className="btn ghost sm" onClick={clearNotes}>Mark read</button>
        </div>
      )}

      <ErrorBox error={err} />
      {rows === null && first.current ? <Loader /> : rows.length === 0 ? (
        <Empty icon={PenTool} title="No design requests yet">Raise one above — it goes straight to the Design Head.</Empty>
      ) : (
        <div className="cards">
          {rows.map((rq) => <RequestCard key={rq.id} rq={rq} />)}
        </div>
      )}

      {showForm && <NewRequest onClose={() => setShowForm(false)} onDone={() => { setShowForm(false); load(); }} setErr={setErr} />}
    </div>
  );
}

function RequestCard({ rq }) {
  const dl = (f) => downloadFile(`/design-requests/files/${f.fileId}?download=1`, f.name || 'design');
  return (
    <section className="form-sec" style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: '0 0 2px' }}>{rq.projectName} <span className="muted small">· {rq.id}</span></h3>
          <div className="muted small">{rq.customerName ? rq.customerName + ' · ' : ''}{rq.projectType} · {rq.requirement || rq.description}</div>
        </div>
        <Badge value={rq.status} />
      </div>
      <div className="kv" style={{ marginTop: 8 }}>
        <div><div className="k">Priority</div><div className="v">{rq.priority || '—'}</div></div>
        <div><div className="k">Due</div><div className="v">{rq.dueDate ? fmtDate(rq.dueDate) : '—'}</div></div>
        <div><div className="k">Assigned Designer</div><div className="v">{rq.assignedDesigner || 'Unassigned'}</div></div>
        <div><div className="k">Requested</div><div className="v">{fmtDate(rq.createdAt)}</div></div>
      </div>
      {rq.status === 'Rejected' && rq.rejectionReason && <div className="alert error" style={{ marginTop: 8 }}>Rejected: {rq.rejectionReason}</div>}
      {rq.status === 'Changes Requested' && rq.changeRemarks && <div className="alert warn" style={{ marginTop: 8 }}>Changes requested: {rq.changeRemarks}</div>}

      {(rq.attachments || []).length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className="muted small" style={{ marginBottom: 4 }}>Attachments</div>
          {rq.attachments.map((a) => (
            <div className="att" key={a.fileId}>
              <div className="att-ic"><FileText size={16} /></div>
              <div className="att-main"><div className="att-name">{a.name}</div><div className="att-meta">{a.size}</div></div>
              <div className="att-act"><button className="btn ghost xs" onClick={() => dl(a)}><Download size={14} /></button></div>
            </div>
          ))}
        </div>
      )}

      {rq.status === 'Approved' && (
        <div style={{ marginTop: 10 }}>
          <div className="alert ok" style={{ marginBottom: 6 }}>Approved by {rq.approvedBy || 'Design Head'}{rq.approvedDate ? ' on ' + fmtDate(rq.approvedDate) : ''} — download the final design below.</div>
          {(rq.approvedFiles || []).length === 0 ? <div className="muted small">No files attached to the approval.</div> : rq.approvedFiles.map((a) => (
            <div className="att" key={a.fileId}>
              <div className="att-ic"><FileText size={16} /></div>
              <div className="att-main"><div className="att-name">{a.name}</div><div className="att-meta">{a.size} · approved design</div></div>
              <div className="att-act"><button className="btn ghost xs" onClick={() => dl(a)}><Download size={14} /> Download</button></div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NewRequest({ onClose, onDone, setErr }) {
  const [f, setF] = useState({ projectName: '', customerName: '', projectType: 'PEB', requirement: '', description: '', priority: 'Medium', dueDate: '', handoverRef: '' });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [e, setE] = useState('');
  const fileRef = useRef(null);
  const set = (k) => (ev) => setF((s) => ({ ...s, [k]: ev.target.value }));

  const submit = async () => {
    if (!f.projectName.trim()) { setE('Enter the project name'); return; }
    if (!f.requirement.trim() && !f.description.trim()) { setE('Describe the design requirement'); return; }
    setBusy(true); setE('');
    try {
      const d = await api('/design-requests', { method: 'POST', body: f });
      const id = d.request.id;
      for (const file of files) {
        try {
          const dataBase64 = await readAsBase64(file);
          await api(`/design-requests/${id}/attachments`, { method: 'POST', body: { name: file.name, type: file.type, size: file.size, dataBase64 } });
        } catch { /* skip a failed file */ }
      }
      onDone();
    } catch (ex) { setE(ex.message); setErr && setErr(''); } finally { setBusy(false); }
  };

  return (
    <div className="modal-bg" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflow: 'auto', padding: 24 }} onMouseDown={(ev) => { if (ev.target === ev.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 'min(96vw, 620px)', padding: 20, boxShadow: '0 20px 50px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>New Design Request</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        {e && <div className="alert error">{e}</div>}
        <div className="form-grid">
          <Field label="Project Name *"><input value={f.projectName} onChange={set('projectName')} placeholder="e.g. Sree Brindaavan PEB" /></Field>
          <Field label="Client / Customer"><input value={f.customerName} onChange={set('customerName')} /></Field>
          <Field label="Project Type">
            <select value={f.projectType} onChange={set('projectType')}>{PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="Priority">
            <select value={f.priority} onChange={set('priority')}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
          </Field>
          <Field label="Design Requirement *" full><textarea rows={3} value={f.requirement} onChange={set('requirement')} placeholder="e.g. 2D + 3D structural drawings, BOQ" /></Field>
          <Field label="Additional Details" full><textarea rows={2} value={f.description} onChange={set('description')} placeholder="Any extra context for the Design team" /></Field>
          <Field label="Due Date"><input type="date" value={f.dueDate} onChange={set('dueDate')} /></Field>
          <Field label="Handover / Project Ref"><input value={f.handoverRef} onChange={set('handoverRef')} placeholder="e.g. HO-2026-003" /></Field>
        </div>
        <div style={{ marginTop: 8 }}>
          <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={(ev) => setFiles([...(ev.target.files || [])])} />
          <button className="btn ghost" onClick={() => fileRef.current?.click()}><Paperclip size={16} /> Attach reference files{files.length ? ` (${files.length})` : ''}</button>
          {files.length > 0 && <div className="muted small" style={{ marginTop: 4 }}>{files.map((x) => x.name).join(', ')}</div>}
        </div>
        <div className="row-actions" style={{ justifyContent: 'flex-end', marginTop: 16, display: 'flex', gap: 10 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit to Design Team'}</button>
        </div>
      </div>
    </div>
  );
}
