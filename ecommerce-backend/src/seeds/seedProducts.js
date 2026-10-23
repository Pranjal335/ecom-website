require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');

const categoriesData = [
  { name: 'Smartphones', slug: 'smartphones', description: 'Latest 5G smartphones and mobile devices' },
  { name: 'Audio', slug: 'audio', description: 'Headphones, earbuds, and premium sound systems' },
  { name: 'Laptops', slug: 'laptops', description: 'Ultrabooks, gaming rigs, and productivity notebooks' },
  { name: 'Wearables', slug: 'wearables', description: 'Smartwatches, fitness bands, and trackers' },
  { name: 'Accessories', slug: 'accessories', description: 'Chargers, cables, stands, and peripherals' },
];

const seedCatalog = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce?replicaSet=rs0';
    console.log('Connecting to database:', mongoUri);
    await mongoose.connect(mongoUri);

    // 1. Get an existing seller or admin user to assign as the product creator
    let seller = await User.findOne({ role: { $in: ['seller', 'admin'] } });
    if (!seller) {
      seller = await User.findOne({});
    }

    if (!seller) {
      console.error('No users found in database. Please register at least one user first.');
      process.exit(1);
    }

    console.log(`Using seller user: ${seller.email} (${seller._id})`);

    // 2. Upsert categories
    console.log('Syncing categories...');
    const categoryMap = {};
    for (const cat of categoriesData) {
      const existing = await Category.findOneAndUpdate(
        { slug: cat.slug },
        { $set: cat },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      categoryMap[cat.slug] = existing._id;
    }

    // 3. Define sample products
    const productsData = [
      {
        title: 'Apple iPhone 15 Pro (128 GB) - Natural Titanium',
        slug: 'apple-iphone-15-pro-128gb-natural-titanium',
        description: 'iPhone 15 Pro features a strong and light aerospace-grade titanium design with a textured matte-glass back. Powered by the groundbreaking A17 Pro chip.',
        price: 134900,
        discountPrice: 127999,
        category: categoryMap['smartphones'],
        brand: 'Apple',
        stock: 35,
        ratingsAverage: 4.7,
        ratingsQuantity: 418,
        seller: seller._id,
        isActive: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
            altText: 'iPhone 15 Pro Natural Titanium',
            isPrimary: true,
          },
        ],
      },
      {
        title: 'Samsung Galaxy S24 Ultra 5G (Titanium Gray, 256 GB)',
        slug: 'samsung-galaxy-s24-ultra-titanium-gray-256gb',
        description: 'Meet Galaxy S24 Ultra, the ultimate form of Galaxy Ultra with a new titanium exterior and a 17.25cm flat display with embedded S Pen and Galaxy AI.',
        price: 129999,
        discountPrice: 119999,
        category: categoryMap['smartphones'],
        brand: 'Samsung',
        stock: 28,
        ratingsAverage: 4.6,
        ratingsQuantity: 312,
        seller: seller._id,
        isActive: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
            altText: 'Samsung Galaxy S24 Ultra',
            isPrimary: true,
          },
        ],
      },
      {
        title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        slug: 'sony-wh-1000xm5-wireless-noise-cancelling-headphones',
        description: 'Industry-leading noise cancellation with two processors and eight microphones. Up to 30-hour battery life with quick charging.',
        price: 34990,
        discountPrice: 28990,
        category: categoryMap['audio'],
        brand: 'Sony',
        stock: 45,
        ratingsAverage: 4.5,
        ratingsQuantity: 890,
        seller: seller._id,
        isActive: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
            altText: 'Sony WH-1000XM5 Headphones',
            isPrimary: true,
          },
        ],
      },
      {
        title: 'Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)',
        slug: 'apple-airpods-pro-2nd-gen-usb-c',
        description: 'Up to 2x more active noise cancellation than previous generation. Transparency mode and personalized spatial audio with dynamic head tracking.',
        price: 24900,
        discountPrice: 20999,
        category: categoryMap['audio'],
        brand: 'Apple',
        stock: 60,
        ratingsAverage: 4.8,
        ratingsQuantity: 1240,
        seller: seller._id,
        isActive: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
            altText: 'AirPods Pro 2nd Gen',
            isPrimary: true,
          },
        ],
      },
      {
        title: 'MacBook Air 15-inch M3 Chip (16 GB Unified Memory, 512 GB SSD)',
        slug: 'apple-macbook-air-15-inch-m3-space-grey',
        description: 'Impossibly thin and fast laptop with Liquid Retina display, 18 hours of battery life, 1080p FaceTime HD camera, and MagSafe 3 charging port.',
        price: 154900,
        discountPrice: 144900,
        category: categoryMap['laptops'],
        brand: 'Apple',
        stock: 18,
        ratingsAverage: 4.9,
        ratingsQuantity: 215,
        seller: seller._id,
        isActive: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
            altText: 'MacBook Air 15-inch M3',
            isPrimary: true,
          },
        ],
      },
      {
        title: 'ASUS ROG Zephyrus G16 (2024) Gaming Laptop (OLED, RTX 4070)',
        slug: 'asus-rog-zephyrus-g16-2024-gaming-laptop',
        description: 'Precision aluminum chassis with 2.5K 240Hz OLED ROG Nebula display, Intel Core Ultra 9 processor, and NVIDIA GeForce RTX 4070 GPU.',
        price: 189990,
        discountPrice: 174990,
        category: categoryMap['laptops'],
        brand: 'ASUS',
        stock: 12,
        ratingsAverage: 4.6,
        ratingsQuantity: 94,
        seller: seller._id,
        isActive: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80',
            altText: 'ASUS ROG Zephyrus G16',
            isPrimary: true,
          },
        ],
      },
      {
        title: 'Apple Watch Series 9 GPS 45mm Midnight Aluminum Case',
        slug: 'apple-watch-series-9-gps-45mm-midnight',
        description: 'S9 SiP enables a super-bright display and a magical hands-free double tap gesture to interact with your watch without touching the screen.',
        price: 44900,
        discountPrice: 38999,
        category: categoryMap['wearables'],
        brand: 'Apple',
        stock: 30,
        ratingsAverage: 4.7,
        ratingsQuantity: 520,
        seller: seller._id,
        isActive: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80',
            altText: 'Apple Watch Series 9',
            isPrimary: true,
          },
        ],
      },
      {
        title: 'Anker 737 Power Bank (PowerCore 24K, 140W Output)',
        slug: 'anker-737-power-bank-140w-24000mah',
        description: 'Ultra-powerful two-way fast charging with the latest Power Delivery 3.1 and bi-directional technology to quickly recharge the bank or power high-draw devices.',
        price: 13999,
        discountPrice: 10999,
        category: categoryMap['accessories'],
        brand: 'Anker',
        stock: 55,
        ratingsAverage: 4.8,
        ratingsQuantity: 640,
        seller: seller._id,
        isActive: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80',
            altText: 'Anker 737 Fast Power Bank',
            isPrimary: true,
          },
        ],
      },
    ];

    console.log('Inserting products...');
    for (const prod of productsData) {
      await Product.findOneAndUpdate(
        { slug: prod.slug },
        { $set: prod },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`Successfully seeded ${productsData.length} products across 5 categories!`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed with error:', err);
    process.exit(1);
  }
};

seedCatalog();