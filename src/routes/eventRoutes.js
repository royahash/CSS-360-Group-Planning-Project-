const express = require('express');
const router = express.Router();

const Event = require('../models/Event');


// GET all saved events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});


// SAVE event
router.post('/', async (req, res) => {
  try {
    const event = new Event(req.body);

    await event.save();

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save event' });
  }
});


// DELETE event
router.delete('/:ticketmasterId', async (req, res) => {
  try {
    await Event.deleteOne({
      ticketmasterId: req.params.ticketmasterId,
    });

    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;