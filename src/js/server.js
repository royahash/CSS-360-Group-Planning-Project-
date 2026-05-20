require('dotenv').config();
const express = require('express');
const { Inngest } = require('inngest');
const { serve } = require('inngest/express');
const { Resend } = require('resend');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
const cors = require('cors'); 

const app = express();

app.use(cors());
app.use(express.json());

const inngest = new Inngest({ 
  id: "reminder-system",
  eventKey: process.env.INNGEST_EVENT_KEY || "local-key" 
});
const resend = new Resend(process.env.RESEND_API_KEY);

const schedule = [
    { name: "1 week", ms: 7 * 24 * 60 * 60 * 1000 },
    { name: "5 days", ms: 5 * 24 * 60 * 60 * 1000 },
    { name: "3 days", ms: 3 * 24 * 60 * 60 * 1000 },
    { name: "1 day", ms: 24 * 60 * 60 * 1000 },
    { name: "10 hours", ms: 10 * 60 * 60 * 1000 },
    { name: "5 hours", ms: 5 * 60 * 60 * 1000 },
    { name: "1 hour", ms: 60 * 60 * 1000 }
];

const eventReminderWorkflow = inngest.createFunction(
    { 
        id: "send-event-reminders",
        cancelOn: [{ event: "event/updated", match: "data.eventId" }],
        triggers: [{ event: "event/scheduled" }] 
    },
    async ({ event, step }) => {
        const { 
            eventName, 
            eventDate, 
            eventUsers, 
            eventDescription, 
            eventLocation, 
            eventURL       
        } = event.data;

        const validSchedule = await step.run("calculate-schedule", () => {
            const now = dayjs.utc();
            const eventTime = dayjs.utc(eventDate);
        
            return schedule.filter(offset => {
                const triggerTime = eventTime.subtract(offset.ms, 'millisecond');
                return triggerTime.isAfter(now);
            });
        });

        for (const offset of validSchedule) {
            const triggerTime = dayjs.utc(eventDate).subtract(offset.ms, 'millisecond');

            
            await step.sleepUntil(`wait-for-${offset.name}`, triggerTime.toDate());

            await step.run(`send-email-${offset.name}`, async () => {
    
                const formattedDate = dayjs(eventDate).format('dddd, MMMM D, YYYY');
                const formattedTime = dayjs(eventDate).format('h:mm A');

                return await resend.emails.send({
                    from: 'onboarding@resend.dev',
                    to: eventUsers[0].email,
                    subject: `Reminder: ${eventName} is coming up!`,
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
                            <h2>Event Reminder: ${eventName}</h2>
                            <p>You have an upcoming event scheduled. Here are the details:</p>
                
                            <ul style="list-style: none; padding-left: 0; line-height: 1.6;">
                                <li><strong>Description:</strong> ${eventDescription || 'Not specified'}</li>
                                <li><strong>Location:</strong> ${eventLocation || 'Not specified'}</li>
                                <li><strong>Date:</strong> ${formattedDate}</li>
                                <li><strong>Time:</strong> ${formattedTime} UTC</li> 
                            </ul>
                
                            <div style="margin-top: 20px;">
                                <a href="${eventURL}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
                                    View Event on Website
                                </a>
                            </div>
                        </div>
                    `
                });
            });
        }
    }
);

app.use("/api/inngest", serve({ client: inngest, functions: [eventReminderWorkflow] }));

// Route to trigger the reminder (Call this when saving an event)
app.post("/api/schedule-event", async (req, res) => {
    try {
        const { eventName, eventDate } = req.body;
        
        // Add this check!
        if (!eventName || !eventDate) {
            throw new Error("Missing required event data");
        }

        await inngest.send({
            name: "event/scheduled",
            data: req.body
        });

        res.status(200).send({ message: "Reminder system scheduled!" });
    } catch (error) {
        console.error("DEBUG ERROR:", error); 
        res.status(500).send({ error: error.message });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));


module.exports = app;
