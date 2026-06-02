require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// This allows Express to serve your HTML, CSS, and JS files from the project root
app.use(express.static(__dirname));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    console.error("Make sure MONGODB_URI is set in your .env file.");
  });

// Event Request Schema
const eventRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    startDate: {
      type: String,
      required: true
    },
    startTime: {
      type: String,
      default: ""
    },
    location: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      default: ""
    },
    visibility: {
      type: String,
      enum: ["friends-only", "selected-users"],
      default: "friends-only"
    },
    invitedUsers: {
      type: [String],
      default: []
    },
    invitedGroups: {
      type: [String],
      default: []
    },
    reminderEnabled: {
      type: Boolean,
      default: false
    },
    reminderMinutesBefore: {
      type: Number,
      default: 30
    },
    notificationSystem: {
      type: String,
      default: "iliya-reminders"
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "declined"],
      default: "pending"
    },
    pollOptions: {
      dates: {
        type: [String],
        default: []
      },
      times: {
        type: [String],
        default: []
      },
      locations: {
        type: [String],
        default: []
      },
      activities: {
        type: [String],
        default: []
      }
    },
    responses: [
      {
        user: {
          type: String,
          default: ""
        },
        responseStatus: {
          type: String,
          enum: ["accepted", "declined", "voted"],
          required: true
        },
        votes: {
          date: {
            type: String,
            default: ""
          },
          time: {
            type: String,
            default: ""
          },
          location: {
            type: String,
            default: ""
          },
          activity: {
            type: String,
            default: ""
          }
        },
        respondedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

const EventRequest = mongoose.model("EventRequest", eventRequestSchema);

// Page routes
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/index.html", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/event-request.html", function (req, res) {
  res.sendFile(path.join(__dirname, "event-request.html"));
});

app.get("/calendar.html", function (req, res) {
  res.sendFile(path.join(__dirname, "calendar.html"));
});

app.get("/profile.html", function (req, res) {
  res.sendFile(path.join(__dirname, "profile.html"));
});

app.get("/onboarding.html", function (req, res) {
  res.sendFile(path.join(__dirname, "onboarding.html"));
});

app.get("/Event-details.html", function (req, res) {
  res.sendFile(path.join(__dirname, "Event-details.html"));
});

// Create a new event request
app.post("/api/event-requests", async function (req, res) {
  try {
    const {
      title,
      startDate,
      startTime,
      location,
      description,
      visibility,
      invitedUsers,
      invitedGroups,
      reminderEnabled,
      reminderMinutesBefore,
      pollOptions
    } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({
        error: "Event title and date are required."
      });
    }

    const newEventRequest = new EventRequest({
      title,
      startDate,
      startTime,
      location,
      description,
      visibility: visibility || "friends-only",
      invitedUsers: Array.isArray(invitedUsers) ? invitedUsers : [],
      invitedGroups: Array.isArray(invitedGroups) ? invitedGroups : [],
      reminderEnabled: Boolean(reminderEnabled),
      reminderMinutesBefore: reminderMinutesBefore || 30,
      notificationSystem: "iliya-reminders",
      status: "pending",
      pollOptions: pollOptions || {
        dates: [],
        times: [],
        locations: [],
        activities: []
      }
    });

    await newEventRequest.save();

    res.status(201).json({
      message: "Event request created successfully.",
      eventRequest: newEventRequest
    });
  } catch (error) {
    console.error("Error creating event request:", error);
    res.status(500).json({
      error: "Failed to create event request."
    });
  }
});

// Get all event requests
app.get("/api/event-requests", async function (req, res) {
  try {
    const eventRequests = await EventRequest.find().sort({ createdAt: -1 });

    res.json(eventRequests);
  } catch (error) {
    console.error("Error fetching event requests:", error);
    res.status(500).json({
      error: "Failed to fetch event requests."
    });
  }
});

