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

// ── INNGEST & REMINDER SYSTEM IMPORTS ──────────────────────────────────────
const { Inngest } = require('inngest');
const { serve } = require('inngest/express');
const { Resend } = require('resend');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

const app = express();
app.set('trust proxy', 1);

// ── MIDDLEWARE ────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));

// ── INNGEST & RESEND INITIALIZATION ────────────────────────────────────────
const inngest = new Inngest({ 
  id: "reminder-system",
  eventKey: process.env.INNGEST_EVENT_KEY || "local-key" 
});
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const schedule = [
    { name: "1 week", ms: 7 * 24 * 60 * 60 * 1000 },
    { name: "5 days", ms: 5 * 24 * 60 * 60 * 1000 },
    { name: "3 days", ms: 3 * 24 * 60 * 60 * 1000 },
    { name: "1 day", ms: 24 * 60 * 60 * 1000 },
    { name: "10 hours", ms: 10 * 60 * 60 * 1000 },
    { name: "5 hours", ms: 5 * 60 * 60 * 1000 },
    { name: "1 hour", ms: 60 * 60 * 1000 }
];

const eventReminderWorkflow = inngest.createFunction(
    { 
        id: "send-event-reminders",
        cancelOn: [{ event: "event/updated", match: "data.eventId" }],
        triggers: [{ event: "event/scheduled" }] 
    },
    async ({ event, step }) => {
        const { 
            eventName, 
            eventDate, 
            eventUsers, 
            eventDescription, 
            eventLocation, 
            eventURL       
        } = event.data;

        const validSchedule = await step.run("calculate-schedule", () => {
            const now = dayjs.utc();
            const eventTime = dayjs.utc(eventDate);
        
            return schedule.filter(offset => {
                const triggerTime = eventTime.subtract(offset.ms, 'millisecond');
                return triggerTime.isAfter(now);
            });
        });

        for (const offset of validSchedule) {
            const triggerTime = dayjs.utc(eventDate).subtract(offset.ms, 'millisecond');

            await step.sleepUntil(`wait-for-${offset.name}`, triggerTime.toDate());

            await step.run(`send-email-${offset.name}`, async () => {
                const formattedDate = dayjs(eventDate).format('dddd, MMMM D, YYYY');
                const formattedTime = dayjs(eventDate).format('h:mm A');

                if (!resend) return { error: 'Resend not configured' };
                return await resend.emails.send({
                    from: 'onboarding@resend.dev',
                    to: eventUsers[0].email,
                    subject: `Reminder: ${eventName} is coming up!`,
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
                            <h2>Event Reminder: ${eventName}</h2>
                            <p>You have an upcoming event scheduled. Here are the details:</p>
                
                            <ul style="list-style: none; padding-left: 0; line-height: 1.6;">
                                <li><strong>Description:</strong> ${eventDescription || 'Not specified'}</li>
                                <li><strong>Location:</strong> ${eventLocation || 'Not specified'}</li>
                                <li><strong>Date:</strong> ${formattedDate}</li>
                                <li><strong>Time:</strong> ${formattedTime}</li> 
                            </ul>
                
                            <div style="margin-top: 20px;">
                                <a href="${eventURL}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
                                    View on Calendar
                                </a>
                            </div>
                        </div>
                    `
                });
            });
        }
    }
);

app.use("/api/inngest", serve({ client: inngest, functions: [eventReminderWorkflow] }));

// ── SESSION SETUP ─────────────────────────────────────────────────────────
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

// ── USER SCHEMA ───────────────────────────────────────────────────────────
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

// ── EVENT SCHEMA ──────────────────────────────────────────────────────────
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

eventSchema.index({ ticketmasterId: 1, userId: 1 }, { unique: true });
const Event = mongoose.model('Event', eventSchema);

// ── FRIEND REQUEST SCHEMA ─────────────────────────────────────────────────
const friendRequestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

friendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

// ── EVENT REQUEST SCHEMA ──────────────────────────────────────────────────
const eventRequestSchema = new mongoose.Schema(
  {
    creatorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    creatorName: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    startDate: { type: String, required: true },
    startTime: { type: String, default: '' },
    location: { type: String, default: '' },
    description: { type: String, default: '' },
    visibility: { type: String, enum: ['friends-only', 'selected-users'], default: 'friends-only' },
    invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    invitedGroups: { type: [String], default: [] },
    reminderEnabled: { type: Boolean, default: false },
    reminderMinutesBefore: { type: Number, default: 30 },
    notificationSystem: { type: String, default: 'iliya-reminders' },
    status: { type: String, enum: ['pending', 'confirmed', 'declined'], default: 'pending' },
    pollOptions: {
      dates: { type: [String], default: [] },
      times: { type: [String], default: [] },
      locations: { type: [String], default: [] },
      activities: { type: [String], default: [] }
    },
    responses: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        displayName: { type: String, default: '' },
        email: { type: String, default: '' },
        responseStatus: { type: String, enum: ['accepted', 'declined', 'voted'], required: true },
        votes: {
          date: { type: String, default: '' },
          time: { type: String, default: '' },
          location: { type: String, default: '' },
          activity: { type: String, default: '' }
        },
        respondedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

eventRequestSchema.index({ creatorUserId: 1, createdAt: -1 });
eventRequestSchema.index({ invitedUsers: 1 });

const EventRequest = mongoose.model('EventRequest', eventRequestSchema);

// ── PASSPORT / GOOGLE OAUTH ───────────────────────────────────────────────
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

// ── AUTH ROUTES ───────────────────────────────────────────────────────────
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

app.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  try {
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: 'Username or email already exists' });
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed,
      displayName: username
    });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login after register failed' });
      res.json({ success: true, user: { displayName: user.displayName, email: user.email } });
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: 'All fields are required' });
  try {
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user || !user.password) return res.status(400).json({ error: 'Username or email not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Incorrect password' });
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      res.json({ success: true, user: { displayName: user.displayName, email: user.email } });
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/user/preferences', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    await User.findByIdAndUpdate(req.user._id, { preferences: req.body.preferences });
    res.json({ message: 'Preferences saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// ── EVENT ROUTES ──────────────────────────────────────────────────────────
app.get('/api/events', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const events = await Event.find({ userId: req.user._id });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/api/events', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const existing = await Event.findOne({ ticketmasterId: req.body.ticketmasterId, userId: req.user._id });
    if (existing) return res.json(existing);
    const newEvent = await Event.create({ ...req.body, userId: req.user._id });
    res.status(201).json(newEvent);
  } catch (err) {
    console.error('Save event error:', err.message, err.code);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

app.delete('/api/events/:ticketmasterId', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    await Event.findOneAndDelete({ ticketmasterId: req.params.ticketmasterId, userId: req.user._id });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ── EVENT REQUEST ROUTES ──────────────────────────────────────────────────
app.post('/api/event-requests', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const {
      title, startDate, startTime, location, description,
      visibility, invitedUsers, invitedGroups, reminderEnabled,
      reminderMinutesBefore, pollOptions
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
      pollOptions: pollOptions || { dates: [], times: [], locations: [], activities: [] }
    });

    let eventDateTimeStr = eventRequest.startDate;
    if (eventRequest.startTime) {
      eventDateTimeStr = `${eventRequest.startDate}T${eventRequest.startTime}`;
    }
    const eventDateISO = dayjs(eventDateTimeStr).toISOString();

    if (eventRequest.reminderEnabled) {
      await inngest.send({
        name: "event/scheduled",
        data: {
          eventId: eventRequest._id.toString(),
          eventName: eventRequest.title,
          eventDate: eventDateISO,
          eventUsers: [{ email: req.user.email }],
          eventDescription: eventRequest.description,
          eventLocation: eventRequest.location,
          eventURL: `http://localhost:3000/html/calendar.html`
        }
      });
    }
    
    const populatedEventRequest = await EventRequest.findById(eventRequest._id)
      .populate('creatorUserId', 'username displayName email photo')
      .populate('invitedUsers', 'username displayName email photo');

    res.status(201).json({
      message: 'Event request created successfully.',
      eventRequest: populatedEventRequest
    });
  } catch (error) {
    console.error('Error creating event request:', error);
    res.status(500).json({ error: 'Failed to create event request.' });
  }
});

