const Product = require('../models/product.model');
const Coupon = require('../models/coupon.model');
const ApiError = require('../utils/ApiError');

const recalculateCart = async (cart) => {
  let subtotal = 0;
  const validItems = [];

  // 1. Sync line items with live database prices and stock
  for (const item of cart.items) {
    const product = await Product.findById(item.product);

    if (!product || !product.isActive || product.stock === 0) {
      // Skip out-of-stock or deleted products
      continue;
    }

    // Auto-clamp requested quantity if stock is lower than in-cart quantity
    const finalQuantity = Math.min(item.quantity, product.stock);
    const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;

    validItems.push({
      product: product._id,
      quantity: finalQuantity,
      price: effectivePrice,
    });

    subtotal += effectivePrice * finalQuantity;
  }

  cart.items = validItems;
  cart.subtotal = subtotal;

  // 2. Validate Coupon (if attached)
  let discount = 0;

  if (cart.coupon) {
    const coupon = await Coupon.findById(cart.coupon);

    const isExpired = coupon ? new Date() > new Date(coupon.expirationDate) : true;
    const isOverLimit = coupon?.usageLimit ? coupon.usedCount >= coupon.usageLimit : false;
    const meetsMinOrder = coupon ? subtotal >= coupon.minOrderAmount : false;

    if (!coupon || !coupon.isActive || isExpired || isOverLimit || !meetsMinOrder) {
      // Coupon no longer valid; detach it
      cart.coupon = null;
      discount = 0;
    } else {
      if (coupon.discountType === 'PERCENTAGE') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
          discount = coupon.maxDiscountAmount;
        }
      } else if (coupon.discountType === 'FLAT') {
        discount = Math.min(coupon.discountValue, subtotal);
      }
    }
  }

  cart.discount = Math.round(discount * 100) / 100;
  cart.total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  await cart.save();
  return cart;
};

module.exports = { recalculateCart };