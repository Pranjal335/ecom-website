import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../api/productApi';
import { useCartStore } from '../store/useCartStore';
import { Star, ShoppingCart, Zap, ShieldCheck, RefreshCw, Truck, Loader2 } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await getProductById(id);
        const data = res.data;
        setProduct(data);
        const primary = data.images?.find((img) => img.isPrimary)?.url || data.images?.[0]?.url;
        setSelectedImage(primary || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80');
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[#2874f0]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-gray-500 font-medium">
        Product not found.
      </div>
    );
  }

  const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const discountPercent = product.discountPrice > 0
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleBuyNow = async () => {
    await addToCart(product._id, 1);
    navigate('/cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Image Previews & Action Buttons */}
        <div className="w-full md:w-5/12 flex flex-col items-center">
          <div className="w-full h-80 flex items-center justify-center p-4 border border-gray-100 rounded mb-4">
            <img
              src={selectedImage}
              alt={product.title}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-3 w-full mt-2">
            <button
              onClick={() => addToCart(product._id, 1)}
              disabled={product.stock === 0}
              className="py-3 px-4 bg-[#ff9f00] hover:bg-[#f39700] text-white font-bold rounded flex items-center justify-center gap-2 shadow"
            >
              <ShoppingCart size={18} />
              ADD TO CART
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="py-3 px-4 bg-[#fb641b] hover:bg-[#e85b17] text-white font-bold rounded flex items-center justify-center gap-2 shadow"
            >
              <Zap size={18} />
              BUY NOW
            </button>
          </div>
        </div>

        {/* Right Column: Title, Pricing & Details */}
        <div className="w-full md:w-7/12 flex flex-col">
          <span className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">
            {product.brand}
          </span>
          <h1 className="text-xl md:text-2xl font-medium text-gray-900 mb-2">
            {product.title}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 bg-green-700 text-white text-xs font-bold px-2 py-0.5 rounded">
              {product.ratingsAverage || '4.2'} <Star size={11} className="fill-current" />
            </span>
            <span className="text-xs font-medium text-gray-500">
              {product.ratingsQuantity || 120} Ratings & Reviews
            </span>
          </div>

          {/* Pricing Box */}
          <div className="border-t border-b border-gray-100 py-3 mb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-gray-900">
                ₹{effectivePrice.toLocaleString('en-IN')}
              </span>
              {product.discountPrice > 0 && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    {discountPercent}% off
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-green-700 font-semibold mt-1">Inclusive of all taxes</div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-800 mb-1">Product Description</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-[#2874f0]" />
              <span>Fast & Free Delivery Available</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="text-[#2874f0]" />
              <span>7 Days Replacement Policy</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#2874f0]" />
              <span>100% Genuine Guarantee</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;