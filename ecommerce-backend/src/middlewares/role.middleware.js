const ApiError = require('../utils/ApiError');

/**
 * Middleware factory to authorize users by role(s)
 * Usage: verifyRoles('admin'), verifyRoles('seller', 'admin')
 */
const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // verifyJWT must run before verifyRoles, attaching req.user
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized request: Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};

module.exports = { verifyRoles };