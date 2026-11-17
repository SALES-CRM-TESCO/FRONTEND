import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../notifications.jsx';
import { timeAgo } from '../api.js';
import { Empty } from '../components/ui.jsx';

export default function Notifications() {
  const { items, unread, markAll, open } = useNotifications();
  const nav = useNavigate();
  return (
    <div>
      <div className="page-head">
        <div><h2>Notifications</h2><div className="muted">{unread} unread</div></div>
        {unread > 0 && <button className="btn ghost" onClick={markAll}><CheckCheck size={16} /> Mark all read</button>}
      </div>
      {items.length === 0 ? <Empty icon={Bell} title="No notifications yet">Updates from the Execution team on your handovers will appear here.</Empty> : (
        <div className="panel">
          <ul className="list">
            {items.map((n) => (
              <li key={n.id} className="click" onClick={() => open(n)} style={{ cursor: 'pointer' }}>
                <div>
                  <strong className={n.read ? '' : 'unread-dot'}>{n.title}</strong>
                  <div className="small muted">{n.message}</div>
                </div>
                <div className="muted small">{timeAgo(n.createdAt)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
