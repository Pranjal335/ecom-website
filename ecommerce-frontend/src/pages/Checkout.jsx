import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, CreditCard, Banknote, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { createOrder, createRazorpayOrder, verifyPaymentSignature } from '../api/orderApi';

const Checkout = () => {
  const { cart, fetchCart, clearCartState } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1); // 1: Address, 2: Payment
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Shipping Form State
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
  });

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const discount = cart?.discount || 0;
  const shipping = subtotal > 500 || subtotal === 0 ? 0 : 50;
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = Math.max(0, Math.round((subtotal + shipping + tax - discount) * 100) / 100);

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!address.street || !address.city || !address.state || !address.postalCode || !address.phone) {
      setErrorMessage('Please fill in all address fields.');
      return;
    }
    setErrorMessage('');
    setActiveStep(2);
  };

  // Dynamically load Razorpay SDK script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Create order in MongoDB (atomically deducts stock & empties persistent cart)
      const orderPayload = {
        shippingAddress: address,
        paymentMethod,
      };

      const orderRes = await createOrder(orderPayload);
      const createdOrder = orderRes?.data || orderRes;

      // 2A. Cash on Delivery Flow
      if (paymentMethod === 'COD') {
        clearCartState();
        navigate(`/orders?success=true&orderId=${createdOrder._id}`);
        return;
      }

      // 2B. Online Payment via Razorpay
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const paymentOrderRes = await createRazorpayOrder(createdOrder._id);
      const paymentOrderData = paymentOrderRes?.data || paymentOrderRes;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholderKey123',
        amount: paymentOrderData.amount,
        currency: paymentOrderData.currency,
        name: 'E-Shop Platform',
        description: `Order #${createdOrder._id}`,
        order_id: paymentOrderData.razorpayOrderId,
        handler: async (response) => {
          try {
            await verifyPaymentSignature({
              orderId: createdOrder._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCartState();
            navigate(`/orders?success=true&orderId=${createdOrder._id}`);
          } catch (verifyErr) {
            setErrorMessage(verifyErr?.message || 'Payment signature verification failed.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: address.phone,
        },
        theme: {
          color: '#2874f0',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setErrorMessage(resp.error.description || 'Payment failed. Please retry.');
      });
      rzp.open();
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to place order. Inventory or cart might have changed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded border border-gray-200 mt-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Nothing to Checkout</h2>
        <p className="text-xs text-gray-500 mb-6">Your cart is currently empty.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#2874f0] text-white text-xs font-bold px-6 py-2.5 rounded shadow"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Column: Accordion Checkout Steps */}
        <div className="w-full lg:w-8/12 flex flex-col gap-4">
          
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <div
              className={`p-4 flex items-center justify-between ${
                activeStep === 1 ? 'bg-[#2874f0] text-white' : 'bg-gray-50 text-gray-700 cursor-pointer'
              }`}
              onClick={() => setActiveStep(1)}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white text-[#2874f0] text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span className="font-bold text-sm tracking-wide uppercase">Delivery Address</span>
              </div>
              {activeStep > 1 && <CheckCircle2 size={18} className="text-green-600" />}
            </div>

            {activeStep === 1 && (
              <form onSubmit={handleAddressSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                    Street Address / House No.
                  </label>
                  <input
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="e.g. Flat 402, Sunshine Apartments, Sector 62"
                    className="w-full text-sm border border-gray-300 rounded p-2.5 focus:outline-none focus:border-[#2874f0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="e.g. Noida"
                    className="w-full text-sm border border-gray-300 rounded p-2.5 focus:outline-none focus:border-[#2874f0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    placeholder="e.g. Uttar Pradesh"
                    className="w-full text-sm border border-gray-300 rounded p-2.5 focus:outline-none focus:border-[#2874f0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Postal Code (PIN)</label>
                  <input
                    type="text"
                    required
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    placeholder="e.g. 201301"
                    className="w-full text-sm border border-gray-300 rounded p-2.5 focus:outline-none focus:border-[#2874f0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full text-sm border border-gray-300 rounded p-2.5 focus:outline-none focus:border-[#2874f0]"
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    className="bg-[#fb641b] hover:bg-[#e85b17] text-white text-xs font-bold uppercase px-8 py-3 rounded shadow transition"
                  >
                    Deliver Here
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Step 2: Payment Options */}
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <div
              className={`p-4 flex items-center justify-between ${
                activeStep === 2 ? 'bg-[#2874f0] text-white' : 'bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white text-[#2874f0] text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span className="font-bold text-sm tracking-wide uppercase">Payment Method</span>
              </div>
            </div>

            {activeStep === 2 && (
              <div className="p-6 flex flex-col gap-4">
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* COD Option */}
                <label
                  className={`flex items-start gap-3 p-4 border rounded cursor-pointer transition ${
                    paymentMethod === 'COD' ? 'border-[#2874f0] bg-blue-50/40' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 text-[#2874f0] focus:ring-[#2874f0]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                      <Banknote size={18} className="text-green-600" />
                      <span>Cash on Delivery (COD)</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Pay in cash or UPI upon delivery.</p>
                  </div>
                </label>

                {/* Online Gateway Option */}
                <label
                  className={`flex items-start gap-3 p-4 border rounded cursor-pointer transition ${
                    paymentMethod === 'CARD' ? 'border-[#2874f0] bg-blue-50/40' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    className="mt-1 text-[#2874f0] focus:ring-[#2874f0]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                      <CreditCard size={18} className="text-[#2874f0]" />
                      <span>Online Payment (UPI, Debit/Credit Cards, NetBanking)</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Instant verification powered by Razorpay.</p>
                  </div>
                </label>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                  >
                    ← Change Delivery Address
                  </button>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="bg-[#fb641b] hover:bg-[#e85b17] disabled:bg-gray-300 text-white font-bold py-3 px-8 rounded text-xs uppercase tracking-wide flex items-center gap-2 shadow transition"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Order'}
                    {!isSubmitting && <ArrowRight size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Order Summary Card */}
        <div className="w-full lg:w-4/12 sticky top-20">
          <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-100">
              Order Summary ({items.length} Items)
            </h3>

            {/* Line items mini-preview */}
            <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 py-2">
              {items.map((item) => {
                const product = item.product;
                const title = typeof product === 'object' ? product?.title : 'Product Item';
                return (
                  <div key={item._id || item.product} className="py-2 flex justify-between text-xs text-gray-700">
                    <span className="line-clamp-1 flex-1 pr-2">
                      {item.quantity}x {title}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2.5 py-3 text-sm text-gray-600 border-t border-b border-gray-100">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
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

            <div className="flex justify-between items-baseline py-3">
              <span className="text-base font-bold text-gray-900">Total Payable</span>
              <span className="text-xl font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 justify-center pt-2">
              <ShieldCheck size={16} />
              <span>Safe and 256-Bit Encrypted Payments</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;