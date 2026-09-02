const { ApiError } = require('./errorHandler');

const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body && req.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.params && req.params) {
      req.params = schema.params.parse(req.params);
    }
    if (schema.query && req.query) {
      req.query = schema.query.parse(req.query);
    }
    next();
  } catch (error) {
    if (error.errors && Array.isArray(error.errors)) {
      const issues = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return next(ApiError.badRequest(`Validation failed: ${issues}`));
    }
    return next(ApiError.badRequest(error.message || 'Validation error'));
  }
};

module.exports = { validate };
