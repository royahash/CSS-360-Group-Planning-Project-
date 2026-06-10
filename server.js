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
  secret: process.env.SESSION_SECRET || 'local-dev-secret',
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

// ── User Schema ───────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  googleId: { type: String, sparse: true },
  displayName: { type: String, default: '' },
  email: { type: String, default: '' },
  username: { type: String, default: '', unique: true, sparse: true },
  password: { type: String, default: '' },
  photo: { type: String, default: '' },
  preferences: { type: [String], default: [] },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ── Event Schema ──────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema({
  ticketmasterId: { type: String, required: true },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String, default: '' },
  startDate: { type: String, required: true },
  startTime: { type: String, default: '' },
  venue: { type: String, default: '' },
  city: { type: String, default: '' },
  description: { type: String, default: '' }
});

// Each user can only save a given event once
eventSchema.index({ ticketmasterId: 1, userId: 1 }, { unique: true });

const Event = mongoose.model('Event', eventSchema);

// ── Friend Request Schema ─────────────────────────────────────────────────
const friendRequestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Ensure unique pending requests can't send duplicate requests
friendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

// ── Event Request Schema ──────────────────────────────────────────────────
const eventRequestSchema = new mongoose.Schema(
  {
    creatorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    creatorName: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: String,
      required: true
    },
    startTime: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    visibility: {
      type: String,
      enum: ['friends-only', 'selected-users'],
      default: 'friends-only'
    },
    invitedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    invitedGroups: {
      type: [String],
      default: []
    },
    reminderEnabled: {
      type: Boolean,
      default: false
    },
    reminderMinutesBefore: {
      type: Number,
      default: 30
    },
    notificationSystem: {
      type: String,
      default: 'iliya-reminders'
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'declined'],
      default: 'pending'
    },
    pollOptions: {
      dates: {
        type: [String],
        default: []
      },
      times: {
        type: [String],
        default: []
      },
      locations: {
        type: [String],
        default: []
      },
      activities: {
        type: [String],
        default: []
      }
    },
    responses: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        displayName: {
          type: String,
          default: ''
        },
        email: {
          type: String,
          default: ''
        },
        responseStatus: {
          type: String,
          enum: ['accepted', 'declined', 'voted'],
          required: true
        },
        votes: {
          date: {
            type: String,
            default: ''
          },
          time: {
            type: String,
            default: ''
          },
          location: {
            type: String,
            default: ''
          },
          activity: {
            type: String,
            default: ''
          }
        },
        respondedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

eventRequestSchema.index({ creatorUserId: 1, createdAt: -1 });
eventRequestSchema.index({ invitedUsers: 1 });

const EventRequest = mongoose.model('EventRequest', eventRequestSchema);

// ── Passport / Google OAuth ───────────────────────────────────────────────
// Google OAuth is only enabled when credentials exist in .env.
// This prevents local crashes when GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are missing.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        user = await User.create({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value || '',
          photo: profile.photos?.[0]?.value || ''
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
} else if (process.env.NODE_ENV !== 'test') {
  console.warn('Google OAuth is disabled because GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing.');
}

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
app.get('/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).send('Google login is not configured locally.');
  }

  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

app.get('/auth/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).send('Google login is not configured locally.');
  }

  return passport.authenticate('google', { failureRedirect: '/html/LogIn.html' })(req, res, next);
}, (req, res) => {
  req.session.save((err) => {
    if (err) console.error('Session save error:', err);
    res.redirect('/html/index.html');
  });
});

app.get('/auth/logout', (req, res) => {
  req.logout(() => res.redirect('/html/LogIn.html'));
});

// Returns the logged-in user's info or 401 if not logged in
app.get('/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  res.json({
    id: req.user._id,
    displayName: req.user.displayName,
    email: req.user.email,
    photo: req.user.photo,
    preferences: req.user.preferences
  });
});

