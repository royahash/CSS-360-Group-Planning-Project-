const express = require('express');
const router  = express.Router();
const Friend  = require('../models/Friend');
const User    = require('../models/User');
const { authenticateToken } = require('./authRoutes');

// SEND friend request
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { friendUsername } = req.body;

    const friend = await User.findOne({ username: friendUsername });
    if (!friend) return res.status(404).json({ error: 'User not found' });

    if (friend._id.toString() === req.userId) {
      return res.status(400).json({ error: 'Cannot add yourself' });
    }

    const existing = await Friend.findOne({ 
      userId: req.userId, 
      friendId: friend._id 
    });
    if (existing) return res.status(400).json({ error: 'Request already sent' });

    const request = new Friend({ 
      userId:   req.userId, 
      friendId: friend._id 
    });
    await request.save();

    res.status(201).json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// ACCEPT friend request
router.put('/accept/:friendId', authenticateToken, async (req, res) => {
  try {
    await Friend.findOneAndUpdate(
      { userId: req.params.friendId, friendId: req.userId },
      { status: 'accepted' }
    );

    // Create reverse relationship so both users see each other
    const reverse = await Friend.findOne({ 
      userId: req.userId, 
      friendId: req.params.friendId 
    });
    if (!reverse) {
      await Friend.create({ 
        userId:   req.userId, 
        friendId: req.params.friendId, 
        status:   'accepted' 
      });
    } else {
      reverse.status = 'accepted';
      await reverse.save();
    }

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// GET all accepted friends
router.get('/', authenticateToken, async (req, res) => {
  try {
    const friends = await Friend.find({ 
      userId: req.userId, 
      status: 'accepted' 
    }).populate('friendId', 'username email');

    res.json(friends.map(f => f.friendId));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// GET pending incoming requests
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const pending = await Friend.find({ 
      friendId: req.userId, 
      status:   'pending' 
    }).populate('userId', 'username');

    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

module.exports = router;