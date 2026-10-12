const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be non-negative'],
      index: true,
    },
    discountPrice: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          return val <= this.price;
        },
        message: 'Discount price must be less than or equal to regular price',
      },
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      index: true,
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    images: [
      {
        url: { type: String, required: true },
        altText: { type: String, default: '' },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    attributes: {
      type: Map,
      of: String, // Dynamic key-values like { "color": "Midnight Blue", "storage": "256GB" }
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot exceed 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 1. Full-text search index across title, brand, and description
productSchema.index({ title: 'text', brand: 'text', description: 'text' });

// 2. Compound indexes for Amazon/Flipkart-style filter permutations
productSchema.index({ category: 1, price: 1, ratingsAverage: -1 });
productSchema.index({ brand: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);