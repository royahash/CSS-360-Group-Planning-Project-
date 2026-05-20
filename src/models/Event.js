const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  ticketmasterId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  venue: { type: String, default: '' },
  city: { type: String, default: '' },
  address: { type: String, default: '' },
  startDate: { type: String, required: true },
  endDate: { type: String, default: '' },

  owner: {
    type: String,
    default: 'You',
  },

  saved: {
    type: Boolean,
    default: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

module.exports = mongoose.model('Event', EventSchema);