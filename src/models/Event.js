const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  ticketmasterId: String,

  title: String,

  description: String,

  image: String,

  venue: String,

  city: String,

  address: String,

  startDate: String,

  endDate: String,

  owner: {
    type: String,
    default: 'You',
  },

  saved: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('Event', EventSchema);