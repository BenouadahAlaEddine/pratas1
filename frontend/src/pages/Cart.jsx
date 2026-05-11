import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, removeItem, updateQty, clear, total, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <div className="empty-state-title">Your cart is empty</div>
            <div className="empty-state-desc">Looks like you haven't added any items yet.</div>
            <Link to="/products" className="btn btn-primary">Start Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">🛒 Shopping Cart</h1>
          <p className="page-subtitle">{totalItems} item{totalItems !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="cart-layout">
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => (
              <div key={item.product_id} className="cart-item" id={`cart-item-${item.product_id}`}>
                <img src={item.image_url || 'https://via.placeholder.com/80'} alt={item.product_name} />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.product_name}</div>
                  <div className="cart-item-price">${item.unit_price.toFixed(2)} each</div>
                  {item.product_sku && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SKU: {item.product_sku}</div>}
                </div>
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => updateQty(item.product_id, item.quantity - 1)}>−</button>
                  <span className="qty-val">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.product_id, Math.min(item.stock, item.quantity + 1))}>+</button>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, minWidth: 80, textAlign: 'right' }}>
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.product_id)}>✕</button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={clear}>
              🗑️ Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, marginBottom: 16 }}>Order Summary</h3>
            <div className="summary-row">
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal ({totalItems} items)</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
              <span style={{ color: 'var(--success)' }}>{total >= 50 ? 'Free' : '$9.99'}</span>
            </div>
            <div className="summary-row" style={{ borderBottom: 'none' }}>
              <span className="summary-total">Total</span>
              <span className="summary-total" style={{ color: 'var(--accent)' }}>
                ${(total + (total >= 50 ? 0 : 9.99)).toFixed(2)}
              </span>
            </div>
            <button
              id="checkout-btn"
              className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: 20 }}
              onClick={() => user ? navigate('/checkout') : navigate('/login?redirect=/checkout')}
            >
              {user ? '🔒 Proceed to Checkout' : '🔑 Login to Checkout'}
            </button>
            <Link to="/products" className="btn btn-secondary btn-full" style={{ marginTop: 10, textAlign: 'center' }}>
              ← Continue Shopping
            </Link>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              🔐 Secure Checkout &nbsp;·&nbsp; 📦 Fast Delivery &nbsp;·&nbsp; ↩️ Easy Returns
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
