import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import PriceSummary from '../components/cart/PriceSummary';

const Cart = () => {
  const { cart, isLoading, fetchCart, updateQuantity, removeItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQuantityChange = async (productId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      await removeItem(productId);
    } else {
      await updateQuantity(productId, newQty);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (isLoading && !cart) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-2 text-gray-500">
        <Loader2 size={36} className="animate-spin text-[#2874f0]" />
        <span className="text-sm font-medium">Loading your cart...</span>
      </div>
    );
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="bg-white rounded border border-gray-200 p-12 text-center max-w-md w-full shadow-sm">
          <div className="w-20 h-20 bg-blue-50 text-[#2874f0] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={36} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Your cart is empty!</h2>
          <p className="text-xs text-gray-500 mb-6">Explore our catalog and add items to your cart.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#2874f0] hover:bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded shadow transition"
          >
            <ArrowLeft size={16} />
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Column: Cart Items List */}
        <div className="w-full lg:w-8/12 bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h1 className="text-base font-bold text-gray-900">
              Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h1>
          </div>

          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;

              const primaryImage =
                product.images?.find((img) => img.isPrimary)?.url ||
                product.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80';

              return (
                <div key={product._id} className="p-6 flex flex-col sm:flex-row gap-4 justify-between">
                  {/* Thumbnail & Title */}
                  <div className="flex gap-4">
                    <div className="w-24 h-24 flex-shrink-0 bg-gray-50 border border-gray-100 rounded p-2 flex items-center justify-center">
                      <img
                        src={primaryImage}
                        alt={product.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="flex flex-col">
                      <Link
                        to={`/product/${product._id}`}
                        className="text-sm font-medium text-gray-900 hover:text-[#2874f0] line-clamp-2 leading-snug mb-1"
                      >
                        {product.title}
                      </Link>
                      <span className="text-xs text-gray-400 mb-2">Seller: {product.brand}</span>

                      {/* Item Pricing */}
                      <div className="flex items-baseline gap-2 mt-auto">
                        <span className="text-base font-bold text-gray-900">
                          ₹{item.price.toLocaleString('en-IN')}
                        </span>
                        {product.price > item.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Remove Buttons */}
                  <div className="flex sm:flex-col justify-between sm:items-end gap-3 mt-2 sm:mt-0">
                    <div className="flex items-center border border-gray-300 rounded">
                      <button
                        onClick={() => handleQuantityChange(product._id, item.quantity, -1)}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition"
                        title="Decrease"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(product._id, item.quantity, 1)}
                        disabled={product.stock <= item.quantity}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 transition"
                        title="Increase"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(product._id)}
                      className="text-xs font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1 transition"
                    >
                      <Trash2 size={14} />
                      <span>REMOVE</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Price Summary Sidebar */}
        <div className="w-full lg:w-4/12 sticky top-20">
          <PriceSummary cart={cart} onProceedToCheckout={handleCheckout} />
        </div>

      </div>
    </div>
  );
};

export default Cart;