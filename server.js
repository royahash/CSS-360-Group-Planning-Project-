require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');
const cors     = require('cors');

const app = express();

const htmlDir = path.join(__dirname, 'src', 'html');

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Ticketmaster key for the browser (optional; set TICKETMASTER_API_KEY in .env)
app.get('/js/config.js', (req, res) => {
  const key = process.env.TICKETMASTER_API_KEY || '';
  res.type('application/javascript');
  res.send(`const CONFIG = { TICKETMASTER_API_KEY: ${JSON.stringify(key)} };`);
});

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

// ── HTML routing (pages expect to live under /html/ for relative asset paths) ─
app.get('/', (req, res) => {
  res.redirect('/html/index.html');
});

app.get('/:page.html', (req, res, next) => {
  const filePath = path.join(htmlDir, `${req.params.page}.html`);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));