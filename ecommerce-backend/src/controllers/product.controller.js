const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Product = require('../models/product.model');
const { cacheGet, cacheSet, cacheDelPattern } = require('../config/redis');

const createSlug = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-') + `-${Date.now()}`;

// 1. Create a Product (Seller / Admin only)
const createProduct = asyncHandler(async (req, res) => {
  const { title, description, price, discountPrice, category, brand, stock, images, attributes } =
    req.body;

  if (!title || !description || price === undefined || !category || !brand || stock === undefined) {
    throw new ApiError(400, 'Title, description, price, category, brand, and stock are required');
  }

  const slug = createSlug(title);

  const product = await Product.create({
    title,
    slug,
    description,
    price,
    discountPrice,
    category,
    brand,
    stock,
    images: images || [],
    attributes: attributes || {},
    seller: req.user._id,
  });

  // Invalidate catalog search caches whenever a new product is added
  await cacheDelPattern('products:catalog:*');

  return res.status(201).json(new ApiResponse(201, product, 'Product created successfully'));
});

// 2. Get Products with Advanced Filter, Search, Sort, Pagination & Redis Caching
const getAllProducts = asyncHandler(async (req, res) => {
  const {
    keyword,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  // Build a deterministic cache key from normalized query params
  const normalizedParams = Object.keys(req.query)
    .sort()
    .map((k) => `${k}=${req.query[k]}`)
    .join('&');
  const cacheKey = `products:catalog:${normalizedParams || 'default'}`;

  // 1. Check Redis Cache
  const cachedData = await cacheGet(cacheKey);
  if (cachedData) {
    return res
      .status(200)
      .json(new ApiResponse(200, cachedData, 'Products fetched from cache'));
  }

  // 2. Query MongoDB on Cache Miss
  const query = { isActive: true };

  if (keyword) {
    query.$text = {$search: keyword };
  }

  if (category) query.category = category;
  if (brand) query.brand = brand;

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (minRating) {
    query.ratingsAverage = { $gte: Number(minRating) };
  }

  const pageNumber = Math.max(1, parseInt(page, 10));
  const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNumber - 1) * pageSize;

  const sortDirection = order === 'asc' ? 1 : -1;
  const sortOptions = {};
  sortOptions[sortBy] = sortDirection;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .populate('seller', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Product.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const responsePayload = {
    products,
    pagination: {
      totalProducts: total,
      totalPages,
      currentPage: pageNumber,
      limit: pageSize,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    },
  };

  // 3. Write to Redis with 10-minute TTL (600s)
  await cacheSet(cacheKey, responsePayload, 600);

  return res
    .status(200)
    .json(new ApiResponse(200, responsePayload, 'Products fetched successfully'));
});

// 3. Get Single Product by ID or Slug with Caching
const getProductByIdOrSlug = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  const cacheKey = `product:detail:${identifier}`;

  // Check cache
  const cachedProduct = await cacheGet(cacheKey);
  if (cachedProduct) {
    return res
      .status(200)
      .json(new ApiResponse(200, cachedProduct, 'Product details fetched from cache'));
  }

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
  const query = isObjectId ? { _id: identifier } : { slug: identifier };

  const product = await Product.findOne({ ...query, isActive: true })
    .populate('category', 'name slug')
    .populate('seller', 'name email');

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Cache single product details for 1 hour (3600s)
  await cacheSet(cacheKey, product, 3600);

  return res.status(200).json(new ApiResponse(200, product, 'Product fetched successfully'));
});

module.exports = {
  createProduct,
  getAllProducts,
  getProductByIdOrSlug,
};