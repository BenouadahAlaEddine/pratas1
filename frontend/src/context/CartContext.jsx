import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: Math.min(i.quantity + qty, product.stock) }
            : i
        );
      }
      return [...prev, {
        product_id:   product.id,
        product_name: product.name,
        product_sku:  product.sku,
        image_url:    product.image_url,
        unit_price:   product.price,
        stock:        product.stock,
        quantity:     Math.min(qty, product.stock),
      }];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
  }, []);

  const updateQty = useCallback((productId, qty) => {
    if (qty <= 0) return removeItem(productId);
    setItems(prev => prev.map(i => i.product_id === productId ? { ...i, quantity: qty } : i));
  }, [removeItem]);

  const clear = useCallback(() => setItems([]), []);

  const total       = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const totalItems  = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, total, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
