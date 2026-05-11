import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsAPI } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [loading, setLoading]     = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const search   = searchParams.get('search')   || '';
  const category = searchParams.get('category') || '';
  const page     = Number(searchParams.get('page') || 1);
  const sort     = searchParams.get('sort') || 'created_at';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort, order: 'desc' };
      if (search)   params.search   = search;
      if (category) params.category = category;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      const res = await productsAPI.getAll(params);
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, category, page, sort, minPrice, maxPrice]);

  useEffect(() => {
    productsAPI.getCategories().then(r => setCategories(r.data.categories || [])).catch(console.error);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', p);
    setSearchParams(next);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">🛍️ All Products</h1>
          <p className="page-subtitle">
            {total > 0 ? `${total} products found` : 'No products found'}
            {search && ` for "${search}"`}
          </p>
        </div>

        <div className="products-layout">
          {/* Filters Sidebar */}
          <aside className="filters-panel">
            <div className="filter-title">Categories</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              <button className={`category-chip ${!category ? 'active' : ''}`} style={{ justifyContent: 'flex-start' }}
                onClick={() => setParam('category', '')}>📦 All Categories</button>
              {categories.map(c => (
                <button key={c.id} className={`category-chip ${category === c.slug ? 'active' : ''}`}
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => setParam('category', c.slug)}>
                  {c.icon} {c.name} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({c.product_count})</span>
                </button>
              ))}
            </div>

            <div className="filter-title">Price Range</div>
            <div className="price-range" style={{ marginBottom: 24 }}>
              <input className="form-input" id="min-price" type="number" placeholder="Min $" value={minPrice}
                onChange={e => setParam('min_price', e.target.value)} style={{ flex: 1 }} />
              <span style={{ color: 'var(--text-muted)' }}>—</span>
              <input className="form-input" id="max-price" type="number" placeholder="Max $" value={maxPrice}
                onChange={e => setParam('max_price', e.target.value)} style={{ flex: 1 }} />
            </div>

            <div className="filter-title">Sort By</div>
            <select className="form-select" value={sort} id="sort-select" onChange={e => setParam('sort', e.target.value)}>
              <option value="created_at">Newest First</option>
              <option value="price">Price Low → High</option>
              <option value="name">Name A → Z</option>
            </select>

            {(search || category || minPrice || maxPrice) && (
              <button className="btn btn-secondary btn-full" style={{ marginTop: 16 }}
                onClick={() => setSearchParams({})}>
                ✕ Clear Filters
              </button>
            )}
          </aside>

          {/* Product Grid */}
          <div>
            {loading ? (
              <div className="product-grid">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="product-card">
                    <div className="skeleton" style={{ height: 200 }} />
                    <div className="product-card-body">
                      <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 18, marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 14, width: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">😕</div>
                <div className="empty-state-title">No products found</div>
                <div className="empty-state-desc">Try adjusting your filters or search terms</div>
                <button className="btn btn-primary" onClick={() => setSearchParams({})}>Clear All Filters</button>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                {/* Pagination */}
                {pages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
                    {[...Array(pages)].map((_, i) => (
                      <button key={i} className={`page-btn ${page === i+1 ? 'active' : ''}`} onClick={() => setPage(i+1)}>{i+1}</button>
                    ))}
                    <button className="page-btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>→</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
