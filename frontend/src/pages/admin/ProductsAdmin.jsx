import { useState, useEffect } from 'react';
import { productsAPI } from '../../api/client';
import { toast } from '../../components/Toast';
import { AdminNav } from './Dashboard';

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', sku: '', image_url: '', category_id: '' };

export default function AdminProducts() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editing, setEditing]     = useState(null); // product id being edited
  const [showForm, setShowForm]   = useState(false);

  const fetch = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        productsAPI.getAll({ limit: 50 }),
        productsAPI.getCategories(),
      ]);
      setProducts(pRes.data.products || []);
      setCategories(cRes.data.categories || []);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true); };

  const openEdit = (p) => {
    setForm({
      name: p.name, description: p.description || '',
      price: p.price, stock: p.stock, sku: p.sku || '',
      image_url: p.image_url || '', category_id: p.category_id || '',
    });
    setEditing(p.id); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock), category_id: form.category_id || null };
      if (editing) {
        await productsAPI.update(editing, payload);
        toast.success('Product updated!');
      } else {
        await productsAPI.create(payload);
        toast.success('Product created!');
      }
      setShowForm(false); fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save product'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Deactivate "${name}"?`)) return;
    try {
      await productsAPI.delete(id);
      toast.success('Product deactivated');
      fetch();
    } catch { toast.error('Failed to deactivate product'); }
  };

  return (
    <div className="admin-layout">
      <AdminNav />
      <div className="admin-content container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 className="page-title">📦 Manage Products</h1>
            <p className="page-subtitle">{products.length} products</p>
          </div>
          <button id="create-product-btn" className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
          }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, marginBottom: 24 }}>
                {editing ? 'Edit Product' : 'Create Product'}
              </h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input id="product-name" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Price ($) *</label>
                    <input id="product-price" type="number" step="0.01" min="0" className="form-input" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock *</label>
                    <input id="product-stock" type="number" min="0" className="form-input" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input id="product-sku" className="form-input" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="PROD-001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select id="product-category" className="form-select" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input className="form-input" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                  <button id="save-product-btn" type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {editing ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products Table */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>SKU</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} id={`admin-product-${p.id}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={p.image_url || 'https://via.placeholder.com/40'} alt={p.name}
                          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.category_icon} {p.category_name}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>${Number(p.price).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${p.stock > 10 ? 'status-delivered' : p.stock > 0 ? 'status-processing' : 'status-cancelled'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.sku || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)} id={`edit-product-${p.id}`}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.name)} id={`delete-product-${p.id}`}>Delete</button>
                      </div>
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