// ── Email/Password Register ───────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existing = await User.findOne({ $or: [{ email }, { username }] });

    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed,
      displayName: username
    });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login after register failed' });

      res.json({
        success: true,
        user: {
          displayName: user.displayName,
          email: user.email
        }
      });
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── Email/Password Login ──────────────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user || !user.password) {
      return res.status(400).json({ error: 'Username or email not found' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed' });

      res.json({
        success: true,
        user: {
          displayName: user.displayName,
          email: user.email
        }
      });
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

// ── Event Request Routes ──────────────────────────────────────────────────
// Create a new event request
app.post('/api/event-requests', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const {
      title,
      startDate,
      startTime,
      location,
      description,
      visibility,
      invitedUsers,
      invitedGroups,
      reminderEnabled,
      reminderMinutesBefore,
      pollOptions
    } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({
        error: 'Event title and date are required.'
      });
    }

    const currentUser = await User.findById(req.user._id).select('friends');

    let selectedInvitedUsers = [];

    if (visibility === 'selected-users') {
      selectedInvitedUsers = Array.isArray(invitedUsers)
        ? invitedUsers.filter(Boolean)
        : [];

      if (selectedInvitedUsers.length === 0) {
        return res.status(400).json({
          error: 'Selected-user events require at least one invited friend.'
        });
      }
    } else {
      // Friends Only sends the request to all current friends.
      selectedInvitedUsers = currentUser?.friends || [];
    }

    const eventRequest = await EventRequest.create({
      creatorUserId: req.user._id,
      creatorName: req.user.displayName || req.user.username || req.user.email || 'You',
      title,
      startDate,
      startTime: startTime || '',
      location: location || '',
      description: description || '',
      visibility: visibility || 'friends-only',
      invitedUsers: selectedInvitedUsers,
      invitedGroups: Array.isArray(invitedGroups) ? invitedGroups : [],
      reminderEnabled: Boolean(reminderEnabled),
      reminderMinutesBefore: Number(reminderMinutesBefore) || 30,
      notificationSystem: 'iliya-reminders',
      status: 'pending',
      pollOptions: pollOptions || {
        dates: [],
        times: [],
        locations: [],
        activities: []
      }
    });

    const populatedEventRequest = await EventRequest.findById(eventRequest._id)
      .populate('creatorUserId', 'username displayName email photo')
      .populate('invitedUsers', 'username displayName email photo');

    res.status(201).json({
      message: 'Event request created successfully.',
      eventRequest: populatedEventRequest
    });
  } catch (error) {
    console.error('Error creating event request:', error);
    res.status(500).json({
      error: 'Failed to create event request.'
    });
  }
});

// Get event requests visible to the logged-in user
app.get('/api/event-requests', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const eventRequests = await EventRequest.find({
      $or: [
        { creatorUserId: req.user._id },
        { invitedUsers: req.user._id }
      ]
    })
      .populate('creatorUserId', 'username displayName email photo')
      .populate('invitedUsers', 'username displayName email photo')
      .sort({ createdAt: -1 });

    res.json(eventRequests);
  } catch (error) {
    console.error('Error fetching event requests:', error);
    res.status(500).json({
      error: 'Failed to fetch event requests.'
    });
  }
});

// Get calendar events from saved events, event requests, and friends' saved events
app.get('/api/calendar-events', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const currentUser = await User.findById(req.user._id)
      .populate('friends', 'username displayName email photo');

    const friendIds = currentUser?.friends?.map((friend) => friend._id) || [];

    const savedEvents = await Event.find({ userId: req.user._id });

    const friendSavedEvents = friendIds.length
      ? await Event.find({ userId: { $in: friendIds } })
      : [];

    const eventRequests = await EventRequest.find({
      $or: [
        { creatorUserId: req.user._id },
        { invitedUsers: req.user._id }
      ]
    })
      .populate('creatorUserId', 'username displayName email photo')
      .populate('invitedUsers', 'username displayName email photo')
      .sort({ createdAt: -1 });

    const savedCalendarEvents = savedEvents.map((event) => ({
      id: event._id,
      title: event.title,
      startDate: event.startDate,
      startTime: event.startTime || '',
      location: event.venue || '',
      city: event.city || '',
      description: event.description || '',
      status: 'confirmed',
      source: 'saved-event',
      calendarType: 'my-calendar',
      owner: 'You',
      ticketmasterId: event.ticketmasterId || ''
    }));

    const friendCalendarEvents = friendSavedEvents.map((event) => {
      const friend = currentUser.friends.find((friendItem) => {
        return String(friendItem._id) === String(event.userId);
      });

      return {
        id: event._id,
        title: event.title,
        startDate: event.startDate,
        startTime: event.startTime || '',
        location: event.venue || '',
        city: event.city || '',
        description: event.description || '',
        status: 'confirmed',
        source: 'friend-event',
        calendarType: 'friend-events',
        owner: friend?.displayName || friend?.username || friend?.email || 'Friend',
        ticketmasterId: event.ticketmasterId || ''
      };
    });

    const requestCalendarEvents = eventRequests
      .map((eventRequest) => {
        const creatorId = eventRequest.creatorUserId?._id || eventRequest.creatorUserId;
        const isCreator = String(creatorId) === String(req.user._id);

        const userResponse = eventRequest.responses.find((response) => {
          return String(response.userId) === String(req.user._id);
        });

        if (!isCreator && userResponse?.responseStatus === 'declined') {
          return null;
        }

        let status = eventRequest.status || 'pending';

        if (!isCreator && userResponse?.responseStatus === 'accepted') {
          status = 'confirmed';
        }

        return {
          id: eventRequest._id,
          title: eventRequest.title,
          startDate: eventRequest.startDate,
          startTime: eventRequest.startTime || '',
          location: eventRequest.location || '',
          description: eventRequest.description || '',
          visibility: eventRequest.visibility,
          invitedUsers: eventRequest.invitedUsers,
          invitedGroups: eventRequest.invitedGroups,
          reminderEnabled: eventRequest.reminderEnabled,
          reminderMinutesBefore: eventRequest.reminderMinutesBefore,
          notificationSystem: eventRequest.notificationSystem,
          status,
          pollOptions: eventRequest.pollOptions,
          responses: eventRequest.responses,
          myResponse: userResponse || null,
          source: 'event-request',
          calendarType: 'event-requests',
          owner: isCreator
            ? 'You'
            : eventRequest.creatorName || eventRequest.creatorUserId?.displayName || 'Friend',
          canRespond: !isCreator
        };
      })
      .filter(Boolean);

    res.json([
      ...savedCalendarEvents,
      ...friendCalendarEvents,
      ...requestCalendarEvents
    ]);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({
      error: 'Failed to fetch calendar events.'
    });
  }
});

