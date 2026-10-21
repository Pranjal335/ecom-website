import React, { useState, useEffect } from 'react';
import { PlusCircle, PackageCheck, Truck, Layers, Loader2, CheckCircle2 } from 'lucide-react';
import { getCategories } from '../api/productApi';
import { createSellerProduct, updateOrderStatusApi } from '../api/adminApi';
import { getMyOrders } from '../api/orderApi';

const SellerDashboard = () => {
  const [activeTab, setActiveTab] = useState('add-product');
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Add Product Form State
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    discountPrice: '',
    category: '',
    brand: '',
    stock: '',
    imageUrl: '',
  });

  useEffect(() => {
    loadCategories();
    loadOrders();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      const catList = res?.data || res || [];
      setCategories(Array.isArray(catList) ? catList : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await getMyOrders();
      const orderList = res?.data || res || [];
      setOrders(Array.isArray(orderList) ? orderList : []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const payload = {
        title: productForm.title,
        description: productForm.description,
        price: Number(productForm.price),
        discountPrice: productForm.discountPrice ? Number(productForm.discountPrice) : 0,
        category: productForm.category,
        brand: productForm.brand,
        stock: Number(productForm.stock),
        images: productForm.imageUrl
          ? [{ url: productForm.imageUrl, isPrimary: true }]
          : [],
      };

      await createSellerProduct(payload);

      setStatusMessage({ type: 'success', text: 'Product created and catalog cache invalidated!' });
      setProductForm({
        title: '',
        description: '',
        price: '',
        discountPrice: '',
        category: '',
        brand: '',
        stock: '',
        imageUrl: '',
      });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to create product' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatusApi(orderId, newStatus);
      await loadOrders();
    } catch (err) {
      alert(err?.message || 'Failed to update order status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Central</h1>
          <p className="text-xs text-gray-500">Manage catalog inventory and fulfillment workflows.</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 bg-gray-200 p-1 rounded">
          <button
            onClick={() => setActiveTab('add-product')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded transition ${
              activeTab === 'add-product'
                ? 'bg-white text-[#2874f0] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PlusCircle size={15} />
            <span>List Product</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded transition ${
              activeTab === 'orders'
                ? 'bg-white text-[#2874f0] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Truck size={15} />
            <span>Fulfillment Hub</span>
          </button>
        </div>
      </div>

      {/* Tab 1: List Product Form */}
      {activeTab === 'add-product' && (
        <div className="max-w-3xl bg-white rounded border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Layers size={18} className="text-[#2874f0]" />
            <span>Add New Catalog Item</span>
          </h2>

          {statusMessage.text && (
            <div
              className={`p-3 rounded text-xs font-semibold mb-4 flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={productForm.title}
                onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                className="w-full text-sm border border-gray-300 rounded p-2.5 focus:outline-none focus:border-[#2874f0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Brand *</label>
              <input
                type="text"
                required
                value={productForm.brand}
                onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                placeholder="e.g. Sony, Apple, Samsung"
                className="w-full text-sm border border-gray-300 rounded p-2.5 focus:outline-none focus:border-[#2874f0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Category *
              </label>
              <select
                required
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded p-2.5 focus:outline-none focus:border-[#2874f0] bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Regular Price (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                placeholder="29999"
                className="w-full text-sm border border-gray-300 rounded p-2.5 focus:outline-none focus:border-[#2874f0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Discounted Price (₹)
              </label>
              <input
                type="number"
                min="0"
                value={productForm.discountPrice}
                onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })}
                placeholder="24999 (Optional)"
                className="w-full text-sm border border-gray-300 rounded p-2.5 focus:outline-none focus:border-[#2874f0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Initial Stock *
              </label>
              <input
                type="number"
                required
                min="0"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                placeholder="50"
                className="w-full text-sm border border-gray-300 rounded p-2.5 focus:outline-none focus:border-[#2874f0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Primary Image URL
              </label>
              <input
                type="url"
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-sm border border-gray-300 rounded p-2.5 focus:outline-none focus:border-[#2874f0]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Description *
              </label>
              <textarea
                required
                rows={4}
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Highlight key specs, warranty, features..."
                className="w-full text-sm border border-gray-300 rounded p-2.5 focus:outline-none focus:border-[#2874f0]"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#2874f0] hover:bg-blue-600 disabled:bg-gray-300 text-white text-xs font-bold uppercase tracking-wider py-3 px-6 rounded shadow transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Publish to Catalog'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Orders & Fulfillment Hub */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900">Incoming Orders & Shipments</h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No orders received yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Current Status</th>
                    <th className="px-4 py-3 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">{ord._id.slice(-6)}</td>
                      <td className="px-4 py-3">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3">{ord.orderItems?.length || 0} items</td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        ₹{ord.totalPrice?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold ${ord.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {ord.isPaid ? 'PAID' : ord.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{ord.orderStatus}</td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={ord.orderStatus}
                          onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                          disabled={ord.orderStatus === 'DELIVERED' || ord.orderStatus === 'CANCELLED'}
                          className="border border-gray-300 rounded px-2 py-1 bg-white text-xs font-semibold focus:outline-none focus:border-[#2874f0]"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;