require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const { Inngest } = require('inngest');
const { serve } = require('inngest/express');
const { Resend } = require('resend');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');

dayjs.extend(utc);

const Event = require('./models/Event');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'src')));

// ── MongoDB Connection ────────────────────────────────────────────────────

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// ── Inngest + Resend ──────────────────────────────────────────────────────

const inngest = new Inngest({
  id: 'reminder-system',
  eventKey: process.env.INNGEST_EVENT_KEY || 'local-key'
});

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Reminder Schedule ─────────────────────────────────────────────────────

const reminderSchedule = [
  { name: '1 week', ms: 7 * 24 * 60 * 60 * 1000 },
  { name: '5 days', ms: 5 * 24 * 60 * 60 * 1000 },
  { name: '3 days', ms: 3 * 24 * 60 * 60 * 1000 },
  { name: '1 day', ms: 24 * 60 * 60 * 1000 },
  { name: '10 hours', ms: 10 * 60 * 60 * 1000 },
  { name: '5 hours', ms: 5 * 60 * 60 * 1000 },
  { name: '1 hour', ms: 60 * 60 * 1000 }
];

function getWeeklyReminderDates(eventTime) {

  const now = dayjs.utc();

  const reminders = [];

  let current = eventTime.subtract(14, 'day');

  while (current.isAfter(now)) {

    reminders.push(current);

    current = current.subtract(7, 'day');
  }

  return reminders;
}

// ── Reminder Workflow ─────────────────────────────────────────────────────

const eventReminderWorkflow = inngest.createFunction(

  {
    id: 'send-event-reminders',

    cancelOn: [
      {
        event: 'event/updated',
        match: 'data.eventId'
      }
    ],

    triggers: [
      {
        event: 'event/scheduled'
      }
    ]
  },

  async ({ event, step }) => {

    const {

      eventId,
      eventName,
      eventDate,
      eventUsers,
      eventDescription,
      eventLocation,
      eventURL

    } = event.data;

    const eventTime = dayjs.utc(eventDate);

    const now = dayjs.utc();

    if (!eventTime.isValid()) {
      return;
    }

    // Weekly reminders
    const weeklyReminders =
      getWeeklyReminderDates(eventTime);

    for (const reminderDate of weeklyReminders) {

      await step.sleepUntil(
        `weekly-${reminderDate.toISOString()}`,
        reminderDate.toDate()
      );

      await sendReminder('Weekly Reminder');
    }

    // Scheduled reminders
    for (const offset of reminderSchedule) {

      const triggerTime =
        eventTime.subtract(offset.ms, 'millisecond');

      if (triggerTime.isBefore(now)) {
        continue;
      }

      await step.sleepUntil(
        `wait-${offset.name}`,
        triggerTime.toDate()
      );

      await sendReminder(offset.name);
    }

    async function sendReminder(reminderType) {

      const formattedDate =
        dayjs(eventDate)
          .format('dddd, MMMM D, YYYY');

      const formattedTime =
        dayjs(eventDate)
          .format('h:mm A');

      const emailedUsers = new Set();

      for (const user of eventUsers || []) {

        if (!user.email) continue;

        // Prevent duplicate emails
        if (emailedUsers.has(user.email)) {
          continue;
        }

        emailedUsers.add(user.email);

        await resend.emails.send({

          from: 'onboarding@resend.dev',

          to: user.email,

          subject:
            `Reminder: ${eventName} is coming up!`,

          html: `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              color: #333;
            ">

              <h2>${eventName}</h2>

              <p>
                This is your
                ${reminderType.toLowerCase()} reminder.
              </p>

              <ul style="
                line-height: 1.8;
                padding-left: 20px;
              ">

                <li>
                  <strong>Activity:</strong>
                  ${eventDescription || 'N/A'}
                </li>

                <li>
                  <strong>Location:</strong>
                  ${eventLocation || 'N/A'}
                </li>

                <li>
                  <strong>Date:</strong>
                  ${formattedDate}
                </li>

                <li>
                  <strong>Time:</strong>
                  ${formattedTime}
                </li>

              </ul>

              <a
                href="${eventURL}"
                style="
                  display: inline-block;
                  margin-top: 15px;
                  padding: 10px 16px;
                  background-color: #007bff;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                "
              >
                View Event
              </a>

            </div>
          `
        });
      }
    }
  }
);

