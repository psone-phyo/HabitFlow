const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const HabitTracking = require('../models/HabitTracking');
const Habit = require('../models/Habit');

// Track habit completion
router.post('/', auth, async (req, res) => {
  try {
    const { habitId, date, completed, amount } = req.body;

    // Verify habit belongs to user
    const habit = await Habit.findOne({
      _id: habitId,
      userId: req.user.userId
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Create or update tracking
    const tracking = await HabitTracking.findOneAndUpdate(
      {
        habitId,
        date: new Date(date),
        userId: req.user.userId
      },
      {
        completed,
        amount,
        userId: req.user.userId
      },
      { upsert: true, new: true }
    );

    res.json(tracking);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tracking data for analysis
router.get('/analysis', auth, async (req, res) => {
  try {
    const { startDate, endDate, habitId } = req.query;
    
    const query = {
      userId: req.user.userId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (habitId) {
      query.habitId = habitId;
    }

    const trackingData = await HabitTracking.find(query)
      .populate('habitId', 'name type')
      .sort({ date: 1 });

    // Calculate completion rates
    const totalCount = trackingData.length;
    const completedCount = trackingData.filter(t => t.completed).length;
    
    const analysis = {
      totalDays: totalCount,
      completedDays: completedCount,
      completionRate: totalCount ? (completedCount / totalCount) * 100 : 0,
      dailyData: trackingData
    };

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tracking for specific habit
router.get('/habit/:habitId', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const trackingData = await HabitTracking.find({
      habitId: req.params.habitId,
      userId: req.user.userId,
      date: {
        $gte: new Date(startDate || new Date().setDate(new Date().getDate() - 30)),
        $lte: new Date(endDate || Date.now())
      }
    }).sort({ date: 1 });

    res.json(trackingData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;