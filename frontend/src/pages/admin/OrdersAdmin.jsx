import { useState, useEffect } from 'react';
import { ordersAPI } from '../../api/client';
import { toast } from '../../components/Toast';
import { AdminNav } from './Dashboard';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');

  const fetch = async () => {
    try {
      const params = { limit: 100 };
      if (filter) params.status = filter;
      const res = await ordersAPI.getAll(params);
      setOrders(res.data.orders || []);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter]);

  const handleStatus = async (id, status) => {
    try {
      await ordersAPI.updateStatus(id, status);
      toast.success(`Order #${id} → ${status}`);
      fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update status'); }
  };

  return (
    <div className="admin-layout">
      <AdminNav />
      <div className="admin-content container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">🛒 Manage Orders</h1>
            <p className="page-subtitle">{orders.length} orders</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Filter:</label>
            <select id="order-filter" className="form-select" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No orders found</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>User</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} id={`admin-order-${o.id}`}>
                    <td style={{ fontWeight: 700 }}>#{o.id}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>User #{o.user_id}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {(o.items || []).length} items
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>${Number(o.total_amount).toFixed(2)}</td>
                    <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <select
                        id={`order-status-${o.id}`}
                        className="form-select"
                        style={{ width: 140, padding: '6px 10px', fontSize: 13 }}
                        value={o.status}
                        onChange={e => handleStatus(o.id, e.target.value)}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