// Respond to an event request
app.patch('/api/event-requests/:id/respond', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const { responseStatus, votes } = req.body;

    if (!['accepted', 'declined', 'voted'].includes(responseStatus)) {
      return res.status(400).json({
        error: 'Response must be accepted, declined, or voted.'
      });
    }

    const eventRequest = await EventRequest.findById(req.params.id);

    if (!eventRequest) {
      return res.status(404).json({
        error: 'Event request not found.'
      });
    }

    const isCreator = String(eventRequest.creatorUserId) === String(req.user._id);

    const isInvited = eventRequest.invitedUsers.some((friendId) => {
      return String(friendId) === String(req.user._id);
    });

    if (!isCreator && !isInvited) {
      return res.status(403).json({
        error: 'You do not have access to this event request.'
      });
    }

    const existingResponseIndex = eventRequest.responses.findIndex((response) => {
      return String(response.userId) === String(req.user._id);
    });

    const responseData = {
      userId: req.user._id,
      displayName: req.user.displayName || req.user.username || req.user.email || 'User',
      email: req.user.email || '',
      responseStatus,
      votes: votes || {},
      respondedAt: new Date()
    };

    if (existingResponseIndex >= 0) {
      eventRequest.responses[existingResponseIndex] = responseData;
    } else {
      eventRequest.responses.push(responseData);
    }

    await eventRequest.save();

    const populatedEventRequest = await EventRequest.findById(eventRequest._id)
      .populate('creatorUserId', 'username displayName email photo')
      .populate('invitedUsers', 'username displayName email photo');

    res.json({
      message: 'Response saved successfully.',
      eventRequest: populatedEventRequest
    });
  } catch (error) {
    console.error('Error saving event request response:', error);
    res.status(500).json({
      error: 'Failed to save response.'
    });
  }
});

// Creator updates event request status
app.patch('/api/event-requests/:id/status', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'declined'].includes(status)) {
      return res.status(400).json({
        error: 'Status must be pending, confirmed, or declined.'
      });
    }

    const eventRequest = await EventRequest.findById(req.params.id);

    if (!eventRequest) {
      return res.status(404).json({
        error: 'Event request not found.'
      });
    }

    if (String(eventRequest.creatorUserId) !== String(req.user._id)) {
      return res.status(403).json({
        error: 'Only the creator can update this event request.'
      });
    }

    eventRequest.status = status;
    await eventRequest.save();

    res.json({
      message: 'Event request status updated successfully.',
      eventRequest
    });
  } catch (error) {
    console.error('Error updating event request status:', error);
    res.status(500).json({
      error: 'Failed to update event request status.'
    });
  }
});

