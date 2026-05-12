/**
 * Unit Tests for poll.js
 * Event Explorer — Group Poll Feature
 *
 * Run with: npx jest poll.test.js
 */

const {
  createPoll,
  addPollOption,
  voteForOption,
  removeVote,
  getPollResults,
  hasUserVoted
} = require("../src/js/poll");

// ─────────────────────────────────────────────────────────────────────────────
describe("createPoll()", () => {

  test("creates a poll with date, time, location, and activity categories", () => {
    const poll = createPoll();

    expect(poll).toHaveProperty("dates");
    expect(poll).toHaveProperty("times");
    expect(poll).toHaveProperty("locations");
    expect(poll).toHaveProperty("activities");
  });

  test("starts each poll category as an empty array", () => {
    const poll = createPoll();

    expect(poll.dates).toEqual([]);
    expect(poll.times).toEqual([]);
    expect(poll.locations).toEqual([]);
    expect(poll.activities).toEqual([]);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe("addPollOption()", () => {

  test("adds a date option to the poll", () => {
    const poll = createPoll();

    addPollOption(poll, "dates", "May 15");

    expect(poll.dates[0].name).toBe("May 15");
  });

  test("adds a time option to the poll", () => {
    const poll = createPoll();

    addPollOption(poll, "times", "3:00 PM");

    expect(poll.times[0].name).toBe("3:00 PM");
  });

  test("adds a location option to the poll", () => {
    const poll = createPoll();

    addPollOption(poll, "locations", "Library");

    expect(poll.locations[0].name).toBe("Library");
  });

  test("adds an activity option to the poll", () => {
    const poll = createPoll();

    addPollOption(poll, "activities", "Dinner");

    expect(poll.activities[0].name).toBe("Dinner");
  });

  test("returns false when adding an option to an invalid category", () => {
    const poll = createPoll();

    const result = addPollOption(poll, "food", "Pizza");

    expect(result).toBe(false);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe("voteForOption()", () => {

  test("allows a user to vote for a poll option", () => {
    const poll = createPoll();

    addPollOption(poll, "activities", "Bowling");
    voteForOption(poll, "activities", "Bowling", "User1");

    expect(hasUserVoted(poll, "activities", "Bowling", "User1")).toBe(true);
  });

  test("returns true when a vote is successfully added", () => {
    const poll = createPoll();

    addPollOption(poll, "locations", "Cafe");
    const result = voteForOption(poll, "locations", "Cafe", "User1");

    expect(result).toBe(true);
  });

  test("returns false when voting for an option that does not exist", () => {
    const poll = createPoll();

    const result = voteForOption(poll, "dates", "May 20", "User1");

    expect(result).toBe(false);
  });

  test("does not allow the same user to vote twice for the same option", () => {
    const poll = createPoll();

    addPollOption(poll, "times", "5:00 PM");
    voteForOption(poll, "times", "5:00 PM", "User1");
    voteForOption(poll, "times", "5:00 PM", "User1");

    const results = getPollResults(poll, "times", "5:00 PM");

    expect(results).toBe(1);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe("removeVote()", () => {

  test("removes a user's vote from a poll option", () => {
    const poll = createPoll();

    addPollOption(poll, "activities", "Dinner");
    voteForOption(poll, "activities", "Dinner", "User1");

    removeVote(poll, "activities", "Dinner", "User1");

    expect(hasUserVoted(poll, "activities", "Dinner", "User1")).toBe(false);
  });

  test("returns true when a vote is successfully removed", () => {
    const poll = createPoll();

    addPollOption(poll, "dates", "May 16");
    voteForOption(poll, "dates", "May 16", "User1");

    const result = removeVote(poll, "dates", "May 16", "User1");

    expect(result).toBe(true);
  });

  test("returns false when removing a vote that does not exist", () => {
    const poll = createPoll();

    addPollOption(poll, "locations", "Park");

    const result = removeVote(poll, "locations", "Park", "User1");

    expect(result).toBe(false);
  });

});