// Get calendar events from event requests
app.get("/api/calendar-events", async function (req, res) {
  try {
    const eventRequests = await EventRequest.find().sort({ createdAt: -1 });

    const calendarEvents = eventRequests.map(function (eventRequest) {
      return {
        id: eventRequest._id,
        title: eventRequest.title,
        startDate: eventRequest.startDate,
        startTime: eventRequest.startTime,
        location: eventRequest.location,
        description: eventRequest.description,
        visibility: eventRequest.visibility,
        invitedUsers: eventRequest.invitedUsers,
        invitedGroups: eventRequest.invitedGroups,
        reminderEnabled: eventRequest.reminderEnabled,
        reminderMinutesBefore: eventRequest.reminderMinutesBefore,
        notificationSystem: eventRequest.notificationSystem,
        status: eventRequest.status || "pending",
        pollOptions: eventRequest.pollOptions,
        responses: eventRequest.responses,
        source: "event-request"
      };
    });

    res.json(calendarEvents);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({
      error: "Failed to fetch calendar events."
    });
  }
});

// Respond to an event request
app.patch("/api/event-requests/:id/respond", async function (req, res) {
  try {
    const { responseStatus, votes, user } = req.body;

    if (!["accepted", "declined", "voted"].includes(responseStatus)) {
      return res.status(400).json({
        error: "Response must be accepted, declined, or voted."
      });
    }

    const eventRequest = await EventRequest.findById(req.params.id);

    if (!eventRequest) {
      return res.status(404).json({
        error: "Event request not found."
      });
    }

    eventRequest.responses.push({
      user: user || "Guest User",
      responseStatus,
      votes: votes || {},
      respondedAt: new Date()
    });

    if (responseStatus === "accepted") {
      eventRequest.status = "confirmed";
    }

    if (responseStatus === "declined") {
      eventRequest.status = "declined";
    }

    await eventRequest.save();

    res.json({
      message: "Response saved successfully.",
      eventRequest
    });
  } catch (error) {
    console.error("Error saving response:", error);
    res.status(500).json({
      error: "Failed to save response."
    });
  }
});

// Update event request status
app.patch("/api/event-requests/:id/status", async function (req, res) {
  try {
    const { status } = req.body;

    if (!["pending", "confirmed", "declined"].includes(status)) {
      return res.status(400).json({
        error: "Status must be pending, confirmed, or declined."
      });
    }

    const eventRequest = await EventRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!eventRequest) {
      return res.status(404).json({
        error: "Event request not found."
      });
    }

    res.json({
      message: "Event request status updated successfully.",
      eventRequest
    });
  } catch (error) {
    console.error("Error updating event request status:", error);
    res.status(500).json({
      error: "Failed to update event request status."
    });
  }
});

// Update reminder settings
app.patch("/api/event-requests/:id/reminders", async function (req, res) {
  try {
    const { reminderEnabled, reminderMinutesBefore } = req.body;

    const eventRequest = await EventRequest.findByIdAndUpdate(
      req.params.id,
      {
        reminderEnabled: Boolean(reminderEnabled),
        reminderMinutesBefore: reminderMinutesBefore || 30,
        notificationSystem: "iliya-reminders"
      },
      { new: true }
    );

    if (!eventRequest) {
      return res.status(404).json({
        error: "Event request not found."
      });
    }

    res.json({
      message: "Reminder settings updated successfully.",
      eventRequest
    });
  } catch (error) {
    console.error("Error updating reminders:", error);
    res.status(500).json({
      error: "Failed to update reminder settings."
    });
  }
});

// Delete an event request
app.delete("/api/event-requests/:id", async function (req, res) {
  try {
    const eventRequest = await EventRequest.findByIdAndDelete(req.params.id);

    if (!eventRequest) {
      return res.status(404).json({
        error: "Event request not found."
      });
    }

    res.json({
      message: "Event request deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting event request:", error);
    res.status(500).json({
      error: "Failed to delete event request."
    });
  }
});

// Example friends route for friend dropdown
app.get("/api/friends", function (req, res) {
  res.json({
    friends: ["Alex", "Jordan", "Group"]
  });
});

// Start server
app.listen(PORT, function () {
  console.log(`Server running on http://localhost:${PORT}`);
});
