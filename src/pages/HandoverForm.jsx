import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Send, Paperclip, Trash2, Download, ArrowLeft, FileText, Plus, X } from 'lucide-react';
import { api, attachmentUrl, fileKB, inr } from '../api.js';
import { Field, ErrorBox, Loader } from '../components/ui.jsx';

const ACCEPT = '.pdf,.xls,.xlsx,.csv,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.bmp,.txt,image/*';

const DEFAULT_MILESTONES = [
  { term: '10% Advance with PO', percentage: 10 },
  { term: '30% after Drawing Approval', percentage: 30 },
  { term: '40% after Structure Work Complete', percentage: 40 },
  { term: '20% after Completion', percentage: 20 },
];

const blank = () => ({
  details: { leadId: '', clientName: '', projectLocation: '', contactDetails: '', billingName: '', mobileNumber: '', alternateMobile: '', siteAddress: '', billingAddress: '', gstNumber: '', emailWhatsapp: '', salespersonName: '', dateOfOrder: '', proposalRefNo: '' },
  scope: { typeOfProject: '', projectSizeArea: '', length: '', width: '', unit: 'ft', design3D: false, design2D: false, transportationClientScope: 'Yes', scaffoldingClientScope: 'Yes' },
  timeline: { tentativeStartDate: '', tentativeCompletionDate: '' },
  pricing: { quotedPrice: '', milestones: DEFAULT_MILESTONES.map((m) => ({ ...m })) },
  siteVisitCompleted: false,
  declarationAccepted: false,
  priority: 'Medium',
});

// Lead time in days between two YYYY-MM-DD dates.
function leadDays(start, end) {
  if (!start || !end) return '';
  const a = new Date(start), b = new Date(end);
  if (isNaN(a) || isNaN(b)) return '';
  const days = Math.round((b - a) / 86400000);
  return days >= 0 ? `${days} days` : '';
}

