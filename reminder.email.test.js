const request = require('supertest');
const app = require('./server');
let server;

describe('POST /api/schedule-event', () => {
    
    test('it should schedule a reminder for a valid event', async () => {
        const mockEvent = {
            eventId: "test-001",
            eventName: "Project Deadline",
            eventDate: "2026-06-01T10:00:00Z",
            eventUsers: [{ username: "Iliya", email: "test@example.com" }]
        };

        const response = await request(app)
            .post('/api/schedule-event')
            .send(mockEvent);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Reminder system scheduled!");
    });

    test('it should fail when event data is missing', async () => {
        const invalidEvent = { name: "Missing everything else" };
        
        const response = await request(app)
            .post('/api/schedule-event')
            .send(invalidEvent);

        expect(response.status).toBe(500); 
    });
});

const dayjs = require('dayjs');

describe('Reminder timing calculations', () => {
    test('should calculate 1 week before correctly', () => {
        const eventDate = dayjs("2026-06-01T10:00:00Z");
        const oneWeekBefore = eventDate.subtract(7, 'days');
        
        expect(oneWeekBefore.toISOString()).toBe("2026-05-25T10:00:00.000Z");
    });

    test('should calculate 10 hours before correctly', () => {
        const eventDate = dayjs("2026-06-01T10:00:00Z");
        const tenHoursBefore = eventDate.subtract(10, 'hours');
        
        expect(tenHoursBefore.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    });
});

describe("Email sending logic", () => {
    it("should trigger an email immediately for an event scheduled 1 hour from now", async () => {
    // 1. Set the date to 1 hour + 5 seconds from now
    const mockUsers = [
    {username: "ABCDE", email: "iliyahosseini05@gmail.com", userID: 1},
    {username: "ZYXWV", email: "iliyahosseini05@gmail.com", userID: 2}
    ]; 
    const imminentDate = dayjs().add(1, 'hour').add(5, 'seconds').toISOString();

    const mockEvent = {
        eventName: "Party", 
        eventLocation: "2495 Raccoon Run", 
        eventDescription: "A party to celebrate Mary's promotion!", 
        eventDate: imminentDate, 
        eventUsers: mockUsers, 
        eventURL: "event.html", 
        eventID: 1
    };

    /*
    const imminentEvent = {
        eventName: "Urgent Test",
        eventDate: imminentDate,
        eventUsers: [{ username: "Iliya", email: "iliyahosseini05@gmail.com" },
            {username: "Robux", email: "iliyahosseini05@gmail.com"}
        ],
        eventDescription: "Test the email flow!",
        eventURL: "http://test.com"
    };
    */
    await request(app)
        .post("/api/schedule-event")
        .send(mockEvent);
    });
});

afterAll((done) => {
    if (server) {
        server.close(done);
    } else {
        done();
    }
});

beforeAll((done) => {
    server = app.listen(0, done);
});