import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut, Package } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isAuthenticated, logout } = useAuthStore();
  const { totalItems } = useCartStore();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#2874f0] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">

        {/* Brand Logo */}
        <Link to="/" className="flex flex-col items-start leading-none select-none">
          <span className="text-xl font-bold tracking-tight italic">E-Shop</span>
          <span className="text-[10px] text-yellow-300 font-semibold tracking-wider flex items-center gap-0.5">
            Explore <span className="text-white font-bold">Plus</span>
          </span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
          <input
            type="text"
            placeholder="Search for products, brands and more"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white text-gray-900 placeholder-gray-500 text-sm px-4 py-2 pr-10 rounded-sm focus:outline-none shadow-inner"
          />
          <button type="submit" className="absolute right-2.5 top-2.5 text-[#2874f0]">
            <Search size={18} />
          </button>
        </form>

        {/* User Actions */}
        <div className="flex items-center gap-6">
          {isAuthenticated && (user?.role === 'seller' || user?.role === 'admin') && (
            <Link
              to="/seller/dashboard"
              className="bg-yellow-400 text-gray-900 px-3 py-1 text-xs font-bold rounded-sm hover:bg-yellow-300 transition shadow-sm"
            >
              Seller Hub
            </Link>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link to="/orders" className="flex items-center gap-1.5 text-sm font-medium hover:text-yellow-200">
                <Package size={18} />
                <span>Orders</span>
              </Link>
              <div className="flex items-center gap-2">
                <User size={18} />
                <span className="text-sm font-semibold">{user?.name?.split(' ')[0]}</span>
                <button
                  onClick={logout}
                  title="Logout"
                  className="ml-1 text-gray-200 hover:text-white"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-white text-[#2874f0] px-6 py-1 text-sm font-semibold rounded-sm hover:bg-gray-100 transition shadow-sm"
            >
              Login
            </Link>
          )}

          {/* Cart Icon with Live Counter */}
          <Link to="/cart" className="flex items-center gap-1.5 font-semibold text-sm hover:text-yellow-200">
            <div className="relative">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <span>Cart</span>
          </Link>
        </div>

      </div>
    </header>
  );
};

export default Navbar;