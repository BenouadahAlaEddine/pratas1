import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from './Toast';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const navigate    = useNavigate();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (product.stock === 0) return;
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div
      className="product-card fade-in"
      onClick={() => navigate(`/products/${product.id}`)}
      id={`product-card-${product.id}`}
    >
      <div className="product-img-wrap">
        <img
          src={product.image_url || `https://via.placeholder.com/400x300?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          loading="lazy"
        />
        {product.stock === 0 && <span className="product-badge out">Out of Stock</span>}
        {product.stock > 0 && product.stock < 10 && <span className="product-badge">Only {product.stock} left</span>}
      </div>
      <div className="product-card-body">
        {product.category_icon && (
          <div className="product-category">{product.category_icon} {product.category_name}</div>
        )}
        <div className="product-name">{product.name}</div>
        <div className="product-desc">{product.description}</div>
        <div className="product-footer">
          <div>
            <div className="product-price">${Number(product.price).toFixed(2)}</div>
            <div className="product-stock">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</div>
          </div>
          <button
            className="product-add-btn"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            title="Add to cart"
            id={`add-to-cart-${product.id}`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
