import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsAPI.getAll({ limit: 8, sort: 'created_at', order: 'desc' }),
      productsAPI.getCategories(),
    ]).then(([pRes, cRes]) => {
      setFeaturedProducts(pRes.data.products || []);
      setCategories(cRes.data.categories || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow">✨ Microservices-Powered E-Commerce - quickdeal.me </div>
            <h1>Shop the Future<br />with ShopWave</h1>
            <p>Explore thousands of premium products with lightning-fast delivery, intelligent recommendations, and seamless checkout.</p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg" id="hero-shop-btn">
                🛍️ Start Shopping
              </Link>
              <Link to="/register" className="btn btn-secondary btn-lg" id="hero-signup-btn">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="container">
        <div className="stats-bar">
          <div className="stat-item"><div className="stat-value">12+</div><div className="stat-label">Product Categories</div></div>
          <div className="stat-item"><div className="stat-value">500+</div><div className="stat-label">Products Available</div></div>
          <div className="stat-item"><div className="stat-value">6</div><div className="stat-label">Microservices</div></div>
          <div className="stat-item"><div className="stat-value">99.9%</div><div className="stat-label">Uptime SLA</div></div>
        </div>

        {/* Categories */}
        <section style={{ marginBottom: 56 }}>
          <div className="section-header">
            <h2 className="section-title">Browse Categories</h2>
            <Link to="/products" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
          <div className="category-grid">
            {categories.map(cat => (
              <Link to={`/products?category=${cat.slug}`} key={cat.id} className="category-chip">
                <span>{cat.icon}</span> {cat.name}
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({cat.product_count})</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section style={{ marginBottom: 80 }}>
          <div className="section-header">
            <h2 className="section-title">✨ Featured Products</h2>
            <Link to="/products" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
          {loading ? (
            <div className="product-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="product-card">
                  <div className="skeleton" style={{ height: 200 }} />
                  <div className="product-card-body">
                    <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 20, width: '90%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 14, width: '100%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>

        {/* Features */}
        <section style={{ marginBottom: 80 }}>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 40 }}>Why ShopWave?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { icon: '⚡', title: 'Lightning Fast', desc: 'Microservices architecture for ultra-low latency and high scalability' },
              { icon: '🔐', title: 'Secure by Design', desc: 'JWT authentication, rate limiting, and encrypted data across all services' },
              { icon: '🚀', title: 'Cloud-Ready', desc: 'Kubernetes + Helm deployment for seamless scaling and zero-downtime updates' },
              { icon: '📊', title: 'Real-time Insights', desc: 'Live order tracking, payment status, and smart notifications' },
            ].map((f, i) => (
              <div key={i} className="card card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{f.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