app.get('/api/event-requests', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const eventRequests = await EventRequest.find({
      $or: [ { creatorUserId: req.user._id }, { invitedUsers: req.user._id } ]
    })
      .populate('creatorUserId', 'username displayName email photo')
      .populate('invitedUsers', 'username displayName email photo')
      .sort({ createdAt: -1 });
    res.json(eventRequests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event requests.' });
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
        const userResponse = eventRequest.responses.find((response) => String(response.userId) === String(req.user._id));

        if (!isCreator && userResponse?.responseStatus === 'declined') return null;

        let status = eventRequest.status || 'pending';
        if (!isCreator && userResponse?.responseStatus === 'accepted') status = 'confirmed';

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
    res.status(500).json({ error: 'Failed to fetch calendar events.' });
  }
});

app.patch('/api/event-requests/:id/respond', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { responseStatus, votes } = req.body;
    if (!['accepted', 'declined', 'voted'].includes(responseStatus)) return res.status(400).json({ error: 'Response status invalid.' });

    const eventRequest = await EventRequest.findById(req.params.id);
    if (!eventRequest) return res.status(404).json({ error: 'Event request not found.' });

    const isCreator = String(eventRequest.creatorUserId) === String(req.user._id);
    const isInvited = eventRequest.invitedUsers.some((friendId) => String(friendId) === String(req.user._id));
    if (!isCreator && !isInvited) return res.status(403).json({ error: 'Access denied.' });

    const existingResponseIndex = eventRequest.responses.findIndex((r) => String(r.userId) === String(req.user._id));
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
    res.status(500).json({ error: 'Failed to save response.' });
  }
});