export default function HandoverForm() {
  const { id: paramId } = useParams();
  const nav = useNavigate();
  const [id, setId] = useState(paramId || null);
  const [f, setF] = useState(blank());
  const [attachments, setAttachments] = useState([]);
  const [status, setStatus] = useState('Draft');
  const [loading, setLoading] = useState(!!paramId);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!paramId) return;
    api(`/handovers/${paramId}`).then((d) => {
      const h = d.handover; const b = blank();
      setF({
        details: { ...b.details, ...(h.details || {}) },
        scope: { ...b.scope, ...(h.scope || {}) },
        timeline: { ...b.timeline, ...(h.timeline || {}) },
        pricing: { quotedPrice: h.pricing?.quotedPrice || '', milestones: (h.pricing?.milestones?.length ? h.pricing.milestones : b.pricing.milestones).map((m) => ({ term: m.term || '', percentage: m.percentage ?? '' })) },
        siteVisitCompleted: !!h.siteVisitCompleted,
        declarationAccepted: !!h.declarationAccepted,
        priority: h.priority || 'Medium',
      });
      setAttachments(h.attachments || []);
      setStatus(h.status);
      // Draft / Changes Requested → full edit+submit. Submitted / Under Review → correction mode.
      // Accepted / Rejected → locked, send back to the read-only view.
      if (!['Draft', 'Changes Requested', 'Submitted', 'Under Review'].includes(h.status)) nav(`/handovers/${paramId}`, { replace: true });
    }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [paramId]); // eslint-disable-line

  const setD = (k) => (e) => setF((s) => ({ ...s, details: { ...s.details, [k]: e.target.value } }));
  const setSc = (k, val) => setF((s) => ({ ...s, scope: { ...s.scope, [k]: val } }));
  const setTl = (k) => (e) => setF((s) => ({ ...s, timeline: { ...s.timeline, [k]: e.target.value } }));
  const setQuoted = (e) => setF((s) => ({ ...s, pricing: { ...s.pricing, quotedPrice: e.target.value } }));
  const setMilestone = (i, k, val) => setF((s) => { const m = s.pricing.milestones.map((x, j) => (j === i ? { ...x, [k]: val } : x)); return { ...s, pricing: { ...s.pricing, milestones: m } }; });
  const addMilestone = () => setF((s) => ({ ...s, pricing: { ...s.pricing, milestones: [...s.pricing.milestones, { term: '', percentage: '' }] } }));
  const removeMilestone = (i) => setF((s) => ({ ...s, pricing: { ...s.pricing, milestones: s.pricing.milestones.filter((_, j) => j !== i) } }));

  const quoted = Number(f.pricing.quotedPrice) || 0;
  const milestoneValue = (pct) => Math.round(quoted * (Number(pct) || 0) / 100);
  const totalPct = f.pricing.milestones.reduce((s, m) => s + (Number(m.percentage) || 0), 0);
  const totalVal = f.pricing.milestones.reduce((s, m) => s + milestoneValue(m.percentage), 0);
  const lead = useMemo(() => leadDays(f.timeline.tentativeStartDate, f.timeline.tentativeCompletionDate), [f.timeline.tentativeStartDate, f.timeline.tentativeCompletionDate]);

  const editingSubmitted = ['Submitted', 'Under Review'].includes(status);

  // ---- Form validation (blocks submit; a draft can still be saved incomplete) ----
  const [invalid, setInvalid] = useState({});
  const bad = (k) => !!invalid[k];
  function validate() {
    const problems = [];
    const miss = {};
    const need = (cond, key, label) => { if (!cond) { problems.push(label); miss[key] = true; } };
    need(f.details.clientName.trim(), 'clientName', 'Client Name');
    need(f.details.projectLocation.trim(), 'projectLocation', 'Project Location');
    need(/^\d{7,15}$/.test(String(f.details.mobileNumber).replace(/\D/g, '')), 'mobileNumber', 'Mobile Number (7–15 digits)');
    need(f.details.siteAddress.trim(), 'siteAddress', 'Site Address');
    need(f.details.salespersonName.trim(), 'salespersonName', 'Salesperson Name');
    need(f.details.dateOfOrder, 'dateOfOrder', 'Date of Order');
    need(f.details.proposalRefNo.trim(), 'proposalRefNo', 'Proposal Ref No');
    need(f.scope.typeOfProject.trim(), 'typeOfProject', 'Type of Project');
    need(f.scope.projectSizeArea.trim(), 'projectSizeArea', 'Project Size/Area');
    need(f.timeline.tentativeStartDate, 'tentativeStartDate', 'Tentative Start Date');
    need(f.timeline.tentativeCompletionDate, 'tentativeCompletionDate', 'Tentative Completion Date');
    if (f.timeline.tentativeStartDate && f.timeline.tentativeCompletionDate && lead === '') { problems.push('Completion Date must be on or after the Start Date'); miss.tentativeCompletionDate = true; }
    need(quoted > 0, 'quotedPrice', 'Quoted Price (greater than 0)');
    need(totalPct === 100, 'milestones', 'Payment milestones must total 100%');
    need(f.declarationAccepted, 'declarationAccepted', 'Salesperson Declaration must be accepted');
    setInvalid(miss);
    return problems;
  }

  const payload = () => ({
    details: f.details,
    scope: f.scope,
    timeline: { ...f.timeline, leadTimePromised: lead },
    pricing: { quotedPrice: quoted, milestones: f.pricing.milestones.map((m) => ({ term: m.term, percentage: Number(m.percentage) || 0, value: milestoneValue(m.percentage) })) },
    siteVisitCompleted: f.siteVisitCompleted,
    declarationAccepted: f.declarationAccepted,
    priority: f.priority,
  });

  async function ensureSaved() {
    if (id) { await api(`/handovers/${id}`, { method: 'PUT', body: payload() }); return id; }
    const d = await api('/handovers', { method: 'POST', body: payload() });
    setId(d.handover.id);
    window.history.replaceState(null, '', `/handovers/${d.handover.id}/edit`);
    return d.handover.id;
  }

  const saveDraft = async () => { setBusy(true); setErr(''); setMsg(''); try { await ensureSaved(); setMsg('Draft saved'); } catch (e) { setErr(e.message); } finally { setBusy(false); } };

  const submit = async () => {
    const problems = validate();
    if (problems.length) {
      setErr(`Please complete the required fields: ${problems.join(', ')}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setBusy(true); setErr(''); setMsg('');
    try { const hid = await ensureSaved(); const d = await api(`/handovers/${hid}/submit`, { method: 'POST' }); nav(`/handovers/${d.handover.id}`); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  // Save edits to an already-submitted handover (keeps it with Execution; backend notifies the Execution Head).
  const saveChanges = async () => {
    const problems = validate();
    if (problems.length) {
      setErr(`Please complete the required fields: ${problems.join(', ')}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setBusy(true); setErr(''); setMsg('');
    try { const hid = await ensureSaved(); nav(`/handovers/${hid}`); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const pickFiles = async (e) => {
    const files = [...(e.target.files || [])];
    if (fileRef.current) fileRef.current.value = '';
    if (!files.length) return;
    setUploading(true); setErr(''); setMsg('');
    try {
      const hid = await ensureSaved();
      const form = new FormData();
      files.forEach((file) => form.append('files', file));
      const d = await api(`/handovers/${hid}/attachments`, { method: 'POST', form });
      setAttachments(d.handover.attachments || []);
      setMsg(`${files.length} file(s) attached`);
    } catch (ex) { setErr(ex.message); } finally { setUploading(false); }
  };

  const removeAtt = async (fileId) => {
    try { const d = await api(`/handovers/${id}/attachments/${fileId}`, { method: 'DELETE' }); setAttachments(d.handover.attachments || []); } catch (e) { setErr(e.message); }
  };

  if (loading) return <Loader />;

  return (
    <div className="narrow">
      <style>{`
        .narrow input.invalid, .narrow textarea.invalid, .narrow select.invalid { border-color:#dc2626 !important; background:#fef2f2; }
        .narrow label.check.invalid { color:#dc2626; }
      `}</style>
      <div className="page-head">
        <div>
          <button className="btn ghost sm" onClick={() => nav(id ? `/handovers/${id}` : '/handovers')}><ArrowLeft size={15} /> Back</button>
          <h2 style={{ marginTop: 8 }}>{!paramId ? 'New Project File' : editingSubmitted ? 'Correct Submitted Handover' : status === 'Changes Requested' ? 'Update Handover' : 'Edit Handover'}</h2>
          <div className="muted">Sales to Project Handover Form{editingSubmitted ? ' · this handover is already with Execution — saving your changes notifies the Execution Head' : ''}</div>
        </div>
      </div>
      <ErrorBox error={err} />
      {msg && <div className="alert ok">{msg}</div>}

      {/* 1. Client & Project Details */}
      <section className="form-sec">
        <h3>1. Client &amp; Project Details</h3>
        <div className="form-grid">
          <Field label="Lead ID"><input value={f.details.leadId} onChange={setD('leadId')} placeholder="e.g. LD-0001" /></Field>
          <Field label="Client Name *"><input className={bad('clientName') ? 'invalid' : ''} value={f.details.clientName} onChange={setD('clientName')} placeholder="e.g. Sree Brindaavan Kindergarten" /></Field>
          <Field label="Project Location *"><input className={bad('projectLocation') ? 'invalid' : ''} value={f.details.projectLocation} onChange={setD('projectLocation')} placeholder="e.g. Chitlapakkam" /></Field>
          <Field label="Contact Details (Phone/Email)"><input value={f.details.contactDetails} onChange={setD('contactDetails')} placeholder="e.g. 9840714353 / ..." /></Field>
          <Field label="Billing Name"><input value={f.details.billingName} onChange={setD('billingName')} /></Field>
          <Field label="Mobile Number *"><input className={bad('mobileNumber') ? 'invalid' : ''} value={f.details.mobileNumber} onChange={setD('mobileNumber')} inputMode="tel" placeholder="e.g. 9551269990" /></Field>
          <Field label="Alternate Mobile Number"><input value={f.details.alternateMobile} onChange={setD('alternateMobile')} inputMode="tel" /></Field>
          <Field label="GST Number"><input value={f.details.gstNumber} onChange={setD('gstNumber')} placeholder="Enter GST number" /></Field>
          <Field label="Site Address *" full><textarea className={bad('siteAddress') ? 'invalid' : ''} rows={2} value={f.details.siteAddress} onChange={setD('siteAddress')} placeholder="e.g. 46, First main Road, Venkatraman Nagar, Chennai-600064" /></Field>
          <Field label="Billing Address" full><textarea rows={2} value={f.details.billingAddress} onChange={setD('billingAddress')} placeholder="Enter billing address if different" /></Field>
          <Field label="Email ID / WhatsApp Number"><input value={f.details.emailWhatsapp} onChange={setD('emailWhatsapp')} placeholder="Enter WhatsApp / email" /></Field>
          <Field label="Salesperson Name *"><input className={bad('salespersonName') ? 'invalid' : ''} value={f.details.salespersonName} onChange={setD('salespersonName')} placeholder="e.g. Saleem Khan" /></Field>
          <Field label="Date of Order *"><input className={bad('dateOfOrder') ? 'invalid' : ''} type="date" value={f.details.dateOfOrder} onChange={setD('dateOfOrder')} /></Field>
          <Field label="Proposal Ref No *"><input className={bad('proposalRefNo') ? 'invalid' : ''} value={f.details.proposalRefNo} onChange={setD('proposalRefNo')} placeholder="e.g. TES/ENT/176-R1" /></Field>
        </div>
      </section>

      {/* 2. Scope of Work */}
      <section className="form-sec">
        <h3>2. Scope of Work</h3>
        <div className="form-grid">
          <Field label="Type of Project *"><input className={bad('typeOfProject') ? 'invalid' : ''} value={f.scope.typeOfProject} onChange={(e) => setSc('typeOfProject', e.target.value)} placeholder="e.g. PU Sheet Roof with wall panel cladding" /></Field>
          <Field label="Project Size/Area *"><input className={bad('projectSizeArea') ? 'invalid' : ''} value={f.scope.projectSizeArea} onChange={(e) => setSc('projectSizeArea', e.target.value)} placeholder="e.g. 760 Sqft." /></Field>
        </div>
        <div className="form-grid three" style={{ marginTop: 10 }}>
          <Field label="Length"><input type="number" min="0" step="0.01" value={f.scope.length} onChange={(e) => setSc('length', e.target.value)} placeholder="e.g. 40" /></Field>
          <Field label="Width"><input type="number" min="0" step="0.01" value={f.scope.width} onChange={(e) => setSc('width', e.target.value)} placeholder="e.g. 19" /></Field>
          <Field label="Unit">
            <select value={f.scope.unit} onChange={(e) => setSc('unit', e.target.value)}>
              <option value="ft">Feet (ft)</option>
              <option value="m">Metres (m)</option>
            </select>
          </Field>
        </div>
        {(Number(f.scope.length) > 0 && Number(f.scope.width) > 0) && (
          <div className="muted small" style={{ marginTop: 6 }}>Area ≈ {(Number(f.scope.length) * Number(f.scope.width)).toLocaleString('en-IN')} {f.scope.unit === 'm' ? 'm²' : 'sq ft'} ({f.scope.length} × {f.scope.width} {f.scope.unit})</div>
        )}
        <div className="scope-row">
          <label className="check"><input type="checkbox" checked={f.scope.design3D} onChange={(e) => setSc('design3D', e.target.checked)} /> 3D Design</label>
          <label className="check"><input type="checkbox" checked={f.scope.design2D} onChange={(e) => setSc('design2D', e.target.checked)} /> 2D Design</label>
          <div className="yn"><span className="yn-label">Transportation Client Scope</span>
            <label className="radio"><input type="radio" name="trans" checked={f.scope.transportationClientScope === 'Yes'} onChange={() => setSc('transportationClientScope', 'Yes')} /> Yes</label>
            <label className="radio"><input type="radio" name="trans" checked={f.scope.transportationClientScope === 'No'} onChange={() => setSc('transportationClientScope', 'No')} /> No</label>
          </div>
          <div className="yn"><span className="yn-label">Scaffolding Client Scope</span>
            <label className="radio"><input type="radio" name="scaf" checked={f.scope.scaffoldingClientScope === 'Yes'} onChange={() => setSc('scaffoldingClientScope', 'Yes')} /> Yes</label>
            <label className="radio"><input type="radio" name="scaf" checked={f.scope.scaffoldingClientScope === 'No'} onChange={() => setSc('scaffoldingClientScope', 'No')} /> No</label>
          </div>
        </div>
      </section>

      {/* 3. Timeline & Delivery Commitment */}
      <section className="form-sec">
        <h3>3. Timeline &amp; Delivery Commitment</h3>
        <div className="form-grid three">
          <Field label="Tentative Start Date *"><input className={bad('tentativeStartDate') ? 'invalid' : ''} type="date" value={f.timeline.tentativeStartDate} onChange={setTl('tentativeStartDate')} /></Field>
          <Field label="Tentative Completion Date *"><input className={bad('tentativeCompletionDate') ? 'invalid' : ''} type="date" value={f.timeline.tentativeCompletionDate} onChange={setTl('tentativeCompletionDate')} /></Field>
          <Field label="Lead Time Promised"><input value={lead} readOnly placeholder="Auto-calculated" /></Field>
        </div>
      </section>

      {/* 4. Pricing & Payment Terms */}
      <section className="form-sec">
        <h3>4. Pricing &amp; Payment Terms</h3>
        <div className="form-grid">
          <Field label="Quoted Price (₹) *"><input className={bad('quotedPrice') ? 'invalid' : ''} type="number" min="0" step="1000" value={f.pricing.quotedPrice} onChange={setQuoted} placeholder="Amount" /></Field>
        </div>
        <div className="panel-head" style={{ marginTop: 10 }}><h4 style={{ margin: 0 }}>Payment Terms Schedule</h4><button className="btn ghost sm" onClick={addMilestone}><Plus size={14} /> Add Milestone</button></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Term / Milestone</th><th className="num">Percentage (%)</th><th className="num">Value (₹)</th><th></th></tr></thead>
            <tbody>
              {f.pricing.milestones.map((m, i) => (
                <tr key={i}>
                  <td><input value={m.term} onChange={(e) => setMilestone(i, 'term', e.target.value)} placeholder="Milestone" style={{ width: '100%' }} /></td>
                  <td className="num"><input type="number" min="0" value={m.percentage} onChange={(e) => setMilestone(i, 'percentage', e.target.value)} style={{ width: 90, textAlign: 'right' }} /></td>
                  <td className="num">{inr(milestoneValue(m.percentage))}</td>
                  <td><button className="icon-btn" onClick={() => removeMilestone(i)} aria-label="Remove"><X size={16} /></button></td>
                </tr>
              ))}
              <tr className="total-row">
                <td><strong>Total</strong></td>
                <td className="num"><strong className={totalPct === 100 ? 'ok' : 'warn-text'}>{totalPct}%</strong></td>
                <td className="num"><strong>{inr(totalVal)}</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        {totalPct !== 100 && <div className="muted small">Milestone percentages add up to {totalPct}% (should be 100%).</div>}
      </section>

      {/* 5 & 6. Confirmations & Declarations */}
      <section className="form-sec">
        <h3>5 &amp; 6. Confirmations &amp; Declarations</h3>
        <div style={{ marginBottom: 12 }}>
          <div className="muted small" style={{ fontWeight: 600, marginBottom: 4 }}>5. Site Engineer Visit Completed</div>
          <label className="check"><input type="checkbox" checked={f.siteVisitCompleted} onChange={(e) => setF((s) => ({ ...s, siteVisitCompleted: e.target.checked }))} /> Visit Completed</label>
        </div>
        <div>
          <div className="muted small" style={{ fontWeight: 600, marginBottom: 4 }}>6. Salesperson Declaration *</div>
          <label className={`check${bad('declarationAccepted') ? ' invalid' : ''}`}><input type="checkbox" checked={f.declarationAccepted} onChange={(e) => setF((s) => ({ ...s, declarationAccepted: e.target.checked }))} /> "I confirm that all details communicated to the client and project team are accurate and have been agreed upon. I also acknowledge that the project will commence once the design has been confirmed."</label>
        </div>
      </section>

      {/* Attachments */}
      <section className="form-sec">
        <h3>Attachments</h3>
        <div className="muted">PDF, Excel, Word, PowerPoint and images. Up to 20 files, 25 MB each.</div>
        {attachments.map((a) => (
          <div className="att" key={a.fileId}>
            <div className="att-ic"><FileText size={16} /></div>
            <div className="att-main"><div className="att-name">{a.filename}</div><div className="att-meta">{fileKB(a.size)} · added by {a.uploadedBy || '—'}</div></div>
            <div className="att-act">
              <a className="btn ghost xs" href={attachmentUrl(id, a.fileId, true)} target="_blank" rel="noreferrer"><Download size={14} /></a>
              <button className="btn ghost xs danger" onClick={() => removeAtt(a.fileId)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        <input ref={fileRef} type="file" multiple accept={ACCEPT} style={{ display: 'none' }} onChange={pickFiles} />
        <button className="btn ghost mt" disabled={uploading} onClick={() => fileRef.current?.click()}><Paperclip size={16} /> {uploading ? 'Uploading…' : 'Add files'}</button>
      </section>

      {/* 7. Project Priority — the last step; sets the priority the Execution team sees on the project */}
      <section className="form-sec">
        <h3>7. Project Priority</h3>
        <div className="muted small" style={{ marginBottom: 8 }}>Set how urgent this project is. The Execution team receives the project with exactly this priority.</div>
        <div className="form-grid">
          <Field label="Priority *">
            <select value={f.priority} onChange={(e) => setF((s) => ({ ...s, priority: e.target.value }))}>
              {['Low', 'Medium', 'High', 'Urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>
      </section>

      <div className="row-actions" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
        {editingSubmitted ? (
          <>
            <button className="btn" disabled={busy} onClick={() => nav(`/handovers/${id}`)}>Cancel</button>
            <button className="btn primary" disabled={busy} onClick={saveChanges}><Save size={16} /> Save Changes</button>
          </>
        ) : (
          <>
            <button className="btn" disabled={busy} onClick={saveDraft}><Save size={16} /> Save Draft</button>
            <button className="btn primary" disabled={busy} onClick={submit}><Send size={16} /> Submit Handover</button>
          </>
        )}
      </div>
    </div>
  );
}
