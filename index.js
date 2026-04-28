/**
 * index.js
 * Homepage logic for Event Explorer
 * Handles saving and unsaving events when the Save button is clicked.
 */

// ── State ──────────────────────────────────────────────────────────────────
let savedEvents = []; // array of saved event titles

// ── Core Functions ─────────────────────────────────────────────────────────

/**
 * Save an event by title.
 * Returns true if added, false if it was already saved (no duplicates).
 */
function saveEvent(title) {
  if (savedEvents.includes(title)) return false;
  savedEvents.push(title);
  return true;
}

/**
 * Unsave an event by title.
 * Returns true if removed, false if it wasn't saved.
 */
function unsaveEvent(title) {
  if (!savedEvents.includes(title)) return false;
  savedEvents = savedEvents.filter(e => e !== title);
  return true;
}

/**
 * Toggle save state of an event.
 * Returns "saved" if it was just saved, "unsaved" if it was just unsaved.
 */
function toggleSave(title) {
  if (savedEvents.includes(title)) {
    unsaveEvent(title);
    return "unsaved";
  } else {
    saveEvent(title);
    return "saved";
  }
}

/**
 * Returns true if the event is currently saved.
 */
function isEventSaved(title) {
  return savedEvents.includes(title);
}

// ── DOM Logic (only runs in the browser, not during tests) ─────────────────
if (typeof document !== "undefined") {
  const cards = document.querySelectorAll(".event-card");

  cards.forEach(card => {
    const title = card.querySelector("h3").innerText;
    const btn = card.querySelector(".card-btn");

    btn.addEventListener("click", () => {
      const result = toggleSave(title);
      if (result === "saved") {
        btn.innerText = "Saved ✓";
        btn.style.background = "#a5d6a7";
      } else {
        btn.innerText = "Save";
        btn.style.background = "";
      }
    });
  });
}

// ── Exports (for Jest tests) ───────────────────────────────────────────────
if (typeof module !== "undefined") {
  module.exports = { saveEvent, unsaveEvent, toggleSave, isEventSaved };
}