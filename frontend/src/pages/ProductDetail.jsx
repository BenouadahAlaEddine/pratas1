import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../api/client';
import { useCart } from '../context/CartContext';
import { toast } from '../components/Toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    productsAPI.getById(id)
      .then(r => setProduct(r.data.product))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!product) return null;

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(`${qty}× ${product.name} added to cart!`);
  };

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: 24 }}>← Back</button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          {/* Image */}
          <div style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img src={product.image_url || `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.name)}`}
              alt={product.name} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
          </div>

          {/* Info */}
          <div>
            {product.category_icon && (
              <div className="product-category" style={{ marginBottom: 8 }}>
                {product.category_icon} {product.category_name}
              </div>
            )}
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 32, fontWeight: 800, marginBottom: 12 }}>{product.name}</h1>
            {product.sku && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>SKU: {product.sku}</div>}
            <div style={{ fontSize: 38, fontWeight: 900, color: 'var(--accent)', marginBottom: 16 }}>
              ${Number(product.price).toFixed(2)}
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>{product.description}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div className={`status-badge ${product.stock > 0 ? 'status-delivered' : 'status-cancelled'}`}>
                {product.stock > 0 ? `✓ In Stock (${product.stock})` : '✗ Out of Stock'}
              </div>
            </div>

            {product.stock > 0 && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => setQty(Math.max(1, qty-1))}>−</button>
                  <span className="qty-val">{qty}</span>
                  <button className="qty-btn" onClick={() => setQty(Math.min(product.stock, qty+1))}>+</button>
                </div>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleAdd} id="add-to-cart-btn">
                  🛒 Add to Cart — ${(product.price * qty).toFixed(2)}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="alert alert-info" style={{ flex: 1, minWidth: 150 }}>🚚 Free shipping over $50</div>
              <div className="alert alert-success" style={{ flex: 1, minWidth: 150 }}>↩️ 30-day returns</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
