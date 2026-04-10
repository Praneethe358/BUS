const Bus = require('../models/busModel');
const User = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const { getLatestLocation, setLatestLocation } = require('../sockets/locationStore');

// GET /bus/list
const listBuses = asyncHandler(async (req, res) => {
  const buses = await Bus.find({}).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    buses,
  });
});

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

// GET /bus/location/:busId
const getLatestBusLocation = asyncHandler(async (req, res) => {
  const { busId } = req.params;
  const location = getLatestLocation(busId);

  res.status(200).json({
    success: true,
    location,
  });
});

// POST /bus/location
// body: { busId, lat, lng, speed?, heading?, timestamp? }
const updateLatestBusLocation = asyncHandler(async (req, res, next) => {
  const { busId, lat, lng, speed, heading, timestamp } = req.body;

  if (!busId) {
    return next(new ApiError(400, 'busId is required'));
  }

  const isLatValid = typeof lat === 'number' && lat >= -90 && lat <= 90;
  const isLngValid = typeof lng === 'number' && lng >= -180 && lng <= 180;

  if (!isLatValid || !isLngValid) {
    return next(new ApiError(400, 'Valid lat and lng are required'));
  }

  const now = Date.now();
  const location = {
    busId,
    lat,
    lng,
    speed: typeof speed === 'number' ? speed : undefined,
    heading: typeof heading === 'number' ? heading : undefined,
    timestamp: typeof timestamp === 'number' ? timestamp : now,
  };

  setLatestLocation(busId, location);

  res.status(200).json({
    success: true,
    location,
  });
});

module.exports = {
  listBuses,
  createBus,
  assignStudentToBus,
  getLatestBusLocation,
  updateLatestBusLocation,
};
