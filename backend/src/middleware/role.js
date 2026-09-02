const { ApiError } = require('./errorHandler');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied: Role '${req.user.role}' is not authorized to access this resource. Required role(s): ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};

module.exports = { authorizeRoles };
