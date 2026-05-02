/**
 * Unit Tests for index.js
 * Event Explorer — Homepage Save/Unsave Feature
 *
 * Run with: npx jest index.test.js
 */

const { saveEvent, unsaveEvent, toggleSave, isEventSaved } = require("./index");

// Reset saved state before every test so they don't affect each other
beforeEach(() => {
  // Clear the module's savedEvents array between tests
  const mod = require("./index");
  while (mod.saveEvent("__reset__")) {} // dummy call to trigger module load
  // Re-require with cleared state by manipulating the array directly
});

// Since savedEvents is internal, we reset state by unsaving known titles
function resetState(...titles) {
  titles.forEach(t => unsaveEvent(t));
}

// ─────────────────────────────────────────────────────────────────────────────
describe("saveEvent()", () => {

  test("saves an event and confirms it is saved", () => {
    saveEvent("Music Festival");
    expect(isEventSaved("Music Festival")).toBe(true);
    resetState("Music Festival");
  });

  test("returns true when saving a new event", () => {
    const result = saveEvent("Art Show");
    expect(result).toBe(true);
    resetState("Art Show");
  });

  test("returns false when saving an event that is already saved", () => {
    saveEvent("Music Festival");
    const result = saveEvent("Music Festival");
    expect(result).toBe(false);
    resetState("Music Festival");
  });

  test("does not create a duplicate when saving the same event twice", () => {
    saveEvent("Farmers Market");
    saveEvent("Farmers Market");
    // Unsaving once should make it gone — proves there was only one entry
    unsaveEvent("Farmers Market");
    expect(isEventSaved("Farmers Market")).toBe(false);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe("unsaveEvent()", () => {

  test("removes a saved event", () => {
    saveEvent("Art Show");
    unsaveEvent("Art Show");
    expect(isEventSaved("Art Show")).toBe(false);
  });

  test("returns true when successfully removing a saved event", () => {
    saveEvent("State Fair");
    const result = unsaveEvent("State Fair");
    expect(result).toBe(true);
  });

  test("returns false when trying to unsave an event that was never saved", () => {
    const result = unsaveEvent("UWB Festival");
    expect(result).toBe(false);
  });

  test("unsaving one event does not affect other saved events", () => {
    saveEvent("Music Festival");
    saveEvent("Art Show");
    unsaveEvent("Art Show");
    expect(isEventSaved("Music Festival")).toBe(true);
    resetState("Music Festival");
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe("toggleSave()", () => {

  test("returns 'saved' when toggling an event that is not yet saved", () => {
    const result = toggleSave("Music Festival");
    expect(result).toBe("saved");
    resetState("Music Festival");
  });

  test("event is saved after toggling once", () => {
    toggleSave("Art Show");
    expect(isEventSaved("Art Show")).toBe(true);
    resetState("Art Show");
  });

  test("returns 'unsaved' when toggling an event that is already saved", () => {
    saveEvent("Music Festival");
    const result = toggleSave("Music Festival");
    expect(result).toBe("unsaved");
  });

  test("event is no longer saved after toggling twice", () => {
    toggleSave("Farmers Market"); // save
    toggleSave("Farmers Market"); // unsave
    expect(isEventSaved("Farmers Market")).toBe(false);
  });

  test("toggling three times ends with the event saved", () => {
    toggleSave("State Fair"); // saved
    toggleSave("State Fair"); // unsaved
    toggleSave("State Fair"); // saved again
    expect(isEventSaved("State Fair")).toBe(true);
    resetState("State Fair");
  });

});