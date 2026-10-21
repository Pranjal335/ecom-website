const { Router } = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
} = require('../controllers/order.controller');
const { verifyJWT, authorizeRoles } = require('../middlewares/auth.middleware');

const router = Router();

router.use(verifyJWT);

router.route('/')
  .post(createOrder)
  .get(getMyOrders);

router.route('/:id')
  .get(getOrderById);

router.route('/:id/cancel')
  .put(cancelOrder);

router.route('/:id/status')
  .patch(authorizeRoles('seller', 'admin'), updateOrderStatus);

module.exports = router;