import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ordersAPI, paymentsAPI } from '../api/client';
import { toast } from '../components/Toast';

const STEPS = ['Shipping', 'Payment', 'Confirmation'];

export default function Checkout() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);

  const [shipping, setShipping] = useState({
    name: '', address: '', city: '', zip: '', country: 'US'
  });
  const [card, setCard] = useState({
    number: '4111 1111 1111 1111', expiry: '12/26', cvc: '123', name: ''
  });

  if (items.length === 0 && !order) {
    navigate('/cart');
    return null;
  }

  const handleShipping = async (e) => {
    e.preventDefault();
    if (!shipping.name || !shipping.address || !shipping.city) {
      toast.error('Please fill all shipping fields');
      return;
    }
    setStep(1);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create order
      const orderPayload = {
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping_address: `${shipping.name}, ${shipping.address}, ${shipping.city} ${shipping.zip}, ${shipping.country}`,
      };
      const orderRes = await ordersAPI.create(orderPayload);
      const createdOrder = orderRes.data.order;
      setOrder(createdOrder);

      // 2. Process payment
      const payRes = await paymentsAPI.pay({
        order_id:    createdOrder.id,
        amount:      createdOrder.total_amount,
        method:      'card',
        card_number: card.number.replace(/\s/g, ''),
      });

      setPayment(payRes.data.payment);
      clear();
      setStep(2);
      toast.success('Order placed successfully! 🎉');
    } catch (err) {
      const msg = err.response?.data?.error || 'Payment failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        <h1 className="page-title">Checkout</h1>

        {/* Steps */}
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <div className={`step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                <div className="step-num">{i < step ? '✓' : i + 1}</div>
                {s}
              </div>
              {i < STEPS.length - 1 && <div className="step-divider" />}
            </div>
          ))}
        </div>

        {/* Step 0: Shipping */}
        {step === 0 && (
          <form onSubmit={handleShipping}>
            <div className="card card-body" style={{ marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>📦 Shipping Address</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Full Name</label>
                  <input id="shipping-name" className="form-input" value={shipping.name} onChange={e => setShipping({...shipping, name: e.target.value})} placeholder="John Doe" required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Address</label>
                  <input id="shipping-address" className="form-input" value={shipping.address} onChange={e => setShipping({...shipping, address: e.target.value})} placeholder="123 Main St" required />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input id="shipping-city" className="form-input" value={shipping.city} onChange={e => setShipping({...shipping, city: e.target.value})} placeholder="New York" required />
                </div>
                <div className="form-group">
                  <label className="form-label">ZIP Code</label>
                  <input id="shipping-zip" className="form-input" value={shipping.zip} onChange={e => setShipping({...shipping, zip: e.target.value})} placeholder="10001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <select id="shipping-country" className="form-select" value={shipping.country} onChange={e => setShipping({...shipping, country: e.target.value})}>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="FR">France</option>
                    <option value="DE">Germany</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Order Summary mini */}
            <div className="card card-body" style={{ marginBottom: 24 }}>
              <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Order Summary ({items.length} items)</h4>
              {items.map(i => (
                <div key={i.product_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  <span>{i.product_name} × {i.quantity}</span>
                  <span>${(i.unit_price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: 12, fontSize: 18 }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent)' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            <button type="submit" id="continue-to-payment" className="btn btn-primary btn-lg btn-full">Continue to Payment →</button>
          </form>
        )}

        {/* Step 1: Payment */}
        {step === 1 && (
          <form onSubmit={handlePayment}>
            <div className="card card-body" style={{ marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>💳 Payment Details</h3>
              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                ℹ️ This is a simulation. Use any card number. Payments have a 90% success rate for demo purposes.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input id="card-number" className="form-input" value={card.number}
                    onChange={e => setCard({...card, number: e.target.value})} placeholder="4111 1111 1111 1111" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Name on Card</label>
                  <input id="card-name" className="form-input" value={card.name}
                    onChange={e => setCard({...card, name: e.target.value})} placeholder="John Doe" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Expiry</label>
                    <input id="card-expiry" className="form-input" value={card.expiry}
                      onChange={e => setCard({...card, expiry: e.target.value})} placeholder="MM/YY" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVC</label>
                    <input id="card-cvc" className="form-input" value={card.cvc}
                      onChange={e => setCard({...card, cvc: e.target.value})} placeholder="123" required />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
              <button type="submit" id="place-order-btn" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading}>
                {loading ? '⏳ Processing...' : `💳 Pay $${total.toFixed(2)}`}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && order && (
          <div className="card card-body" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{payment?.status === 'completed' ? '🎉' : '⚠️'}</div>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
              {payment?.status === 'completed' ? 'Order Confirmed!' : 'Payment Issue'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Order <strong>#{order.id}</strong> has been placed.
              {payment?.transaction_ref && ` Ref: ${payment.transaction_ref}`}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => navigate('/orders')}>View My Orders</button>
              <button className="btn btn-secondary" onClick={() => navigate('/products')}>Continue Shopping</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
