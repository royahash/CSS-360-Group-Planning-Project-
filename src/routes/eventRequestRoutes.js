const express      = require('express');
const router       = express.Router();
const EventRequest = require('../models/EventRequest');
const CalendarEntry = require('../models/CalendarEntry');
const { authenticateToken } = require('./authRoutes');

// CREATE event request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, date, time, location, invitees } = req.body;

    const request = new EventRequest({
      createdBy: req.userId,
      title,
      date,
      time,
      location,
      invitees:  invitees || [],
      responses: (invitees || []).map(id => ({ userId: id, answer: 'pending' }))
    });

    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event request' });
  }
});

// GET all requests sent to logged-in user
router.get('/incoming', authenticateToken, async (req, res) => {
  try {
    const requests = await EventRequest.find({ 
      invitees: req.userId 
    }).populate('createdBy', 'username');

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET all requests created by logged-in user
router.get('/outgoing', authenticateToken, async (req, res) => {
  try {
    const requests = await EventRequest.find({ 
      createdBy: req.userId 
    }).populate('invitees', 'username');

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// RESPOND to an event request (accept or deny)
router.put('/respond/:requestId', authenticateToken, async (req, res) => {
  try {
    const { answer } = req.body; // 'accepted' or 'denied'

    const request = await EventRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const response = request.responses.find(
      r => r.userId.toString() === req.userId
    );
    if (!response) return res.status(403).json({ error: 'Not invited' });

    response.answer = answer;
    await request.save();

    // If accepted, add to their calendar
    if (answer === 'accepted') {
      await CalendarEntry.create({
        userId:     req.userId,
        title:      request.title,
        date:       request.date,
        time:       request.time,
        location:   request.location,
        sourceType: 'request',
        sourceId:   request._id.toString(),
        owner:      'You'
      });
    }

    res.json({ message: `Event ${answer}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to respond' });
  }
});

module.exports = router;