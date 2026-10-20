require('dotenv').config();
const Razorpay = require('razorpay');

const key_id = process.env.RAZORPAY_KEY_ID?.trim() || 'rzp_test_placeholderKey123';
const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim() || 'placeholderSecretKey456';

const razorpayInstance = new Razorpay({
  key_id,
  key_secret,
});

module.exports = razorpayInstance;