// ── API ROUTES ────────────────────────────────────────────────────────────

// GET all events
app.get('/api/events', async (req, res) => {

  try {

    const events = await Event.find();

    res.json(events);

  } catch (error) {

    res.status(500).json({
      error: 'Failed to fetch events'
    });
  }
});

// GET single event
app.get('/api/events/:ticketmasterId', async (req, res) => {

  try {

    const event = await Event.findOne({
      ticketmasterId: req.params.ticketmasterId
    });

    if (!event) {

      return res.status(404).json({
        error: 'Event not found'
      });
    }

    res.json(event);

  } catch (error) {

    res.status(500).json({
      error: 'Failed to fetch event'
    });
  }
});

// SAVE event
app.post('/api/events', async (req, res) => {

  try {

    if (!req.body.startDate || !req.body.startTime) {

      return res.status(400).json({
        error: 'Event must include date and time'
      });
    }

    const fullDateTime =
      `${req.body.startDate}T${req.body.startTime}`;

    const newEvent = new Event(req.body);

    await newEvent.save();

    // Schedule reminders
    await inngest.send({

      name: 'event/scheduled',

      data: {

        eventId:
          newEvent._id.toString(),

        eventName:
          newEvent.title,

        eventDate:
          fullDateTime,

        eventUsers:
          newEvent.users || [],

        eventDescription:
          newEvent.description,

        eventLocation:
          `${newEvent.venue}, ${newEvent.city}`,

        eventURL:
          newEvent.eventURL
      }
    });

    res.status(201).json(newEvent);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Failed to save event'
    });
  }
});

// UPDATE event
app.put('/api/events/:id', async (req, res) => {

  try {

    const updatedEvent =
      await Event.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    if (!updatedEvent) {

      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // Cancel previous reminders
    await inngest.send({

      name: 'event/updated',

      data: {
        eventId:
          updatedEvent._id.toString()
      }
    });

    // Reschedule reminders
    await inngest.send({

      name: 'event/scheduled',

      data: {

        eventId:
          updatedEvent._id.toString(),

        eventName:
          updatedEvent.title,

        eventDate:
          `${updatedEvent.startDate}T${updatedEvent.startTime}`,

        eventUsers:
          updatedEvent.users || [],

        eventDescription:
          updatedEvent.description,

        eventLocation:
          `${updatedEvent.venue}, ${updatedEvent.city}`,

        eventURL:
          updatedEvent.eventURL
      }
    });

    res.json(updatedEvent);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Failed to update event'
    });
  }
});

// DELETE event
app.delete('/api/events/:ticketmasterId', async (req, res) => {

  try {

    const deletedEvent =
      await Event.findOneAndDelete({

        ticketmasterId:
          req.params.ticketmasterId
      });

    if (!deletedEvent) {

      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // Cancel reminders
    await inngest.send({

      name: 'event/updated',

      data: {

        eventId:
          deletedEvent._id.toString()
      }
    });

    res.json({
      message:
        'Event deleted and reminders cancelled'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        'Failed to delete event'
    });
  }
});

// ── Inngest Route ─────────────────────────────────────────────────────────

app.use(
  '/api/inngest',

  serve({
    client: inngest,
    functions: [eventReminderWorkflow]
  })
);

// ── Fallback Route ────────────────────────────────────────────────────────

app.get('/', (req, res) => {

  res.sendFile(
    path.join(__dirname, 'src/html/index.html')
  );
});

// ── Start Server ──────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
