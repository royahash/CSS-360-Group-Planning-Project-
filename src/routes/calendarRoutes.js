const express       = require('express');
const router        = express.Router();
const CalendarEntry = require('../models/CalendarEntry');
const { authenticateToken } = require('./authRoutes');

// GET all calendar entries for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const entries = await CalendarEntry.find({ userId: req.userId });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

// ADD manual calendar entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const entry = new CalendarEntry({ 
      ...req.body, 
      userId:     req.userId,
      sourceType: req.body.sourceType || 'manual'
    });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add entry' });
  }
});

// DELETE calendar entry
router.delete('/:entryId', authenticateToken, async (req, res) => {
  try {
    await CalendarEntry.findOneAndDelete({ 
      _id:    req.params.entryId, 
      userId: req.userId 
    });
    res.json({ message: 'Entry removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

module.exports = router;