app.patch('/api/event-requests/:id/status', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'declined'].includes(status)) return res.status(400).json({ error: 'Status invalid.' });

    const eventRequest = await EventRequest.findById(req.params.id);
    if (!eventRequest) return res.status(404).json({ error: 'Event request not found.' });
    if (String(eventRequest.creatorUserId) !== String(req.user._id)) return res.status(403).json({ error: 'Unauthorized.' });

    eventRequest.status = status;
    await eventRequest.save();
    res.json({ message: 'Status updated.', eventRequest });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

app.patch('/api/event-requests/:id/reminders', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { reminderEnabled, reminderMinutesBefore } = req.body;

    const eventRequest = await EventRequest.findById(req.params.id);
    if (!eventRequest) return res.status(404).json({ error: 'Event request not found.' });

    const isCreator = String(eventRequest.creatorUserId) === String(req.user._id);
    const isInvited = eventRequest.invitedUsers.some((friendId) => String(friendId) === String(req.user._id));
    if (!isCreator && !isInvited) return res.status(403).json({ error: 'Access denied.' });

    eventRequest.reminderEnabled = Boolean(reminderEnabled);
    eventRequest.reminderMinutesBefore = Number(reminderMinutesBefore) || 30;
    eventRequest.notificationSystem = 'iliya-reminders';

    await eventRequest.save();

    let eventDateTimeStr = eventRequest.startDate;
    if (eventRequest.startTime) {
      eventDateTimeStr = `${eventRequest.startDate}T${eventRequest.startTime}`;
    }
    const eventDateISO = dayjs(eventDateTimeStr).toISOString();

    if (eventRequest.reminderEnabled) {
      await inngest.send({
        name: "event/scheduled",
        data: {
          eventId: eventRequest._id.toString(),
          eventName: eventRequest.title,
          eventDate: eventDateISO,
          eventUsers: [{ email: req.user.email }],
          eventDescription: eventRequest.description,
          eventLocation: eventRequest.location,
          eventURL: `http://localhost:3000/html/calendar.html`
        }
      });
    } else {
      await inngest.send({
        name: "event/updated",
        data: { eventId: eventRequest._id.toString() } 
      });
    }

    res.json({ message: 'Reminder settings updated successfully.', eventRequest });
  } catch (error) {
    console.error('Error updating reminders:', error);
    res.status(500).json({ error: 'Failed to update reminder settings.' });
  }
});

