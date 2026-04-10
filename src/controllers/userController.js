const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/userModel');

// GET /users/me
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json({
    success: true,
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

// GET /users/students
const listStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' })
    .select('_id name regNo email busId')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    students,
  });
});

module.exports = { getMe, listStudents };
