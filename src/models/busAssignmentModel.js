const mongoose = require('mongoose');

const busAssignmentSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    totalPassengers: {
      type: Number,
      default: 0,
    },
    totalDistance: {
      type: Number,
      default: 0, // in kilometers
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance optimization
busAssignmentSchema.index({ driverId: 1, startTime: -1 }); // Driver's trips
busAssignmentSchema.index({ busId: 1, startTime: -1 }); // Bus assignment history
busAssignmentSchema.index({ status: 1 }); // Find active assignments
busAssignmentSchema.index({ startTime: 1 }); // Query by date range

module.exports = mongoose.model('BusAssignment', busAssignmentSchema);
