import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';

const Cart = () => (
  <div className="max-w-7xl mx-auto p-6">
    <h1 className="text-2xl font-bold">Shopping Cart</h1>
  </div>
);

const Login = () => (
  <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
    <h2 className="text-xl font-bold mb-4">Login to your account</h2>
  </div>
);

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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;