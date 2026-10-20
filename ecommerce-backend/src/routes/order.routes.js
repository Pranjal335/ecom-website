const { Router } = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require('../controllers/order.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { orderLimiter } = require('../middlewares/rateLimiter.middleware');



const router = Router();

router.use(verifyJWT);

// Apply order limiter to order placement
router.route('/')
  .post(orderLimiter, createOrder)
  .get(getMyOrders);

router.route('/:id')
  .get(getOrderById);

router.route('/:id/cancel')
  .put(cancelOrder);

module.exports = router;