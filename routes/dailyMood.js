const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const DailyMood = require('../models/DailyMood');

// Create mood
router.post('/', auth, async (req, res) => {
  try {
    const mood = new DailyMood({
      userId: req.user.userId,
      mood: req.body.mood,
      message: req.body.message,
      date: req.body.date || new Date()
    });

    await mood.save();
    res.status(201).json(mood);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's moods with date range
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      userId: req.user.userId
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const moods = await DailyMood.find(query).sort({ date: -1 });
    res.json(moods);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update mood
router.put('/:id', auth, async (req, res) => {
  try {
    const mood = await DailyMood.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId
      },
      {
        mood: req.body.mood,
        message: req.body.message
      },
      { new: true }
    );

    if (!mood) {
      return res.status(404).json({ message: 'Mood not found' });
    }

    res.json(mood);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete mood
router.delete('/:id', auth, async (req, res) => {
  try {
    const mood = await DailyMood.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!mood) {
      return res.status(404).json({ message: 'Mood not found' });
    }

    res.json({ message: 'Mood deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;