require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MongoStore = require('connect-mongo').default;
const bcrypt = require('bcrypt');

const app = express();
app.set('trust proxy', 1);

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));

// ── Session Setup ─────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// ── MongoDB Connection ────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// ── User Schema ───────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  googleId:    { type: String, sparse: true },
  displayName: { type: String, default: '' },
  email:       { type: String, default: '' },
  username:    { type: String, default: '', unique: true, sparse: true },
  password:    { type: String, default: '' },
  photo:       { type: String, default: '' },
  preferences: { type: [String], default: [] },
  friends:     { type: [String], default: [] },
  createdAt:   { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// ── Event Schema ──────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema({
  ticketmasterId: { type: String, required: true },
  userId:         { type: String, required: true },
  title:          { type: String, required: true },
  image:          { type: String, default: '' },
  startDate:      { type: String, required: true },
  venue:          { type: String, default: '' },
  city:           { type: String, default: '' },
  description:    { type: String, default: '' },
});
// Each user can only save a given event once
eventSchema.index({ ticketmasterId: 1, userId: 1 }, { unique: true });
const Event = mongoose.model('Event', eventSchema);

// ── Passport / Google OAuth ───────────────────────────────────────────────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId:    profile.id,
        displayName: profile.displayName,
        email:       profile.emails?.[0]?.value || '',
        photo:       profile.photos?.[0]?.value || '',
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ── Auth Routes ───────────────────────────────────────────────────────────
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/html/LogIn.html' }),
  (req, res) => {
    req.session.save((err) => {
      if (err) console.error('Session save error:', err);
      res.redirect('/html/index.html');
    });
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout(() => res.redirect('/html/LogIn.html'));
});

// Returns the logged-in user's info (or 401 if not logged in)
app.get('/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  res.json({
    id:          req.user._id,
    displayName: req.user.displayName,
    email:       req.user.email,
    photo:       req.user.photo,
    preferences: req.user.preferences,
  });
});

// ── Email/Password Register ───────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });

  try {
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing)
      return res.status(400).json({ error: 'Username or email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed, displayName: username });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login after register failed' });
      res.json({ success: true, user: { displayName: user.displayName, email: user.email } });
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── Email/Password Login ──────────────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password)
    return res.status(400).json({ error: 'All fields are required' });

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });
    if (!user || !user.password)
      return res.status(400).json({ error: 'Username or email not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ error: 'Incorrect password' });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      res.json({ success: true, user: { displayName: user.displayName, email: user.email } });
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── User Preferences Route ────────────────────────────────────────────────
app.post('/api/user/preferences', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    await User.findByIdAndUpdate(req.user._id, {
      preferences: req.body.preferences
    });
    res.json({ message: 'Preferences saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// ── Event Routes ──────────────────────────────────────────────────────────
// GET only this user's saved events
app.get('/api/events', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const events = await Event.find({ userId: req.user._id });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// SAVE an event for this user
app.post('/api/events', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const existing = await Event.findOne({
      ticketmasterId: req.body.ticketmasterId,
      userId: req.user._id
    });
    if (existing) return res.json(existing);

    const newEvent = await Event.create({
      ...req.body,
      userId: req.user._id
    });
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save event' });
  }
});

// DELETE a saved event for this user
app.delete('/api/events/:ticketmasterId', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    await Event.findOneAndDelete({
      ticketmasterId: req.params.ticketmasterId,
      userId: req.user._id
    });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});
// ── Ticketmaster Proxy ────────────────────────────────────────────────────
app.get('/api/ticketmaster/events', async (req, res) => {
  console.log('API KEY:', process.env.TICKETMASTER_API_KEY ? 'EXISTS' : 'MISSING');
  try {
    let url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.TICKETMASTER_API_KEY}&size=100&expand=venues`;
    const allowed = ['sort', 'latlong', 'radius', 'unit', 'stateCode', 'classificationName', 'keyword', 'countryCode'];
    allowed.forEach(param => {
      if (req.query[param]) url += `&${param}=${req.query[param]}`;
    });
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ── Page Routes ───────────────────────────────────────────────────────────
const pages = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/html/index.html': 'index.html',
  '/calendar': 'calendar.html',
  '/calendar.html': 'calendar.html',
  '/html/calendar.html': 'calendar.html',
  '/profile': 'profile.html',
  '/profile.html': 'profile.html',
  '/html/profile.html': 'profile.html',
  '/onboarding': 'onboarding.html',
  '/onboarding.html': 'onboarding.html',
  '/html/onboarding.html': 'onboarding.html',
  '/login': 'LogIn.html',
  '/login.html': 'LogIn.html',
  '/html/LogIn.html': 'LogIn.html',
  '/signup': 'SignUp.html',
  '/signup.html': 'SignUp.html',
  '/html/SignUp.html': 'SignUp.html',
  '/event': 'event.html',
  '/event.html': 'event.html',
  '/html/event.html': 'event.html',
  '/event-request': 'event-request.html',
  '/event-request.html': 'event-request.html',
  '/html/event-request.html': 'event-request.html',
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (_req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'html', file));
  });
});

// ── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;