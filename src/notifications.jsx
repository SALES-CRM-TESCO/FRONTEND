import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell } from 'lucide-react';
import { api } from './api.js';

const Ctx = createContext(null);
const POLL_MS = 20000;

export function NotificationsProvider({ children }) {
  const [state, setState] = useState({ items: [], unread: 0 });
  const [toasts, setToasts] = useState([]);
  const [tick, setTick] = useState(0);
  const known = useRef(null);
  const nav = useNavigate();

  const reload = useCallback(async () => {
    try {
      const d = await api('/notifications');
      setState(d);
      const ids = new Set(d.items.map((n) => n.id));
      if (known.current) {
        const fresh = d.items.filter((n) => !n.read && !known.current.has(n.id)).slice(0, 3);
        if (fresh.length) {
          setToasts((t) => [...fresh.map((n) => ({ ...n, tid: n.id })), ...t].slice(0, 4));
          setTick((x) => x + 1);
        }
      }
      known.current = ids;
    } catch { /* offline – retry next poll */ }
  }, []);

  useEffect(() => {
    reload();
    const t = setInterval(reload, POLL_MS);
    const onFocus = () => reload();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus); };
  }, [reload]);

  useEffect(() => {
    document.title = state.unread ? `(${state.unread}) Sales Portal - Tesco Structures` : 'Sales Portal - Tesco Structures';
  }, [state.unread]);

  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((x) => x.slice(0, -1)), 7000);
    return () => clearTimeout(t);
  }, [toasts]);

  const markRead = useCallback(async (n) => {
    if (n.read) return;
    setState((s) => ({ items: s.items.map((x) => (x.id === n.id ? { ...x, read: true } : x)), unread: Math.max(0, s.unread - 1) }));
    await api(`/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {});
  }, []);

  const markAll = useCallback(async () => {
    setState((s) => ({ items: s.items.map((x) => ({ ...x, read: true })), unread: 0 }));
    await api('/notifications/read-all', { method: 'POST' }).catch(() => {});
    reload();
  }, [reload]);

  const open = useCallback(async (n) => {
    await markRead(n);
    setToasts((t) => t.filter((x) => x.id !== n.id));
    if (n.link) nav(n.link);
  }, [markRead, nav]);

  const clearToasts = useCallback(() => setToasts([]), []);

  return (
    <Ctx.Provider value={{ ...state, tick, reload, markRead, markAll, open, clearToasts }}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((n) => (
          <div key={n.tid} className={`toast t-${n.type}`} onClick={() => open(n)} role="button" tabIndex={0}>
            <Bell size={18} />
            <div className="grow"><b>{n.title}</b><span>{n.message}</span></div>
            <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setToasts((t) => t.filter((x) => x.tid !== n.tid)); }} aria-label="Dismiss"><X size={16} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useNotifications = () => useContext(Ctx);
