import React, { useState } from 'react';
import { ShieldCheck, Tag, Loader2, ArrowRight } from 'lucide-react';
import { applyCoupon, removeCoupon } from '../../api/cartApi';
import { useCartStore } from '../../store/useCartStore';

const PriceSummary = ({ cart, onProceedToCheckout }) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const { fetchCart } = useCartStore();

  const subtotal = cart?.subtotal || 0;
  const discount = cart?.discount || 0;
  const shipping = subtotal > 500 || subtotal === 0 ? 0 : 50;
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = Math.max(0, Math.round((subtotal + shipping + tax - discount) * 100) / 100);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    try {
      await applyCoupon(couponCode.trim());
      await fetchCart();
      setCouponCode('');
    } catch (err) {
      setCouponError(err.message || 'Invalid or expired coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponLoading(true);
    try {
      await removeCoupon();
      await fetchCart();
    } catch (err) {
      console.error(err);
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Coupon Application Box */}
      <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-800">
          <Tag size={16} className="text-[#2874f0]" />
          <span>Apply Coupon</span>
        </div>

        {cart?.coupon ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 p-2.5 rounded text-xs">
            <div>
              <span className="font-bold text-green-800">{cart.coupon.code}</span> applied!
              <span className="block text-green-700 font-semibold">You saved ₹{discount}</span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              disabled={couponLoading}
              className="text-red-600 font-bold hover:underline ml-2"
            >
              Remove
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="flex-1 uppercase text-xs border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#2874f0]"
            />
            <button
              type="submit"
              disabled={couponLoading || !couponCode.trim()}
              className="bg-[#2874f0] hover:bg-blue-600 disabled:bg-gray-300 text-white text-xs font-bold px-4 py-2 rounded transition"
            >
              {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
            </button>
          </form>
        )}

        {couponError && <p className="text-xs text-red-600 font-medium mt-2">{couponError}</p>}
      </div>

      {/* Bill Details */}
      <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-100">
          Price Details
        </h3>

        <div className="flex flex-col gap-2.5 py-3 text-sm text-gray-600 border-b border-gray-100">
          <div className="flex justify-between">
            <span>Price ({cart?.items?.length || 0} items)</span>
            <span className="text-gray-900 font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-green-600 font-medium">
              <span>Discount</span>
              <span>− ₹{discount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Estimated GST (18%)</span>
            <span className="text-gray-900 font-medium">₹{tax.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between">
            <span>Delivery Charges</span>
            <span>
              {shipping === 0 ? (
                <span className="text-green-600 font-semibold uppercase text-xs">Free</span>
              ) : (
                <span className="text-gray-900 font-medium">₹{shipping}</span>
              )}
            </span>
          </div>
        </div>

        {/* Total Amount */}
        <div className="flex justify-between items-baseline py-3 border-b border-gray-100">
          <span className="text-base font-bold text-gray-900">Total Amount</span>
          <span className="text-xl font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
        </div>

        {discount > 0 && (
          <p className="text-xs font-bold text-green-600 pt-2">
            You will save ₹{discount.toLocaleString('en-IN')} on this order
          </p>
        )}

        {/* Checkout Button */}
        <button
          onClick={onProceedToCheckout}
          disabled={!cart?.items || cart.items.length === 0}
          className="mt-4 w-full bg-[#fb641b] hover:bg-[#e85b17] disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow transition"
        >
          <span>Place Order</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Trust Seal */}
      <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
        <ShieldCheck size={18} className="text-gray-400" />
        <span>Safe and Secure Payments. 100% Authentic products.</span>
      </div>
    </div>
  );
};

export default PriceSummary;