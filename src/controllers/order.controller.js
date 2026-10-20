const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const Coupon = require('../models/coupon.model');
const { recalculateCart } = require('../services/cart.service');

// 1. Create New Order (Checkout)
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'COD' } = req.body;

  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
    throw new ApiError(400, 'Complete shipping address is required');
  }

  // Fetch the latest cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty');
  }

  // Recalculate to ensure prices and stock validity
  cart = await recalculateCart(cart);

  if (cart.items.length === 0) {
    throw new ApiError(400, 'Items in your cart are no longer available in stock');
  }

  // Start MongoDB Session for ACID compliance
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderItems = [];

    // Atomic stock deduction loop
    for (const item of cart.items) {
      // Find product and atomically decrease stock ONLY IF stock >= item.quantity
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity }, isActive: true },
        { $inc: { stock: -item.quantity } },
        { session, new: true }
      );

      if (!updatedProduct) {
        throw new ApiError(
          409,
          `Stock changed or item became unavailable during checkout. Please review your cart.`
        );
      }

      orderItems.push({
        product: updatedProduct._id,
        title: updatedProduct.title,
        image: updatedProduct.images?.[0]?.url || '',
        price: item.price,
        quantity: item.quantity,
        seller: updatedProduct.seller,
      });
    }

    // Shipping & Tax calculations
    const itemsPrice = cart.subtotal;
    const discountPrice = cart.discount;
    const shippingPrice = itemsPrice > 500 ? 0 : 50; // Free shipping over ₹500
    const taxPrice = Math.round(itemsPrice * 0.18 * 100) / 100; // 18% GST snapshot
    const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice - discountPrice) * 100) / 100;

    // Create Order Document inside transaction
    const [createdOrder] = await Order.create(
      [
        {
          user: req.user._id,
          orderItems,
          shippingAddress,
          paymentMethod,
          itemsPrice,
          taxPrice,
          shippingPrice,
          discountPrice,
          totalPrice,
          orderStatus: paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING',
        },
      ],
      { session }
    );

    // If a coupon was used, increment its usage counter
    if (cart.coupon) {
      await Coupon.findByIdAndUpdate(
        cart.coupon,
        { $inc: { usedCount: 1 } },
        { session }
      );
    }

    // Clear cart upon successful order creation
    cart.items = [];
    cart.coupon = null;
    cart.subtotal = 0;
    cart.discount = 0;
    cart.total = 0;
    await cart.save({ session });

    // Commit all operations atomically
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(new ApiResponse(201, createdOrder, 'Order placed successfully'));
  } catch (error) {
    // If any step failed, abort and rollback all changes
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// 2. Get User's Order History
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, orders, 'Orders fetched successfully'));
});

// 3. Get Single Order Details
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product', 'title slug');

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Authorization: Only owner, seller, or admin can inspect the order
  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isAdminOrSeller = req.user.role === 'admin' || req.user.role === 'seller';

  if (!isOwner && !isAdminOrSeller) {
    throw new ApiError(403, 'Not authorized to view this order');
  }

  return res.status(200).json(new ApiResponse(200, order, 'Order retrieved successfully'));
});

// 4. Cancel Order & Restore Inventory
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({ _id: id, user: req.user._id }).session(session);

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED') {
      throw new ApiError(400, `Cannot cancel an order that is already ${order.orderStatus}`);
    }

    order.orderStatus = 'CANCELLED';
    await order.save({ session });

    // Restock the items atomically
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(new ApiResponse(200, order, 'Order cancelled and stock restored'));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};