const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const FAQ = require('../models/FAQ');

// Get all FAQs (public)
router.get('/', async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create FAQ (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const faq = new FAQ({
      question: req.body.question,
      answer: req.body.answer
    });

    await faq.save();
    res.status(201).json(faq);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update FAQ (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      {
        question: req.body.question,
        answer: req.body.answer
      },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    res.json(faq);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete FAQ (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);

    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;