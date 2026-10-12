const { Router } = require('express');
const {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  applyCoupon,
  removeCoupon,
} = require('../controllers/cart.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

const router = Router();

// All cart actions require an authenticated user
router.use(verifyJWT);

router.route('/')
  .get(getCart)
  .post(addToCart)
  .put(updateCartItemQuantity);

router.route('/item/:productId')
  .delete(removeCartItem);

router.route('/coupon')
  .post(applyCoupon)
  .delete(removeCoupon);

module.exports = router;