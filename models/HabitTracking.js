const mongoose = require('mongoose');

const habitTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  amount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound index to ensure unique tracking per habit per day
habitTrackingSchema.index({ habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HabitTracking', habitTrackingSchema);