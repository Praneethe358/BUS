const express = require('express');
const { body } = require('express-validator');

const { register, login } = require('../controllers/authController');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['student', 'driver', 'admin']).withMessage('Invalid role'),
    body('reg_no').optional().isString().withMessage('reg_no must be a string'),
    body('busId').optional().isMongoId().withMessage('busId must be a valid ID'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

module.exports = router;
