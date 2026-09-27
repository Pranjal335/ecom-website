const mongoose = require('express');
const { Schema } = mongoose;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const addressSchema = new Schema(
    {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
      isDefault: { type: Boolean, default: false },
    },
    { _id: true }
  );

  const userSchema = new Schema(
    {
      name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        index: true,
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
      },
      password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Excludes password by default on queries
      },
      role: {
        type: String,
        enum: ['customer', 'seller', 'admin'],
        default: 'customer',
      },
      addresses: [addressSchema],
      refreshToken: {
        type: String,
        select: false,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    { timestamps: true }
  );

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });

// Compare password helper
userSchema.methods.isPasswordCorrect = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

// Generate Short-lived Access Token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
      {
        _id: this._id,
        email: this.email,
        role: this.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
  };

// Generate Long-lived Refresh Token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
      {
        _id: this._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
  };

module.exports = mongoose.model('User', userSchema);