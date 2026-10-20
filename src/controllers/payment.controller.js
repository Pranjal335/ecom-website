const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const razorpayInstance = require('../config/razorpay');
const Order = require('../models/order.model');

// 1. Create Gateway Order (Initiate Online Payment)
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    throw new ApiError(400, 'Order ID is required');
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.isPaid) {
    throw new ApiError(400, 'This order is already paid');
  }

  // Razorpay accepts amounts in the smallest currency sub-unit (paise for INR)
  const amountInPaise = Math.round(order.totalPrice * 100);

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `receipt_${order._id}`,
    payment_capture: 1, // Auto-capture payment
  };

  try {
    const razorpayOrder = await razorpayInstance.orders.create(options);

    // Persist payment order identifier for reconciliation
    order.paymentResult = {
      id: razorpayOrder.id,
      status: 'created',
      updateTime: new Date().toISOString(),
    };
    await order.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          orderId: order._id,
        },
        'Payment intent created successfully'
      )
    );
  } catch (error) {
    throw new ApiError(500, error.message || 'Error creating Razorpay order');
  }
});

// 2. Client Payment Verification Endpoint (Fast feedback for UI)
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
    throw new ApiError(400, 'Missing payment verification credentials');
  }

  // Construct expected signature using HMAC SHA256
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature !== razorpaySignature) {
    throw new ApiError(400, 'Invalid payment signature. Transaction tampering detected.');
  }

  // Mark order paid
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.orderStatus = 'CONFIRMED';
  order.paymentResult = {
    id: razorpayPaymentId,
    status: 'captured',
    updateTime: new Date().toISOString(),
  };

  await order.save();

  return res.status(200).json(new ApiResponse(200, order, 'Payment verified successfully'));
});

// 3. Webhook Listener (Source of Truth from Razorpay Servers)
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  if (!signature) {
    throw new ApiError(400, 'Missing webhook signature');
  }

  // Raw body verification
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET);
  hmac.update(JSON.stringify(req.body));
  const expectedSignature = hmac.digest('hex');

  if (signature !== expectedSignature) {
    throw new ApiError(400, 'Invalid webhook signature');
  }

  const { event, payload } = req.body;

  if (event === 'payment.captured') {
    const paymentEntity = payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;

    const order = await Order.findOne({ 'paymentResult.id': razorpayOrderId });
    if (order && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = new Date();
      order.orderStatus = 'CONFIRMED';
      order.paymentResult = {
        id: paymentEntity.id,
        status: paymentEntity.status,
        updateTime: new Date().toISOString(),
        emailAddress: paymentEntity.email,
      };
      await order.save();
    }
  }

  // Acknowledge receipt to gateway immediately with 200 OK
  return res.status(200).json({ status: 'ok' });
});

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
};