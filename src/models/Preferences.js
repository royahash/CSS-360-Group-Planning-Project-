const mongoose = require('mongoose');

const preferencesSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  interests: { 
    type: [String], 
    default: [] 
  },
  location: {
    city:  { type: String, default: '' },
    state: { type: String, default: '' },
    lat:   { type: Number, default: 47.6062 },
    lng:   { type: Number, default: -122.3321 }
  },
  searchRadius: { 
    type: Number, 
    default: 30 
  },
  defaultCalView: { 
    type: String, 
    enum: ['month', 'week'], 
    default: 'month' 
  }
});

module.exports = mongoose.model('Preferences', preferencesSchema);