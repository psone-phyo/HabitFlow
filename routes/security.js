const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Update password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update recovery settings
router.put('/recovery', auth, async (req, res) => {
  try {
    const { recoveryEmail, alternateEmail, recoveryPhone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        recoveryEmail,
        alternateEmail,
        recoveryPhone
      },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email
router.post('/verify-email', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    await transporter.sendMail({
      from: `"Habit Flow" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Email Verification',
      text: `Your verification code is: ${verificationCode}`
    });

    user.emailVerificationCode = verificationCode;
    await user.save();

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm email verification
router.post('/confirm-verification', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.userId);

    if (user.emailVerificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate account
router.post('/deactivate', auth, async (req, res) => {
    try {
      // Cancel all habit reminders
      const schedule = require('node-schedule');
      const habits = await Habit.find({ userId: req.user.userId });
      habits.forEach(habit => {
        habit.routine.forEach(day => {
          const jobName = `${habit._id}-${day}`;
          const job = schedule.scheduledJobs[jobName];
          if (job) {
            job.cancel();
          }
        });
      });
  
      // Update user status
      await User.findByIdAndUpdate(req.user.userId, {
        isActive: false
      });
  
      // Send notification email
      const user = await User.findById(req.user.userId);
      await transporter.sendMail({
        from: `"Habit Flow" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Account Deactivation Confirmation',
        text: `Hello,
  
  Your account has been deactivated. All habit reminders have been stopped.
  
  You can reactivate your account at any time by logging in.
  
  Best regards,
  Habit Flow Team`
      });
  
      res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
      console.error('Deactivation error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Reactivate account
  router.post('/reactivate', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ 
        email,
        isActive: false
      });
  
      if (!user) {
        return res.status(404).json({ message: 'Account not found' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      user.isActive = true;
      await user.save();
  
      // Reinitialize reminders for active habits
      const { initializeAllReminders } = require('../utils/reminderService');
      await initializeAllReminders();
  
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
      res.json({ 
        message: 'Account reactivated successfully',
        token 
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });


module.exports = router;