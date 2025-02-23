const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check for existing user by either googleId or email
          let user = await User.findOne({
            $or: [
              { googleId: profile.id },
              { email: profile.emails[0].value }
            ]
          });
  
          if (user) {
            // If user exists but doesn't have googleId, update it
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
            return done(null, user);
          }
  
          // If no user exists, create new one
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            username: `user_${profile.id}`, // More unique username
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            password: Math.random().toString(36).slice(-8)
          });
  
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

module.exports = passport;