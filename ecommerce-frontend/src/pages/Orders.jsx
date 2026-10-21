import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getMyOrders, cancelOrder } from '../api/orderApi';
import { Package, CheckCircle, Clock, XCircle, Truck, Loader2 } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const isJustPlaced = searchParams.get('success') === 'true';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getMyOrders();
      const list = res?.data || res || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await cancelOrder(orderId);
      await fetchOrders();
    } catch (err) {
      alert(err?.message || 'Failed to cancel order.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
            <CheckCircle size={12} /> Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
            <XCircle size={12} /> Cancelled
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
            <Truck size={12} /> Shipped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded">
            <Clock size={12} /> {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {isJustPlaced && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded flex items-center gap-3">
          <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-green-800">Order Placed Successfully!</h4>
            <p className="text-xs text-green-700">
              Your items have been reserved and will be dispatched to your shipping address shortly.
            </p>
          </div>
        </div>
      )}

      <h1 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Package size={22} className="text-[#2874f0]" />
        <span>My Orders</span>
      </h1>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-gray-500">
          <Loader2 size={32} className="animate-spin text-[#2874f0]" />
          <span className="text-xs font-semibold">Loading orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded border border-gray-200 p-12 text-center shadow-sm">
          <p className="text-gray-500 font-medium text-sm mb-4">You have not placed any orders yet.</p>
          <Link
            to="/"
            className="inline-block bg-[#2874f0] text-white text-xs font-bold px-6 py-2.5 rounded shadow"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded border border-gray-200 shadow-sm p-5">
              <div className="flex flex-wrap justify-between items-center pb-4 border-b border-gray-100 gap-2">
                <div>
                  <span className="text-xs text-gray-400 font-semibold block uppercase">Order ID</span>
                  <span className="text-xs font-mono font-bold text-gray-800">{order._id}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-semibold block uppercase">Date Placed</span>
                  <span className="text-xs text-gray-700 font-medium">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-semibold block uppercase">Total</span>
                  <span className="text-sm font-bold text-gray-900">
                    ₹{order.totalPrice?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>{getStatusBadge(order.orderStatus)}</div>
              </div>

              {/* Order Items List */}
              <div className="divide-y divide-gray-50 py-3">
                {order.orderItems?.map((item) => (
                  <div key={item._id} className="py-2.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded flex items-center justify-center p-1 flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <Package size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-800 line-clamp-1">{item.title}</span>
                        <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Payment: <strong className="text-gray-700">{order.paymentMethod}</strong> (
                  {order.isPaid ? 'Paid' : 'Pending'})
                </span>

                {['PENDING', 'CONFIRMED'].includes(order.orderStatus) && (
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;