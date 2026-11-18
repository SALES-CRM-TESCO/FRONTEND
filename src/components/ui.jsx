import { useEffect } from 'react';
import { X } from 'lucide-react';

const statusClass = {
  Draft: 'gray', Submitted: 'blue', 'Under Review': 'amber', 'Changes Requested': 'orange', Accepted: 'green', Rejected: 'red',
  // Execution daily-task statuses (read-only view)
  'To Do': 'gray', 'In Progress': 'blue', Done: 'green',
};

export const Badge = ({ value, extra }) => (value ? <span className={`badge b-${statusClass[value] || 'gray'}`}>{value}{extra}</span> : null);

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export const Loader = () => <div className="loader"><div className="spinner" /></div>;
export const ErrorBox = ({ error }) => (error ? <div className="alert error">{error}</div> : null);
export const Empty = ({ icon: Icon, title, children }) => (
  <div className="empty">
    {Icon && <Icon size={36} />}
    <div className="empty-title">{title}</div>
    {children && <div className="muted">{children}</div>}
  </div>
);

export function Field({ label, children, hint, full }) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}
