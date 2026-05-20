const express     = require('express');
const router      = express.Router();
const Preferences = require('../models/Preferences');
const { authenticateToken } = require('./authRoutes');

// GET preferences
router.get('/', authenticateToken, async (req, res) => {
  try {
    const prefs = await Preferences.findOne({ userId: req.userId });
    if (!prefs) return res.status(404).json({ error: 'Preferences not found' });
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// UPDATE preferences
router.put('/', authenticateToken, async (req, res) => {
  try {
    const prefs = await Preferences.findOneAndUpdate(
      { userId: req.userId },
      { $set: req.body },
      { new: true, upsert: true } // create if doesn't exist
    );
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;