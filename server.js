require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const path     = require('path');
const cors     = require('cors');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));

// ── MongoDB ───────────────────────────────────────────────────────────────
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set. Copy .env.example to .env and add your connection string.');
} else {
  mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err.message));
}

// ── Routes ────────────────────────────────────────────────────────────────
const { router: authRouter }  = require('./src/routes/authRoutes');
const eventRouter              = require('./src/routes/eventRoutes');
const friendRouter             = require('./src/routes/friendRoutes');
const eventRequestRouter       = require('./src/routes/eventRequestRoutes');
const pollRouter               = require('./src/routes/pollRoutes');
const calendarRouter           = require('./src/routes/calendarRoutes');
const preferenceRouter         = require('./src/routes/preferenceRoutes');

app.use('/api/auth',           authRouter);
app.use('/api/events',         eventRouter);
app.use('/api/friends',        friendRouter);
app.use('/api/event-requests', eventRequestRouter);
app.use('/api/polls',          pollRouter);
app.use('/api/calendar',       calendarRouter);
app.use('/api/preferences',    preferenceRouter);

// ── Fallback (Express 5 requires a named wildcard, not '*') ───────────────
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));