// catches errors thrown anywhere in the application including mongoose cast/validation errors and dublicate key errors

const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
    let error = err;

    // check if its an instance of apierror , else normalize it
    if(!(error instanceof ApiError)){
        const statusCode = error.statusCode  || (error.name === 'ValidationError' ? 400:500);
        const message = error.message || 'Internal Server Error';
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    //handle Mongoose duplicate Key error (code 11000)
    if(err.code === 11000){
        const feild = Object.keys(err.keyValue)[0];
        error = new ApiError(409,`${feil.toUpperCase()} already exists`)
    }

    const response = {
        success : false,
        message : error.message,
        errors : error.errors,
        ...(process.env.NODE_ENV === 'developmet' ? {stack: error.stack} : {})
    };
    return res.status(error.statusCode || 500).json(response);
};

module.exports = errorHandler;
