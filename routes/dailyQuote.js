const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const DailyQuote = require('../models/DailyQuote');

// Create quote
router.post('/', auth, async (req, res) => {
  try {
    const quote = new DailyQuote({
      quote: req.body.quote,
      author: req.body.author
    });

    await quote.save();
    res.status(201).json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get random quote
router.get('/random', async (req, res) => {
  try {
    const count = await DailyQuote.countDocuments();
    const random = Math.floor(Math.random() * count);
    const quote = await DailyQuote.findOne().skip(random);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all quotes
router.get('/', auth, async (req, res) => {
  try {
    const quotes = await DailyQuote.find().sort({ createdAt: -1 });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update quote
router.put('/:id', auth, async (req, res) => {
  try {
    const quote = await DailyQuote.findByIdAndUpdate(
      req.params.id,
      {
        quote: req.body.quote,
        author: req.body.author
      },
      { new: true }
    );

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    res.json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete quote
router.delete('/:id', auth, async (req, res) => {
  try {
    const quote = await DailyQuote.findByIdAndDelete(req.params.id);

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;