const express = require('express');
const router  = express.Router();
const Event   = require('../models/Event');
const CalendarEntry = require('../models/CalendarEntry');
const { authenticateToken } = require('./authRoutes');

// GET all saved events for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.userId });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// SAVE event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const existing = await Event.findOne({ 
      ticketmasterId: req.body.ticketmasterId,
      userId: req.userId
    });
    if (existing) return res.json(existing);

    const newEvent = new Event({ ...req.body, userId: req.userId });
    await newEvent.save();

    // Also add to calendar automatically
    await CalendarEntry.create({
      userId:     req.userId,
      title:      req.body.title,
      date:       req.body.startDate,
      location:   req.body.venue,
      sourceType: 'ticketmaster',
      sourceId:   req.body.ticketmasterId,
      owner:      'You'
    });

    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save event' });
  }
});

// DELETE event
router.delete('/:ticketmasterId', authenticateToken, async (req, res) => {
  try {
    await Event.findOneAndDelete({ 
      ticketmasterId: req.params.ticketmasterId,
      userId: req.userId
    });

    // Remove from calendar too
    await CalendarEntry.findOneAndDelete({
      sourceId: req.params.ticketmasterId,
      userId:   req.userId
    });

    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;