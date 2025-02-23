require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const { initializeAllReminders } = require('./utils/reminderService');
const auth  = require('./middleware/auth');
const trackingRoutes = require('./routes/tracking');
const dailyMoodRoutes = require('./routes/dailyMood');
const dailyQuoteRoutes = require('./routes/dailyQuote');
const profileRoutes = require('./routes/profile');
const faqRoutes = require('./routes/faq');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    initializeAllReminders(); // Initialize all reminders after DB connection
  })
  .catch((err) => console.error('MongoDB connection error:', err));
// Routes
app.get('/', (req, res) => {
  res.send('This is Habit Tracker API');
})

app.get('/auth-success', (req, res) => {
    const token = req.query.token;
  // Redirect to frontend with token
  res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
  })

app.use('/api/auth', authRoutes);
app.use('/api/habits',auth, habitRoutes);
app.use('/api/tracking',auth, trackingRoutes);
app.use('/api/moods',auth, dailyMoodRoutes);
app.use('/api/profile',auth, profileRoutes);
app.use('/api/quotes', dailyQuoteRoutes);
app.use('/api/faqs', faqRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});