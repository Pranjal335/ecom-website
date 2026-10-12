const { Router } = require('express');
const {
  createProduct,
  getAllProducts,
  getProductByIdOrSlug,
} = require('../controllers/product.controller');
const { verifyJWT, authorizeRoles } = require('../middlewares/auth.middleware');

const router = Router();

router.route('/')
  .get(getAllProducts)
  .post(verifyJWT, authorizeRoles('seller', 'admin'), createProduct);

router.route('/:identifier')
  .get(getProductByIdOrSlug);

module.exports = router;