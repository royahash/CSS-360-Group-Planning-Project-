const express = require('express');
const router  = express.Router();
const Poll    = require('../models/Poll');
const { authenticateToken } = require('./authRoutes');

// CREATE poll
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { eventRequestId, categories } = req.body;

    const poll = new Poll({
      createdBy:      req.userId,
      eventRequestId: eventRequestId || null,
      categories:     categories || { dates: [], times: [], locations: [], activities: [] }
    });

    await poll.save();
    res.status(201).json(poll);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// GET poll by id
router.get('/:pollId', authenticateToken, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    res.json(poll);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

// VOTE on a poll option
router.put('/:pollId/vote', authenticateToken, async (req, res) => {
  try {
    const { category, optionName } = req.body;
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    const option = poll.categories[category]?.find(o => o.name === optionName);
    if (!option) return res.status(404).json({ error: 'Option not found' });

    const alreadyVoted = option.votes.some(
      v => v.toString() === req.userId
    );
    if (alreadyVoted) return res.status(400).json({ error: 'Already voted' });

    option.votes.push(req.userId);
    await poll.save();
    res.json(poll);
  } catch (err) {
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// REMOVE vote
router.put('/:pollId/unvote', authenticateToken, async (req, res) => {
  try {
    const { category, optionName } = req.body;
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    const option = poll.categories[category]?.find(o => o.name === optionName);
    if (!option) return res.status(404).json({ error: 'Option not found' });

    option.votes = option.votes.filter(
      v => v.toString() !== req.userId
    );
    await poll.save();
    res.json(poll);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove vote' });
  }
});

module.exports = router;