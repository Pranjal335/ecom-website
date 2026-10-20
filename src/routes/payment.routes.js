const { Router } = require('express');
const {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
} = require('../controllers/payment.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

const router = Router();

// Protected routes (Customer making payment)
router.post('/create-order', verifyJWT, createPaymentOrder);
router.post('/verify', verifyJWT, verifyPayment);

// Public webhook route directly called by Gateway
router.post('/webhook', handleWebhook);

module.exports = router;