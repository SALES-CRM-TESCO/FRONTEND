import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Send, Trash2, Download, FileText, MessageSquarePlus, Check } from 'lucide-react';
import { useLiveApi as useApi } from '../hooks.js';
import { api, attachmentUrl, fileKB, fmtDate, fmtDateTime, inr } from '../api.js';
import { Badge, Loader, ErrorBox } from '../components/ui.jsx';

const EDITABLE = ['Draft', 'Changes Requested'];
const CORRECTABLE = ['Submitted', 'Under Review']; // already with Execution, but Sales may still correct details
const KV = ({ k, v }) => (<div><div className="k">{k}</div><div className="v">{v || '—'}</div></div>);
const YN = ({ v }) => <span>{v || '—'}</span>;

export default function HandoverDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, error, loading, reload } = useApi(`/handovers/${id}`);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (loading && !data) return <Loader />;
  if (error) return <ErrorBox error={error} />;
  const h = data.handover;
  const d = h.details || {}, sc = h.scope || {}, tl = h.timeline || {}, pr = h.pricing || {};
  const activity = data.activity || [];
  const editable = EDITABLE.includes(h.status);
  const correctable = CORRECTABLE.includes(h.status);

  const act = async (fn) => { setBusy(true); setErr(''); try { await fn(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  const submit = () => act(async () => { await api(`/handovers/${id}/submit`, { method: 'POST' }); reload(); });
  const del = () => { if (!window.confirm('Delete this draft permanently?')) return; act(async () => { await api(`/handovers/${id}`, { method: 'DELETE' }); nav('/handovers'); }); };
  const addComment = () => { if (!comment.trim()) return; act(async () => { await api(`/handovers/${id}/comments`, { method: 'POST', body: { message: comment.trim() } }); setComment(''); reload(); }); };

  return (
    <div>
      <div className="page-head">
        <div>
          <button className="btn ghost sm" onClick={() => nav('/handovers')}><ArrowLeft size={15} /> Back</button>
          <h2 style={{ marginTop: 8 }}>{h.ref || 'Draft Handover'} <Badge value={h.status} /></h2>
          <div className="muted">{sc.typeOfProject || d.projectLocation || 'Untitled project'} · {d.clientName || 'No client'}</div>
        </div>
        <div className="row-actions">
          {editable && <Link className="btn" to={`/handovers/${id}/edit`}><Pencil size={15} /> Edit</Link>}
          {editable && <button className="btn primary" disabled={busy} onClick={submit}><Send size={15} /> {h.status === 'Changes Requested' ? 'Resubmit' : 'Submit to Execution'}</button>}
          {correctable && <Link className="btn" to={`/handovers/${id}/edit`}><Pencil size={15} /> Correct Details</Link>}
          {h.status === 'Draft' && <button className="btn ghost danger" disabled={busy} onClick={del}><Trash2 size={15} /> Delete</button>}
        </div>
      </div>
      <ErrorBox error={err} />
      {h.status === 'Changes Requested' && <div className="alert warn">The Execution team requested changes. Edit the handover and resubmit — see the history below.</div>}

      <div className="detail-grid">
        <div>
          <section className="form-sec">
            <h3>1. Client &amp; Project Details</h3>
            <div className="kv">
              <KV k="Lead ID" v={d.leadId} />
              <KV k="Client Name" v={d.clientName} />
              <KV k="Project Location" v={d.projectLocation} />
              <KV k="Contact Details" v={d.contactDetails} />
              <KV k="Billing Name" v={d.billingName} />
              <KV k="Mobile Number" v={d.mobileNumber} />
              <KV k="Alternate Mobile" v={d.alternateMobile} />
              <KV k="GST Number" v={d.gstNumber} />
              <KV k="Email / WhatsApp" v={d.emailWhatsapp} />
              <KV k="Salesperson" v={d.salespersonName} />
              <KV k="Date of Order" v={fmtDate(d.dateOfOrder)} />
              <KV k="Proposal Ref No" v={d.proposalRefNo} />
              <div className="full"><KV k="Site Address" v={d.siteAddress} /></div>
              <div className="full"><KV k="Billing Address" v={d.billingAddress} /></div>
            </div>
          </section>

          <section className="form-sec">
            <h3>2. Scope of Work</h3>
            <div className="kv">
              <KV k="Type of Project" v={sc.typeOfProject} />
              <KV k="Project Size / Area" v={sc.projectSizeArea} />
              <KV k="Length" v={sc.length ? `${sc.length} ${sc.unit || 'ft'}` : '—'} />
              <KV k="Width" v={sc.width ? `${sc.width} ${sc.unit || 'ft'}` : '—'} />
              <KV k="Design" v={[sc.design3D && '3D', sc.design2D && '2D'].filter(Boolean).join(' + ') || 'None'} />
              <KV k="Transportation — Client Scope" v={<YN v={sc.transportationClientScope} />} />
              <KV k="Scaffolding — Client Scope" v={<YN v={sc.scaffoldingClientScope} />} />
            </div>
          </section>

          <section className="form-sec">
            <h3>3. Timeline &amp; Delivery</h3>
            <div className="kv">
              <KV k="Tentative Start" v={fmtDate(tl.tentativeStartDate)} />
              <KV k="Tentative Completion" v={fmtDate(tl.tentativeCompletionDate)} />
              <KV k="Lead Time Promised" v={tl.leadTimePromised} />
            </div>
          </section>

          <section className="form-sec">
            <h3>4. Pricing &amp; Payment Terms</h3>
            <div className="kv one"><KV k="Quoted Price" v={inr(pr.quotedPrice)} /></div>
            {(pr.milestones || []).length > 0 && (
              <div className="table-wrap" style={{ marginTop: 8 }}>
                <table className="table">
                  <thead><tr><th>Term / Milestone</th><th className="num">%</th><th className="num">Value (₹)</th></tr></thead>
                  <tbody>
                    {pr.milestones.map((m, i) => (<tr key={i}><td>{m.term}</td><td className="num">{m.percentage}</td><td className="num">{inr(m.value)}</td></tr>))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="form-sec">
            <h3>5 &amp; 6. Confirmations</h3>
            <div className="kv">
              <KV k="Site Engineer Visit" v={h.siteVisitCompleted ? <span className="ok"><Check size={14} /> Completed</span> : 'Not completed'} />
              <KV k="Salesperson Declaration" v={h.declarationAccepted ? <span className="ok"><Check size={14} /> Confirmed</span> : 'Not confirmed'} />
            </div>
          </section>

          <section className="form-sec">
            <h3>Attachments ({(h.attachments || []).length})</h3>
            {(h.attachments || []).length === 0 ? <div className="muted">No attachments.</div> : (h.attachments || []).map((a) => (
              <div className="att" key={a.fileId}>
                <div className="att-ic"><FileText size={16} /></div>
                <div className="att-main"><div className="att-name">{a.filename}</div><div className="att-meta">{fileKB(a.size)} · {a.uploadedBy || '—'}</div></div>
                <div className="att-act">
                  <a className="btn ghost xs" href={attachmentUrl(id, a.fileId)} target="_blank" rel="noreferrer">Open</a>
                  <a className="btn ghost xs" href={attachmentUrl(id, a.fileId, true)} target="_blank" rel="noreferrer"><Download size={14} /></a>
                </div>
              </div>
            ))}
          </section>

          {(h.executionTasks || []).length > 0 && (
            <section className="form-sec">
              <h3>Execution — Daily Tasks ({h.executionTasks.filter((t) => t.status === 'Done').length}/{h.executionTasks.length} done)</h3>
              <div className="muted small" style={{ marginBottom: 8 }}>Read-only — maintained by the Execution team.</div>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Task</th><th>Assigned to</th><th>Due</th><th>Status</th></tr></thead>
                  <tbody>
                    {h.executionTasks.map((t) => (
                      <tr key={t.taskId}>
                        <td>{t.title}</td>
                        <td>{t.assigneeName || '—'}</td>
                        <td>{t.dueDate ? fmtDate(t.dueDate) : '—'}</td>
                        <td><Badge value={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <div>
          <section className="form-sec">
            <h3>Status</h3>
            <div className="kv one">
              <KV k="Current Status" v={<Badge value={h.status} />} />
              <KV k="Reference" v={h.ref} />
              <KV k="Owner (Sales)" v={h.createdBy?.name} />
              <KV k="Submitted" v={h.submittedAt ? fmtDateTime(h.submittedAt) : 'Not submitted'} />
              <KV k="Last Updated" v={fmtDateTime(h.updatedAt)} />
              {h.reviewedBy?.name && <KV k="Reviewed By (Execution)" v={h.reviewedBy.name} />}
            </div>
          </section>

          <section className="form-sec">
            <h3>History &amp; Comments</h3>
            <div className="comment-box">
              <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment for the Execution team…" />
              <button className="btn ghost sm" disabled={busy || !comment.trim()} onClick={addComment}><MessageSquarePlus size={15} /> Post</button>
            </div>
            <div className="timeline" style={{ marginTop: 12 }}>
              {activity.length === 0 && <div className="muted">No activity yet.</div>}
              {activity.map((a) => (
                <div key={a.id} className={`tl-item ${a.by?.portal === 'execution' ? 'exec' : ''}`}>
                  <div className="tl-dot" />
                  <div className="tl-body">
                    <div className="tl-top">
                      <div className="tl-who">{a.by?.name || 'System'}<span className="side">{a.by?.portal === 'execution' ? 'Execution' : 'Sales'}</span></div>
                      <div className="tl-time">{fmtDateTime(a.createdAt)}</div>
                    </div>
                    <div className="tl-msg">
                      {a.type === 'status' && a.fromStatus ? <><Badge value={a.fromStatus} /> → <Badge value={a.toStatus} /><br /></> : null}
                      {a.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
