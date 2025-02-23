const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['good', 'bad'],
    required: true
  },
  goal: {
    type: Number,
    required: true,
    default: 1
  },
  measureType: {
    type: String,
    enum: ['amount', 'time'],
    required: true
  },
  routine: [{
    type: String,
    enum: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  }],
  reminderTime: {
    time: String,  // Format: "HH:mm"
    minutesBefore: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Habit', habitSchema);