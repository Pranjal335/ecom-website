const Razorpay = require('razorpay');

const razorpayInstance = new Razarpay({
    ke_id: process.env.RAZAORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

module.exports = razorpayInstance;