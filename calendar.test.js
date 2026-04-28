// calendar.test.js

const {
  shouldShowEvent,
  getActiveCalendars,
  toggleAll,
  getEventsForDate
} = require('./calendarLogic');

describe("Calendar Logic Tests", () => {

  test("shouldShowEvent returns true if owner is active", () => {
    const event = { owner: "Alex" };
    const active = ["You", "Alex"];
    expect(shouldShowEvent(event, active)).toBe(true);
  });

  test("shouldShowEvent returns false if owner not active", () => {
    const event = { owner: "Jordan" };
    const active = ["You"];
    expect(shouldShowEvent(event, active)).toBe(false);
  });

  test("getActiveCalendars returns only checked users", () => {
    const checkboxes = {
      You: true,
      Alex: false,
      Jordan: true
    };

    const result = getActiveCalendars(checkboxes);
    expect(result).toEqual(["You", "Jordan"]);
  });

  test("toggleAll sets all users to true", () => {
    const checkboxes = {
      You: false,
      Alex: false
    };

    const result = toggleAll(checkboxes, true);
    expect(result).toEqual({
      You: true,
      Alex: true
    });
  });

  test("getEventsForDate filters events correctly", () => {
    const events = [
      { title: "Music Festival", date: "2026-04-22", owner: "You" },
      { title: "Art Show", date: "2026-04-25", owner: "Alex" },
      { title: "Study Group", date: "2026-04-22", owner: "Jordan" }
    ];

    const result = getEventsForDate(events, "2026-04-22", ["You"]);

    expect(result).toEqual([
      { title: "Music Festival", date: "2026-04-22", owner: "You" }
    ]);
  });

});