import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

export default function Navbar({ onSearch }) {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchVal, setSearchVal] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) navigate(`/products?search=${encodeURIComponent(searchVal.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">⚡ ShopWave</Link>

        {/* Search */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <span className="navbar-search-icon">🔍</span>
          <input
            id="nav-search"
            type="text"
            placeholder="Search products..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
          />
        </form>

        {/* Links */}
        <div className="navbar-links">
          <Link to="/"        className={`navbar-link ${isActive('/')}`}>Home</Link>
          <Link to="/products" className={`navbar-link ${isActive('/products')}`}>Shop</Link>

          {user ? (
            <>
              <Link to="/orders" className={`navbar-link ${isActive('/orders')}`}>Orders</Link>
              <Link to="/notifications" className={`navbar-link ${isActive('/notifications')}`}>🔔</Link>
              {isAdmin && <Link to="/admin" className={`navbar-link ${isActive('/admin')}`} style={{ color: '#ffd700' }}>⚙️ Admin</Link>}
              <div className="navbar-user">
                <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
                <button className="navbar-link" onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login"    className="navbar-link">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}

          {/* Cart */}
          <Link to="/cart" id="cart-button" className="navbar-cart-btn">
            🛒 Cart
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
        </div>
      </div>
    </nav>
  );
}
