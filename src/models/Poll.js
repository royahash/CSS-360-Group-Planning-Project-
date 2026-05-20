const mongoose = require('mongoose');

const voteOptionSchema = new mongoose.Schema({
  name: String,
  votes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }]
});

const pollSchema = new mongoose.Schema({
  eventRequestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'EventRequest' 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  categories: {
    dates:      { type: [voteOptionSchema], default: [] },
    times:      { type: [voteOptionSchema], default: [] },
    locations:  { type: [voteOptionSchema], default: [] },
    activities: { type: [voteOptionSchema], default: [] }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Poll', pollSchema);