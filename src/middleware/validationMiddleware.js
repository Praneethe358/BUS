const { validationResult } = require('express-validator');
const { ApiError } = require('./errorMiddleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    }));

    return next(new ApiError(400, 'Validation error', formatted));
  }

  return next();
};

module.exports = validate;
