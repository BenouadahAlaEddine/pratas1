import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ordersAPI, authAPI } from '../../api/client';

const AdminNav = () => {
  const loc = useLocation();
  const links = [
    { to: '/admin',          icon: '📊', label: 'Dashboard' },
    { to: '/admin/products', icon: '📦', label: 'Products' },
    { to: '/admin/orders',   icon: '🛒', label: 'Orders' },
    { to: '/',               icon: '🏪', label: 'View Store' },
  ];
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-title">Admin Panel</div>
      {links.map(l => (
        <Link key={l.to} to={l.to} className={`admin-nav-item ${loc.pathname === l.to ? 'active' : ''}`}>
          <span>{l.icon}</span> {l.label}
        </Link>
      ))}
    </aside>
  );
};

export { AdminNav };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ordersAPI.getStats(),
      authAPI.getUsers({ limit: 5 }),
    ]).then(([sRes, uRes]) => {
      setStats(sRes.data.stats);
      setUsers(uRes.data.users || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-layout">
      <AdminNav />
      <div className="admin-content container">
        <div className="page-header">
          <h1 className="page-title">⚙️ Admin Dashboard</h1>
          <p className="page-subtitle">Welcome back, Admin. Here's your store overview.</p>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="dash-grid">
              <div className="dash-stat">
                <div className="dash-stat-icon">🛒</div>
                <div className="dash-stat-val">{stats?.total_orders || 0}</div>
                <div className="dash-stat-lbl">Total Orders</div>
              </div>
              <div className="dash-stat">
                <div className="dash-stat-icon">⏳</div>
                <div className="dash-stat-val">{stats?.pending_orders || 0}</div>
                <div className="dash-stat-lbl">Pending Orders</div>
              </div>
              <div className="dash-stat">
                <div className="dash-stat-icon">💰</div>
                <div className="dash-stat-val">${Number(stats?.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <div className="dash-stat-lbl">Total Revenue</div>
              </div>
              <div className="dash-stat">
                <div className="dash-stat-icon">👥</div>
                <div className="dash-stat-val">{users.length}</div>
                <div className="dash-stat-lbl">Recent Users</div>
              </div>
            </div>

            {/* Orders by Status */}
            {stats?.by_status && (
              <div className="card card-body" style={{ marginBottom: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Orders by Status</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {stats.by_status.map(s => (
                    <div key={s.status} className={`status-badge status-${s.status}`} style={{ padding: '8px 16px', fontSize: 14 }}>
                      {s.status}: <strong>{s.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Users */}
            <div className="card card-body">
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Recent Users</h3>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{u.name[0]}</div>
                          {u.name}
                        </div></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td><span className={`status-badge ${u.role === 'admin' ? 'status-shipped' : 'status-confirmed'}`}>{u.role}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
