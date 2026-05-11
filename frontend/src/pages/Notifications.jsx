import { useState, useEffect } from 'react';
import { notificationsAPI } from '../api/client';
import { toast } from '../components/Toast';

const TYPE_ICONS = { order: '📦', payment: '💳', promo: '🎁', system: '⚙️', alert: '⚠️' };

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function Notifications() {
  const [notifications, setNotifsLocal] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const res = await notificationsAPI.getAll({ limit: 50 });
      setNotifsLocal(res.data.notifications || []);
      setUnread(res.data.unread_count || 0);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const markRead = async (id) => {
    await notificationsAPI.markRead(id);
    setNotifsLocal(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    setUnread(u => Math.max(0, u - 1));
  };

  const readAll = async () => {
    await notificationsAPI.readAll();
    setNotifsLocal(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnread(0);
    toast.success('All notifications marked as read');
  };

  const clearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    await notificationsAPI.clear();
    setNotifsLocal([]);
    setUnread(0);
    toast.success('Notifications cleared');
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 className="page-title">🔔 Notifications</h1>
            {unread > 0 && <p className="page-subtitle">{unread} unread</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {unread > 0 && <button className="btn btn-secondary btn-sm" onClick={readAll}>Mark all read</button>}
            {notifications.length > 0 && <button className="btn btn-danger btn-sm" onClick={clearAll}>Clear all</button>}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔕</div>
            <div className="empty-state-title">No notifications</div>
            <div className="empty-state-desc">You're all caught up! Place an order to get started.</div>
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map(n => (
              <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`}
                onClick={() => !n.is_read && markRead(n.id)}
                style={{ cursor: n.is_read ? 'default' : 'pointer' }}
                id={`notif-${n.id}`}>
                <div className="notif-icon">{TYPE_ICONS[n.type] || '📢'}</div>
                <div className="notif-content">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-msg">{n.message}</div>
                  <div className="notif-time">{timeAgo(n.created_at)}</div>
                </div>
                {!n.is_read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