// Update an event request (creator only)
app.patch('/api/event-requests/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const eventRequest = await EventRequest.findById(req.params.id);

    if (!eventRequest) {
      return res.status(404).json({ error: 'Event request not found.' });
    }

    if (String(eventRequest.creatorUserId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the creator can edit this event request.' });
    }

    const { title, startDate, startTime, location, description, pollOptions, newInvites } = req.body;

    if (title) eventRequest.title = title;
    if (startDate) eventRequest.startDate = startDate;
    if (startTime !== undefined) eventRequest.startTime = startTime;
    if (location !== undefined) eventRequest.location = location;
    if (description !== undefined) eventRequest.description = description;
    if (pollOptions) eventRequest.pollOptions = pollOptions;

    // Add new friends by username, email, or displayName
    if (newInvites && newInvites.length > 0) {
      const newUsers = await User.find({
        $or: newInvites.flatMap(invite => [
          { username: invite },
          { email: invite },
          { displayName: invite }
        ])
      }).select('_id');

      const newIds = newUsers.map(u => u._id.toString());
      const existingIds = eventRequest.invitedUsers.map(id => id.toString());
      const toAdd = newIds.filter(id => !existingIds.includes(id));
      eventRequest.invitedUsers.push(...toAdd);
    }

    await eventRequest.save();

    res.json({ message: 'Event request updated.', eventRequest });
  } catch (error) {
    console.error('Error updating event request:', error);
    res.status(500).json({ error: 'Failed to update event request.' });
  }
});

// Delete an event request
app.delete('/api/event-requests/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const eventRequest = await EventRequest.findById(req.params.id);
    if (!eventRequest) return res.status(404).json({ error: 'Event request not found.' });
    if (String(eventRequest.creatorUserId) !== String(req.user._id)) return res.status(403).json({ error: 'Unauthorized.' });

    await EventRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event request deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event request.' });
  }
});

// ── TICKETMASTER PROXY ────────────────────────────────────────────────────
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

// ── FRIEND ROUTES ─────────────────────────────────────────────────────────
app.post('/api/friends/request', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  const { username } = req.body;

  try {
   const targetUser = await User.findOne({ $or: [{ username }, { email: username }, { displayName: username }] });

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
  ],
  status: 'pending'
});

if (existingRequest) {
  return res.status(400).json({ error: 'Friend request already exists' });
}

await FriendRequest.deleteMany({
  $or: [
    { senderId: req.user._id, receiverId: targetUser._id },
    { senderId: targetUser._id, receiverId: req.user._id }
  ],
  status: { $in: ['declined', 'accepted'] }
});

    const friendRequest = await FriendRequest.create({
      senderId: req.user._id,
      receiverId: targetUser._id
    });

    res.status(201).json({
      message: 'Friend request sent',
      request: friendRequest
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

app.get('/api/friends/requests', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const requests = await FriendRequest.find({ receiverId: req.user._id, status: 'pending' }).populate('senderId', 'username displayName email photo');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

app.post('/api/friends/accept/:senderId', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const friendRequest = await FriendRequest.findOne({ senderId: req.params.senderId, receiverId: req.user._id, status: 'pending' });
    if (!friendRequest) return res.status(404).json({ error: 'Friend request not found' });

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
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

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

app.get('/api/friends', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const user = await User.findById(req.user._id).populate('friends', 'username displayName email photo');
    res.json(user.friends || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

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

app.get('/api/friends/:userId/events', async (req, res) => {
  try {
    const events = await Event.find({ userId: req.params.userId });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
});

// GET a specific user's interests (preferences)
app.get('/api/friends/:userId/interests', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const user = await User.findById(req.params.userId).select('preferences');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.preferences || []);
  } catch (err) {
    console.error('Error fetching interests:', err);
    res.status(500).json({ error: 'Failed to fetch interests' });
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
  app.get(route, (_req, res) => { res.sendFile(path.join(__dirname, 'src', 'html', file)); });
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