const { Router } = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
} = require('../controllers/auth.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');

const router = Router();

// Public routes
router.post('/register',authLimiter, registerUser);
router.post('/login',authLimiter, loginUser);
router.post('/refresh-token', refreshAccessToken);

// Protected routes
router.post('/logout', verifyJWT, logoutUser);
router.get('/me', verifyJWT, getCurrentUser);

module.exports = router;