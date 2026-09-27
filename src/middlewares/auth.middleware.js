const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/user.model');

//verifies access token
const verifyJWT = asyncHandler(async (req,res,next) => {
    const token = 
             req.cookies?.accessToken || 
             req.header('Authorization')?.replace('Bearer ', '');

    if (!token){
        throw new ApiError(401, 'Unauthorized request : Missing token');
    }         

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id).select('-refreshToken');
    
        if (!user || !user.isActive) {
          throw new ApiError(401, 'Invalid access token or account deactivated');
        }
    
        req.user = user;
        next();
      } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid or expired access token');
      }
});

// Restricts access by role (e.g. authorizeRoles('seller', 'admin'))
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        throw new ApiError(
          403,
          `Role: ${req.user.role} is not permitted to access this resource`
        );
      }
      next();
    };
  };

module.exports = { verifyJWT, authorizeRoles };