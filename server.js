require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────

app.use(cors());

app.use(express.json());

// Makes everything inside src/ publicly accessible
app.use(express.static(path.join(__dirname, 'src')));

// ── MongoDB Connection ────────────────────────────────────────────────────

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// ── Event Schema ──────────────────────────────────────────────────────────

const eventSchema = new mongoose.Schema({
  ticketmasterId: {
    type: String,
    required: true,
    unique: true,
  },

  title: {
    type: String,
    required: true,
  },

  image: {
    type: String,
    default: '',
  },

  startDate: {
    type: String,
    required: true,
  },

  venue: {
    type: String,
    default: '',
  },

  city: {
    type: String,
    default: '',
  },

  owner: {
    type: String,
    default: 'You',
  },

  description: {
    type: String,
    default: '',
  },
});

const Event = mongoose.model('Event', eventSchema);

// ── API ROUTES ────────────────────────────────────────────────────────────

// GET all saved events
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find();

    res.json(events);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch events',
    });
  }
});

// SAVE event
app.post('/api/events', async (req, res) => {
  try {
    const existingEvent = await Event.findOne({
      ticketmasterId: req.body.ticketmasterId,
    });

    // Prevent duplicates
    if (existingEvent) {
      return res.json(existingEvent);
    }

    const newEvent = new Event(req.body);

    await newEvent.save();

    res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to save event',
    });
  }
});

// DELETE event
app.delete('/api/events/:ticketmasterId', async (req, res) => {
  try {
    await Event.findOneAndDelete({
      ticketmasterId: req.params.ticketmasterId,
    });

    res.json({
      message: 'Event deleted',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete event',
    });
  }
});

// GET single event by Ticketmaster ID
app.get('/api/events/:ticketmasterId', async (req, res) => {
  try {
    const event = await Event.findOne({
      ticketmasterId: req.params.ticketmasterId,
    });

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
      });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch event',
    });
  }
});

// ── Fallback Route ────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'src/html/index.html')
  );
});

// ── Start Server ──────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});