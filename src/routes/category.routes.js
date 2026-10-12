const { Router } = require('express');
const { createCategory, getCategories } = require('../controllers/category.controller');
const { verifyJWT, authorizeRoles } = require('../middlewares/auth.middleware');

const router = Router();

router.route('/')
  .get(getCategories)
  .post(verifyJWT, authorizeRoles('admin', 'seller'), createCategory);

module.exports = router;