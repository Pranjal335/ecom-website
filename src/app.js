const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/error.middleware');
const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');

const app = express();

//Security Header
app.use(helmet());

// Cross-origin setup

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    })
);

//Logging

if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

//request parsers
app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({ extended: true, limit :'16kb'}));
app.use(cookieParser());

//routes declaration
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);

//Health check endpoint

app.get('/health', (req,res) => {
    res.status(200).json({status:'ok', timestamp: new Date().isISOString()});
});

app.use(errorHandler);
module.exports = app;
