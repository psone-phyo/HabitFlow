const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Habit = require('../models/Habit');
const { scheduleHabitReminder } = require('../utils/reminderService');

// Get all habits for a user
router.get('/', auth, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.userId });
    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single habit
router.get('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create habit
router.post('/', auth, async (req, res) => {
    try {
      const habit = new Habit({
        userId: req.user.userId,
        name: req.body.name,
        type: req.body.type,
        goal: req.body.goal,
        measureType: req.body.measureType,
        routine: req.body.routine,
        reminderTime: {
          time: req.body.reminderTime,
          minutesBefore: parseInt(req.body.reminderBefore)
        }
      });
  
      console.log('Creating habit:', habit);
  
      await habit.save();
      
      if (habit.reminderTime && habit.reminderTime.time) {
        console.log('Scheduling reminder for new habit');
        await scheduleHabitReminder(habit);
      }
  
      res.status(201).json(habit);
    } catch (error) {
      console.error('Error creating habit:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Update habit
router.put('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Update basic fields
    const updates = {
      name: req.body.name || habit.name,
      type: req.body.type || habit.type,
      goal: req.body.goal || habit.goal,
      measureType: req.body.measureType || habit.measureType,
      routine: req.body.routine || habit.routine
    };

    // Handle reminder updates
    if (req.body.reminderTime || req.body.reminderBefore) {
      updates.reminderTime = {
        time: req.body.reminderTime || habit.reminderTime?.time,
        minutesBefore: req.body.reminderBefore || habit.reminderTime?.minutesBefore
      };
    }

    const updatedHabit = await Habit.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    // Reschedule reminder if reminder settings changed
    if (req.body.reminderTime || req.body.reminderBefore || req.body.routine) {
      await scheduleHabitReminder(updatedHabit);
    }

    res.json(updatedHabit);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete habit
router.delete('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Cancel any existing reminders
    const schedule = require('node-schedule');
    habit.routine.forEach(day => {
      const jobName = `${habit._id}-${day}`;
      const job = schedule.scheduledJobs[jobName];
      if (job) {
        job.cancel();
      }
    });

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;