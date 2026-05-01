const mongoose = require('mongoose');

const roles = ['student', 'driver', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    regNo: {
      type: String,
      unique: true,
      sparse: true, // only enforce uniqueness when present
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: roles,
      default: 'student',
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
    },
    // Driver specific fields
    driverId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    totalTrips: {
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    // Student specific fields
    notificationPreferences: {
      type: {
        arrivalAlerts: { type: Boolean, default: true },
        departureAlerts: { type: Boolean, default: true },
        delayNotifications: { type: Boolean, default: true },
      },
      default: {},
    },
    isTracking: {
      type: Boolean,
      default: true,
    },
    assignmentHistory: [
      {
        busId: mongoose.Schema.Types.ObjectId,
        startDate: Date,
        endDate: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance optimization
userSchema.index({ role: 1 });
userSchema.index({ assignedBus: 1 });
userSchema.index({ busId: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ driverId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1, assignedBus: 1 }); // Compound index for driver queries

module.exports = mongoose.model('User', userSchema);
