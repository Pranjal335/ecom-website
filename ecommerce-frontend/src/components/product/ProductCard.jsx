import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

const ProductCard = ({ product }) => {
  const { addToCart } = useCartStore();

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80';

  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const effectivePrice = hasDiscount ? product.discountPrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product._id, 1);
  };

  return (
    <div className="bg-white rounded border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between p-4 group">
      <Link to={`/product/${product._id}`} className="flex flex-col h-full">
        {/* Product Image */}
        <div className="w-full h-48 flex items-center justify-center overflow-hidden mb-3 bg-gray-50 rounded">
          <img
            src={primaryImage}
            alt={product.title}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
            {product.brand}
          </span>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-[#2874f0] mb-2 leading-snug">
            {product.title}
          </h3>

          {/* Rating Badge */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="inline-flex items-center gap-0.5 bg-green-700 text-white text-xs font-bold px-1.5 py-0.5 rounded">
              {product.ratingsAverage || '4.2'} <Star size={10} className="fill-current" />
            </span>
            <span className="text-xs text-gray-400">({product.ratingsQuantity || 120})</span>
          </div>

          {/* Price & Discount */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gray-900">₹{effectivePrice.toLocaleString('en-IN')}</span>
              {hasDiscount && (
                <>
                  <span className="text-xs text-gray-500 line-through">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-semibold text-green-600">
                    {discountPercent}% off
                  </span>
                </>
              )}
            </div>
            {product.stock <= 5 && product.stock > 0 && (
              <span className="text-[11px] text-red-600 font-semibold mt-1 block">
                Only {product.stock} left in stock!
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Quick Add Button */}
      <button
        onClick={handleAddToCart}
        disabled={product.stock === 0}
        className={`mt-3 w-full py-2 px-3 text-sm font-semibold rounded flex items-center justify-center gap-1.5 transition ${
          product.stock === 0
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-[#ff9f00] hover:bg-[#f39700] text-white shadow-sm'
        }`}
      >
        <ShoppingCart size={15} />
        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  );
};

export default ProductCard;