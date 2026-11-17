import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, FileStack, FilePlus2, Users, Bell, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { timeAgo } from '../api.js';
import { NotificationsProvider, useNotifications } from '../notifications.jsx';

function Bellmenu() {
  const { items, unread, reload, markAll, open: openItem, clearToasts } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const loc = useLocation();
  useEffect(() => { reload(); setOpen(false); }, [loc.pathname]); // eslint-disable-line
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);
  const go = (n) => { setOpen(false); openItem(n); };
  return (
    <div className="bell" ref={ref}>
      <button className={`icon-btn bell-btn ${open ? 'on' : ''}`} onClick={() => { if (!open) { reload(); clearToasts(); } setOpen((o) => !o); }} aria-label="Notifications">
        <Bell size={20} />
        {unread > 0 && <span className="bell-dot">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="bell-menu">
          <div className="bell-head">
            <strong>Notifications</strong>
            {unread > 0 && <button className="link" onClick={markAll}>Mark all read</button>}
          </div>
          <div className="bell-list">
            {items.length === 0 && <div className="muted pad center">You're all caught up 🎉</div>}
            {items.slice(0, 12).map((n) => (
              <button key={n.id} className={`bell-item ${n.read ? '' : 'unread'} t-${n.type}`} onClick={() => go(n)}>
                <div className="bell-title">{n.title}</div>
                <div className="bell-msg">{n.message}</div>
                <div className="bell-time">{timeAgo(n.createdAt)}</div>
              </button>
            ))}
          </div>
          <NavLink to="/notifications" className="bell-all" onClick={() => setOpen(false)}>View all</NavLink>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  return <NotificationsProvider><Shell>{children}</Shell></NotificationsProvider>;
}

function Shell({ children }) {
  const { user, isHead, logout } = useAuth();
  const links = isHead
    ? [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/handovers', icon: FileStack, label: 'Handovers', end: true },
        { to: '/team', icon: Users, label: 'Team & Logins' },
      ]
    : [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/handovers', icon: FileStack, label: 'Handovers', end: true },
        { to: '/notifications', icon: Bell, label: 'Alerts' },
      ];
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="side-brand">
          <img src="/favicon.png" alt="" />
          <div><b>Tesco Structures</b><span>Sales Management</span></div>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="side-link">
              <l.icon size={18} /> {l.label}
            </NavLink>
          ))}
          <NavLink to="/account" className="side-link"><UserCircle size={18} /> My Account</NavLink>
        </nav>
        <div className="side-foot">
          <div className="who">
            <div className="avatar">{user.name[0]}</div>
            <div><div className="who-name">{user.name}</div><div className="who-role">{isHead ? 'Sales Head' : 'Sales Team'}</div></div>
          </div>
          <button className="side-link logout" onClick={logout}><LogOut size={18} /> Logout</button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="top-logo mobile-only"><img src="/tescologo2.png" alt="Tesco Structures" /><span>Sales</span></div>
          <div className="topbar-right">
            <Bellmenu />
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
      <nav className="bottom-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className="bn-link">
            <l.icon size={20} />
            <span>{l.label}</span>
          </NavLink>
        ))}
        <button className="bn-link" onClick={logout}><LogOut size={20} /><span>Logout</span></button>
      </nav>
    </div>
  );
}
