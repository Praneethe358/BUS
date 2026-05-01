const mongoose = require('mongoose');

const stopArrivalsSchema = new mongoose.Schema(
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
    stopId: {
      type: String, // Stop identifier from route
      required: true,
    },
    stopName: {
      type: String,
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
    arrivedAt: {
      type: Date,
      default: null,
    },
    departedAt: {
      type: Date,
      default: null,
    },
    passengersBoarded: {
      type: Number,
      default: 0,
    },
    passengersAlighted: {
      type: Number,
      default: 0,
    },
    dwellTime: {
      type: Number, // Time spent at stop in seconds
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'arrived', 'departed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance optimization
stopArrivalsSchema.index({ busId: 1, arrivedAt: 1 }); // Stop sequence for a bus
stopArrivalsSchema.index({ driverId: 1, arrivedAt: 1 }); // Driver's stop history
stopArrivalsSchema.index({ status: 1 }); // Find pending stops
stopArrivalsSchema.index({ arrivedAt: 1 }); // Query by arrival time
stopArrivalsSchema.index({ busId: 1, stopId: 1 }); // Unique stop per bus

module.exports = mongoose.model('StopArrivals', stopArrivalsSchema);
