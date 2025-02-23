const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const Habit = require('../models/Habit');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const dayMapping = {
  'Su': 0,
  'Mo': 1,
  'Tu': 2,
  'We': 3,
  'Th': 4,
  'Fr': 5,
  'Sa': 6
};

const sendReminderEmail = async (habit, user) => {
  const actionWord = habit.type === 'good' ? 'practice' : 'avoid';
  const message = `Hello ${user.username},

Time to ${actionWord} your habit: ${habit.name}
Target: ${habit.goal} ${habit.measureType === 'time' ? 'minutes' : 'times'}

Stay strong and consistent!
- The Habit Flow Team`;

  try {
    await transporter.sendMail({
      from: `"Habit Flow" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Reminder: ${habit.name}`,
      text: message
    });
  } catch (error) {
    console.error('Failed to send reminder email:', error);
  }
};

const scheduleHabitReminder = async (habit) => {
  const user = await User.findById(habit.userId);
  if (!habit.reminderTime || !habit.reminderTime.time || !user) {
    console.log('Reminder not scheduled:', {
      hasReminderTime: !!habit.reminderTime,
      hasTime: habit.reminderTime?.time,
      hasUser: !!user
    });
    return;
  }

  const [hours, minutes] = habit.reminderTime.time.split(':');
  let reminderMinutes = parseInt(minutes) - (habit.reminderTime.minutesBefore || 0);
  let reminderHours = parseInt(hours);

  // Handle minute underflow
  if (reminderMinutes < 0) {
    reminderHours -= 1;
    reminderMinutes = 60 + reminderMinutes; // Changed from += to =
  }
  
  // Handle hour underflow
  if (reminderHours < 0) {
    reminderHours += 24;
  }

  console.log('Scheduling reminder:', {
    originalTime: `${hours}:${minutes}`,
    reminderTime: `${reminderHours}:${reminderMinutes}`,
    days: habit.routine
  });

  // Schedule for each day in routine
  habit.routine.forEach(day => {
    const dayOfWeek = dayMapping[day];
    const jobName = `${habit._id}-${day}`;
    
    // Remove existing schedule if any
    const existingJob = schedule.scheduledJobs[jobName];
    if (existingJob) {
      existingJob.cancel();
    }

    // Create new schedule
    const rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = dayOfWeek;
    rule.hour = reminderHours;
    rule.minute = reminderMinutes;
    rule.tz = 'Asia/Yangon';

    schedule.scheduleJob(jobName, rule, async () => {
      await sendReminderEmail(habit, user);
    });
  });
};

const initializeAllReminders = async () => {
  const habits = await Habit.find({
    'reminderTime.time': { $exists: true }
  });

  for (const habit of habits) {
    await scheduleHabitReminder(habit);
  }
};

module.exports = {
  scheduleHabitReminder,
  initializeAllReminders
};