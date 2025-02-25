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

// Get habit type analysis
router.get('/analysis/types', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get all habits for user
    const habits = await Habit.find({ userId: req.user.userId });
    
    // Separate good and bad habits
    const goodHabits = habits.filter(h => h.type === 'good');
    const badHabits = habits.filter(h => h.type === 'bad');
    
    // Get tracking data for the period
    const trackingData = await HabitTracking.find({
      userId: req.user.userId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('habitId');

    // Calculate percentages for good habits
    const goodHabitsAnalysis = goodHabits.reduce((acc, habit) => {
      const habitTrackings = trackingData.filter(t => 
        t.habitId._id.toString() === habit._id.toString() && t.completed
      );
      acc[habit.name] = (habitTrackings.length / trackingData.length) * 100;
      return acc;
    }, {});

    // Calculate percentages for bad habits
    const badHabitsAnalysis = badHabits.reduce((acc, habit) => {
      const habitTrackings = trackingData.filter(t => 
        t.habitId._id.toString() === habit._id.toString() && t.completed
      );
      acc[habit.name] = (habitTrackings.length / trackingData.length) * 100;
      return acc;
    }, {});

    res.json({
      goodHabits: goodHabitsAnalysis,
      badHabits: badHabitsAnalysis
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get daily completion analysis
router.get('/analysis/daily', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = new Date(date);
    
    const trackingData = await HabitTracking.find({
      userId: req.user.userId,
      date: {
        $gte: new Date(targetDate.setHours(0,0,0,0)),
        $lte: new Date(targetDate.setHours(23,59,59,999))
      }
    });

    const totalHabits = trackingData.length;
    const completedHabits = trackingData.filter(t => t.completed).length;

    res.json({
      date: date,
      completionRate: {
        finished: (completedHabits / totalHabits) * 100 || 0,
        unfinished: ((totalHabits - completedHabits) / totalHabits) * 100 || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get weekly progress
router.get('/analysis/weekly', auth, async (req, res) => {
  try {
    const { startDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const dailyData = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dayData = await HabitTracking.find({
        userId: req.user.userId,
        date: {
          $gte: new Date(d.setHours(0,0,0,0)),
          $lte: new Date(d.setHours(23,59,59,999))
        }
      });

      const total = dayData.length;
      const completed = dayData.filter(t => t.completed).length;
      
      dailyData.push({
        date: new Date(d),
        completionRate: total ? (completed / total) * 100 : 0
      });
    }

    res.json({
      weeklyData: dailyData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;