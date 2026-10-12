
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Category = require('../models/category.model');

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parentCategory } = req.body;

  if (!name) {
    throw new ApiError(400, 'Category name is required');
  }

  const slug = name.toLowerCase().trim().replace(/\s+/g, '-');

  const category = await Category.create({
    name,
    slug,
    description,
    parentCategory: parentCategory || null,
  });

  return res.status(201).json(new ApiResponse(201, category, 'Category created successfully'));
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).populate('parentCategory', 'name slug');
  return res.status(200).json(new ApiResponse(200, categories, 'Categories fetched successfully'));
});

module.exports = {
  createCategory,
  getCategories,
};