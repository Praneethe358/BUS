const Bus = require('../models/busModel');
const User = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorMiddleware');

// POST /bus/create (admin only)
const createBus = asyncHandler(async (req, res, next) => {
  const { busNumber, routeName, stops } = req.body;

  const existingBus = await Bus.findOne({ busNumber });
  if (existingBus) {
    return next(new ApiError(400, 'Bus number already exists'));
  }

  const bus = await Bus.create({ busNumber, routeName, stops });

  res.status(201).json({
    success: true,
    bus,
  });
});

// POST /bus/assign-student (admin only)
// body: { studentId, busId }
const assignStudentToBus = asyncHandler(async (req, res, next) => {
  const { studentId, busId } = req.body;

  const bus = await Bus.findById(busId);
  if (!bus) {
    return next(new ApiError(404, 'Bus not found'));
  }

  const student = await User.findOne({ _id: studentId, role: 'student' });
  if (!student) {
    return next(new ApiError(404, 'Student not found'));
  }

  student.busId = bus._id;
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Student assigned to bus successfully',
    student: {
      id: student._id,
      name: student.name,
      regNo: student.regNo,
      email: student.email,
      role: student.role,
      busId: student.busId,
    },
  });
});

module.exports = { createBus, assignStudentToBus };
