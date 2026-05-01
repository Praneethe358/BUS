const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    routeName: {
      type: String,
      required: true,
      trim: true,
    },
    stops: {
      type: [stopSchema],
      default: [],
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    capacity: {
      type: Number,
      default: 50,
      min: 1,
    },
    occupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['inactive', 'in-transit', 'at-stop', 'maintenance'],
      default: 'inactive',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastLocationUpdate: {
      lat: Number,
      lng: Number,
      timestamp: Date,
    },
    lastLocationTimestamp: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance optimization
busSchema.index({ driverId: 1 });
busSchema.index({ isActive: 1 });
busSchema.index({ createdBy: 1 });
busSchema.index({ lastLocationTimestamp: 1 });
busSchema.index({ status: 1 });
busSchema.index({ busNumber: 1 });

module.exports = mongoose.model('Bus', busSchema);