// Update reminder settings
app.patch('/api/event-requests/:id/reminders', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const { reminderEnabled, reminderMinutesBefore } = req.body;

    const eventRequest = await EventRequest.findById(req.params.id);

    if (!eventRequest) {
      return res.status(404).json({
        error: 'Event request not found.'
      });
    }

    const isCreator = String(eventRequest.creatorUserId) === String(req.user._id);

    const isInvited = eventRequest.invitedUsers.some((friendId) => {
      return String(friendId) === String(req.user._id);
    });

    if (!isCreator && !isInvited) {
      return res.status(403).json({
        error: 'You do not have access to this event request.'
      });
    }

    eventRequest.reminderEnabled = Boolean(reminderEnabled);
    eventRequest.reminderMinutesBefore = Number(reminderMinutesBefore) || 30;
    eventRequest.notificationSystem = 'iliya-reminders';

    await eventRequest.save();

    res.json({
      message: 'Reminder settings updated successfully.',
      eventRequest
    });
  } catch (error) {
    console.error('Error updating reminders:', error);
    res.status(500).json({
      error: 'Failed to update reminder settings.'
    });
  }
});

// Delete an event request
app.delete('/api/event-requests/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const eventRequest = await EventRequest.findById(req.params.id);

    if (!eventRequest) {
      return res.status(404).json({
        error: 'Event request not found.'
      });
    }

    if (String(eventRequest.creatorUserId) !== String(req.user._id)) {
      return res.status(403).json({
        error: 'Only the creator can delete this event request.'
      });
    }

    await EventRequest.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Event request deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting event request:', error);
    res.status(500).json({
      error: 'Failed to delete event request.'
    });
  }
});

// ── Ticketmaster Proxy ────────────────────────────────────────────────────
app.get('/api/ticketmaster/events', async (req, res) => {
  try {
    const now = new Date().toISOString().split('.')[0] + 'Z';
    let url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.TICKETMASTER_API_KEY}&size=100&expand=venues&startDateTime=${now}`;

    const allowed = [
      'sort',
      'latlong',
      'radius',
      'unit',
      'stateCode',
      'classificationName',
      'keyword',
      'countryCode'
    ];

    allowed.forEach((param) => {
      if (req.query[param]) url += `&${param}=${req.query[param]}`;
    });

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/ticketmaster/event/:id', async (req, res) => {
  try {
    const url = `https://app.ticketmaster.com/discovery/v2/events/${req.params.id}.json?apikey=${process.env.TICKETMASTER_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// ── Friend Routes ─────────────────────────────────────────────────────────
// SEND friend request by username
app.post('/api/friends/request', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  const { username } = req.body;

  try {
    const targetUser = await User.findOne({ username });

    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot add yourself' });
    }

    if (req.user.friends.map(String).includes(targetUser._id.toString())) {
      return res.status(400).json({ error: 'Already friends' });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId: req.user._id, receiverId: targetUser._id },
        { senderId: targetUser._id, receiverId: req.user._id }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    const friendRequest = await FriendRequest.create({
      senderId: req.user._id,
      receiverId: targetUser._id
    });

    res.status(201).json({
      message: 'Friend request sent',
      request: friendRequest
    });
  } catch (err) {
    console.error('Error sending friend request:', err);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// GET pending friend requests for current user
app.get('/api/friends/requests', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const requests = await FriendRequest.find({
      receiverId: req.user._id,
      status: 'pending'
    }).populate('senderId', 'username displayName email photo');

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

// ACCEPT friend request
app.post('/api/friends/accept/:senderId', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const friendRequest = await FriendRequest.findOne({
      senderId: req.params.senderId,
      receiverId: req.user._id,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { friends: req.params.senderId }
    });

    await User.findByIdAndUpdate(req.params.senderId, {
      $addToSet: { friends: req.user._id }
    });

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error('Error accepting friend request:', err);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// DECLINE friend request
app.post('/api/friends/decline/:senderId', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const friendRequest = await FriendRequest.findOne({
      senderId: req.params.senderId,
      receiverId: req.user._id,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    friendRequest.status = 'declined';
    await friendRequest.save();

    res.json({ message: 'Friend request declined' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to decline friend request' });
  }
});

// GET list of friends for current user
app.get('/api/friends', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const user = await User.findById(req.user._id).populate('friends', 'username displayName email photo');
    res.json(user.friends || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// DELETE friend
app.delete('/api/friends/:friendId', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { friends: req.params.friendId }
    });

    await User.findByIdAndUpdate(req.params.friendId, {
      $pull: { friends: req.user._id }
    });

    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// GET a specific user's saved events for viewing friend's events
app.get('/api/friends/:userId/events', async (req, res) => {
  try {
    const events = await Event.find({ userId: req.params.userId });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user events' });
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

  '/friends': 'friends.html',
  '/friends.html': 'friends.html',
  '/html/friends.html': 'friends.html',

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
  '/html/event-request.html': 'event-request.html'
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (_req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'html', file));
  });
});

// ── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('MongoDB connection error:', error));
}

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;