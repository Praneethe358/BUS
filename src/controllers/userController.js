const asyncHandler = require('../utils/asyncHandler');

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

module.exports = { getMe };
