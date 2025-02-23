const mongoose = require('mongoose');

const dailyQuoteSchema = new mongoose.Schema({
  quote: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('DailyQuote', dailyQuoteSchema);