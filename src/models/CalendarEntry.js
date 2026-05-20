const mongoose = require('mongoose');

const calendarEntrySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  date: { 
    type: String, 
    required: true 
  },
  time: { 
    type: String, 
    default: '' 
  },
  location: { 
    type: String, 
    default: '' 
  },
  sourceType: { 
    type: String, 
    enum: ['ticketmaster', 'friend', 'manual', 'request'], 
    required: true 
  },
  sourceId: { 
    type: String, 
    default: '' 
  },
  owner: { 
    type: String, 
    default: 'You' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('CalendarEntry', calendarEntrySchema);