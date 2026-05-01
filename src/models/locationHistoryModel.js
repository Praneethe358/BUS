const mongoose = require('mongoose');

const locationHistorySchema = new mongoose.Schema(
  {
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: null, // GPS accuracy in meters
    },
    speed: {
      type: Number,
      default: null, // Speed in m/s
    },
    heading: {
      type: Number,
      default: null, // Direction of travel in degrees
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false, // We use timestamp field instead
  }
);

// Create indexes for performance optimization
locationHistorySchema.index({ busId: 1, timestamp: -1 }); // Query locations for a bus in time order
locationHistorySchema.index({ driverId: 1, timestamp: -1 }); // Query driver's location history
locationHistorySchema.index({ timestamp: 1 }); // TTL index for data retention
locationHistorySchema.index({ busId: 1 }); // Find all locations by bus
locationHistorySchema.index({ driverId: 1 }); // Find all locations by driver

// TTL index: automatically delete documents 30 days after creation
locationHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('LocationHistory', locationHistorySchema);
