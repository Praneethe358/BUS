const bcrypt = require('bcryptjs');

const User = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { ApiError } = require('../middleware/errorMiddleware');

// POST /auth/register
const register = asyncHandler(async (req, res, next) => {
  const { name, reg_no, email, password, role, busId } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ApiError(400, 'Email already in use'));
  }

  if (role === 'student' && !reg_no) {
    return next(new ApiError(400, 'reg_no is required for student role'));
  }

  if (reg_no) {
    const existingReg = await User.findOne({ regNo: reg_no });
    if (existingReg) {
      return next(new ApiError(400, 'Registration number already in use'));
    }
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    regNo: reg_no || undefined,
    email,
    password: hashedPassword,
    role: role || 'student',
    busId: busId || undefined,
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      regNo: user.regNo,
      email: user.email,
      role: user.role,
      busId: user.busId,
    },
  });
});

// POST /auth/login
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ApiError(401, 'Invalid credentials'));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new ApiError(401, 'Invalid credentials'));
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      regNo: user.regNo,
      email: user.email,
      role: user.role,
      busId: user.busId,
    },
  });
});

module.exports = { register, login };
