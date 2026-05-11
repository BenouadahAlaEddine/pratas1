import { useState, useEffect } from 'react';
import { ordersAPI } from '../api/client';
import { toast } from '../components/Toast';

const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled'
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetch = async () => {
    try {
      const res = await ordersAPI.getAll({ limit: 50 });
      setOrders(res.data.orders || []);
    } catch (e) { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await ordersAPI.cancel(id);
      toast.success('Order cancelled');
      fetch();
    } catch (e) { toast.error(e.response?.data?.error || 'Cannot cancel this order'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">📦 My Orders</h1>
          <p className="page-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No orders yet</div>
            <div className="empty-state-desc">Your order history will appear here.</div>
            <a href="/products" className="btn btn-primary">Start Shopping</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => (
              <div key={order.id} className="card" id={`order-${order.id}`}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Order #{order.id}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={`status-badge status-${order.status}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent)' }}>
                        ${Number(order.total_amount).toFixed(2)}
                      </span>
                      <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                        {expanded === order.id ? '▲ Hide' : '▼ Details'}
                      </button>
                      {['pending', 'confirmed'].includes(order.status) && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(order.id)} id={`cancel-order-${order.id}`}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded items */}
                  {expanded === order.id && (
                    <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                      <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)', fontSize: 13 }}>
                        ORDER ITEMS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(order.items || []).map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                            <span>{item.product_name} × {item.quantity}</span>
                            <span>${Number(item.total_price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      {order.shipping_address && (
                        <div style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 13 }}>
                          📍 Shipping: {order.shipping_address}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
