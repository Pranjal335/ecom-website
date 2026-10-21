import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';

function App() {
  const { checkAuth } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    checkAuth();
    fetchCart();
  }, [checkAuth, fetchCart]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;