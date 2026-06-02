require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// This serves the static frontend files in your event-request branch.
// Since that branch keeps HTML/CSS/JS files in the repo root, this works if server.js is also in the root.
app.use(express.static(__dirname));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    console.error('Make sure MONGODB_URI is set in your .env file.');
  });

const eventRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, default: '' },
    location: { type: String, default: '' },
    description: { type: String, default: '' },
    creator: { type: String, default: 'You' },
    invitedUsers: { type: [String], default: [] },
    invitedGroups: { type: [String], default: [] },
    visibility: {
      type: String,
      enum: ['friends-only', 'selected-users'],
      default: 'friends-only',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'declined'],
      default: 'pending',
    },
    reminderEnabled: { type: Boolean, default: false },
    reminderMinutesBefore: { type: Number, default: 30 },
    notificationSystem: { type: String, default: 'iliya-reminders' },
    votes: [
      {
        voter: { type: String, required: true },
        response: {
          type: String,
          enum: ['accepted', 'declined', 'voted'],
          required: true,
        },
        selectedDate: { type: String, default: '' },
        selectedTime: { type: String, default: '' },
        selectedLocation: { type: String, default: '' },
        selectedActivity: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const calendarEventSchema = new mongoose.Schema(
  {
    eventRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventRequest',
      required: true,
    },
    title: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, default: '' },
    location: { type: String, default: '' },
    description: { type: String, default: '' },
    owner: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'declined'],
      default: 'pending',
    },
    source: { type: String, default: 'event-request' },
  },
  { timestamps: true }
);

calendarEventSchema.index({ eventRequestId: 1, owner: 1 }, { unique: true });

const EventRequest = mongoose.model('EventRequest', eventRequestSchema);
const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);

function buildCalendarEvent(eventRequest, owner, status) {
  return {
    eventRequestId: eventRequest._id,
    title: eventRequest.title,
    date: eventRequest.date,
    time: eventRequest.time,
    location: eventRequest.location,
    description: eventRequest.description,
    owner,
    status,
    source: 'event-request',
  };
}

async function upsertCalendarEvent(eventRequest, owner, status) {
  return CalendarEvent.findOneAndUpdate(
    { eventRequestId: eventRequest._id, owner },
    buildCalendarEvent(eventRequest, owner, status),
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

app.get('/api/health', (_req, res) => {
  res.json({ message: 'Event request backend is running' });
});

// Temporary friend list for the event-request branch UI.
// Later, this can connect to real user accounts.
app.get('/api/friends', (_req, res) => {
  res.json({ friends: ['Alex', 'Jordan', 'Taylor', 'Sam'] });
});

// Create an event request and add it to the creator calendar as Pending.
app.post('/api/event-requests', async (req, res) => {
  try {
    const {
      title,
      date,
      time,
      location,
      description,
      creator,
      invitedUsers,
      invitedGroups,
      visibility,
      reminderEnabled,
      reminderMinutesBefore,
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required.' });
    }

    if (visibility === 'selected-users' && (!invitedUsers || invitedUsers.length === 0)) {
      return res.status(400).json({ error: 'Selected-user visibility requires at least one invited user.' });
    }

    const eventRequest = await EventRequest.create({
      title,
      date,
      time: time || '',
      location: location || '',
      description: description || '',
      creator: creator || 'You',
      invitedUsers: Array.isArray(invitedUsers) ? invitedUsers : [],
      invitedGroups: Array.isArray(invitedGroups) ? invitedGroups : [],
      visibility: visibility || 'friends-only',
      reminderEnabled: Boolean(reminderEnabled),
      reminderMinutesBefore: Number(reminderMinutesBefore) || 30,
      status: 'pending',
    });

    await upsertCalendarEvent(eventRequest, eventRequest.creator, 'pending');

    res.status(201).json({
      message: 'Event request created and added to creator calendar as pending.',
      eventRequest,
    });
  } catch (error) {
    console.error('Create event request error:', error.message);
    res.status(500).json({ error: 'Failed to create event request.' });
  }
});

// Get all event requests.
app.get('/api/event-requests', async (_req, res) => {
  try {
    const eventRequests = await EventRequest.find().sort({ createdAt: -1 });
    res.json(eventRequests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event requests.' });
  }
});

// Save accept/decline/vote response.
// Accepting automatically adds confirmed event to that participant's calendar.
// Declining removes that participant's calendar copy.
app.patch('/api/event-requests/:id/respond', async (req, res) => {
  try {
    const { voter, response, selectedDate, selectedTime, selectedLocation, selectedActivity } = req.body;

    if (!voter || !['accepted', 'declined', 'voted'].includes(response)) {
      return res.status(400).json({ error: 'Voter and valid response are required.' });
    }

    const eventRequest = await EventRequest.findById(req.params.id);
    if (!eventRequest) {
      return res.status(404).json({ error: 'Event request not found.' });
    }

    const existingVoteIndex = eventRequest.votes.findIndex((vote) => vote.voter === voter);
    const voteData = {
      voter,
      response,
      selectedDate: selectedDate || '',
      selectedTime: selectedTime || '',
      selectedLocation: selectedLocation || '',
      selectedActivity: selectedActivity || '',
      createdAt: new Date(),
    };

    if (existingVoteIndex >= 0) {
      eventRequest.votes[existingVoteIndex] = voteData;
    } else {
      eventRequest.votes.push(voteData);
    }

    await eventRequest.save();

    if (response === 'accepted') {
      await upsertCalendarEvent(eventRequest, voter, 'confirmed');
    }

    if (response === 'declined') {
      await CalendarEvent.findOneAndDelete({ eventRequestId: eventRequest._id, owner: voter });
    }

    res.json({ message: 'Response saved.', eventRequest });
  } catch (error) {
    console.error('Respond to event request error:', error.message);
    res.status(500).json({ error: 'Failed to save response.' });
  }
});

// Creator can update event status.
app.patch('/api/event-requests/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Status must be pending, confirmed, or declined.' });
    }

    const eventRequest = await EventRequest.findById(req.params.id);
    if (!eventRequest) {
      return res.status(404).json({ error: 'Event request not found.' });
    }

    eventRequest.status = status;
    await eventRequest.save();
    await upsertCalendarEvent(eventRequest, eventRequest.creator, status);

    res.json({ message: 'Status updated.', eventRequest });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// Update reminder settings and mark them for Iliya's notification/reminder system.
app.patch('/api/event-requests/:id/reminders', async (req, res) => {
  try {
    const { reminderEnabled, reminderMinutesBefore } = req.body;

    const eventRequest = await EventRequest.findByIdAndUpdate(
      req.params.id,
      {
        reminderEnabled: Boolean(reminderEnabled),
        reminderMinutesBefore: Number(reminderMinutesBefore) || 30,
        notificationSystem: 'iliya-reminders',
      },
      { new: true }
    );

    if (!eventRequest) {
      return res.status(404).json({ error: 'Event request not found.' });
    }

    res.json({ message: 'Reminder settings saved.', eventRequest });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save reminders.' });
  }
});

// Calendar endpoint used by calendar.js.
// It returns pending and confirmed request-based calendar events.
app.get('/api/calendar-events', async (_req, res) => {
  try {
    const events = await CalendarEvent.find().sort({ date: 1, time: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar events.' });
  }
});

app.delete('/api/event-requests/:id', async (req, res) => {
  try {
    const deleted = await EventRequest.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Event request not found.' });
    }

    await CalendarEvent.deleteMany({ eventRequestId: req.params.id });
    res.json({ message: 'Event request and related calendar events deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event request.' });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
