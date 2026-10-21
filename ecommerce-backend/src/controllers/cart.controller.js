const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const Coupon = require('../models/coupon.model');
const { recalculateCart } = require('../services/cart.service');

// 1. Get Logged-in User's Cart
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'title slug price discountPrice images stock brand')
    .populate('coupon', 'code discountType discountValue');

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  } else {
    // Re-verify prices and stock against live inventory
    cart = await recalculateCart(cart);
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'title slug price discountPrice images stock brand')
      .populate('coupon', 'code discountType discountValue');
  }

  return res.status(200).json(new ApiResponse(200, cart, 'Cart fetched successfully'));
});


// 2. Add to Cart
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    throw new ApiError(400, 'Product ID is required');
  }

  const requestedQty = parseInt(quantity, 10);
  if (requestedQty <= 0) {
    throw new ApiError(400, 'Quantity must be at least 1');
  }

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.stock < requestedQty) {
    throw new ApiError(400, `Only ${product.stock} items in stock`);
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;

  if (existingItemIndex > -1) {
    const updatedQty = cart.items[existingItemIndex].quantity + requestedQty;
    if (updatedQty > product.stock) {
      throw new ApiError(400, `Cannot add more. Max stock available: ${product.stock}`);
    }
    cart.items[existingItemIndex].quantity = updatedQty;
    cart.items[existingItemIndex].price = effectivePrice;
  } else {
    cart.items.push({
      product: product._id,
      quantity: requestedQty,
      price: effectivePrice,
    });
  }

  cart = await recalculateCart(cart);

  // Repopulate before sending to frontend
  const populatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'title slug price discountPrice images stock brand')
    .populate('coupon', 'code discountType discountValue');

  return res.status(200).json(new ApiResponse(200, populatedCart, 'Item added to cart'));
});

// 3. Update Item Quantity
const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || quantity === undefined) {
    throw new ApiError(400, 'Product ID and quantity are required');
  }

  const parsedQty = parseInt(quantity, 10);
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
  if (itemIndex === -1) {
    throw new ApiError(404, 'Item not found in cart');
  }

  if (parsedQty <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    const product = await Product.findById(productId);
    if (!product || product.stock < parsedQty) {
      throw new ApiError(400, `Requested quantity exceeds available stock (${product?.stock || 0})`);
    }
    cart.items[itemIndex].quantity = parsedQty;
  }

  await recalculateCart(cart);

  // Repopulate before sending to frontend
  const populatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'title slug price discountPrice images stock brand')
    .populate('coupon', 'code discountType discountValue');

  return res.status(200).json(new ApiResponse(200, populatedCart, 'Cart updated successfully'));
});

// 4. Remove Item From Cart
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  await recalculateCart(cart);

  // Repopulate before sending to frontend
  const populatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'title slug price discountPrice images stock brand')
    .populate('coupon', 'code discountType discountValue');

  return res.status(200).json(new ApiResponse(200, populatedCart, 'Item removed from cart'));
});
// 5. Apply Coupon
const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw new ApiError(400, 'Coupon code is required');
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) {
    throw new ApiError(404, 'Invalid coupon code');
  }

  if (new Date() > new Date(coupon.expirationDate)) {
    throw new ApiError(400, 'Coupon has expired');
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Coupon redemption limit reached');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty. Add items before applying coupon');
  }

  if (cart.subtotal < coupon.minOrderAmount) {
    throw new ApiError(
      400,
      `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`
    );
  }

  cart.coupon = coupon._id;
  cart = await recalculateCart(cart);

  return res.status(200).json(new ApiResponse(200, cart, 'Coupon applied successfully'));
});

// 6. Remove Coupon
const removeCoupon = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  cart.coupon = null;
  cart = await recalculateCart(cart);

  return res.status(200).json(new ApiResponse(200, cart, 'Coupon removed successfully'));
});

module.exports = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  applyCoupon,
  removeCoupon,
};