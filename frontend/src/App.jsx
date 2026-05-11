import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useToastController, ToastContainer } from './components/Toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/ProductsAdmin';
import AdminOrders from './pages/admin/OrdersAdmin';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

function AppContent() {
  const { toasts } = useToastController();
  return (
    <div>
      <Navbar />
      <ToastContainer toasts={toasts} />
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/products"     element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart"         element={<Cart />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/register"     element={<Register />} />

        <Route path="/checkout"       element={<PrivateRoute><Checkout /></PrivateRoute>} />
        <Route path="/orders"         element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="/notifications"  element={<PrivateRoute><Notifications /></PrivateRoute>} />

        <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
        <Route path="/admin/orders"   element={<AdminRoute><AdminOrders /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
