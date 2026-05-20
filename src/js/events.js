/**
 * events.js
 * Fetches real events from Ticketmaster API and builds event cards
 * on the homepage dynamically.
 */
/* global CONFIG, handleSaveEvent, isEventSaved */
// ── Config ─────────────────────────────────────────────────────────────────
// TODO: Move API_KEY to backend server before production deployment
// Do not commit this file with a real key - move to .env
const API_KEY = (typeof CONFIG !== "undefined") ? CONFIG.TICKETMASTER_API_KEY : "test_key";
//if CONFIG exists use the real key, otherwise use the placeholder string test_key. During testing Jest will use test_key. 
//const CITY = "Seattle";
let currentSort = "date,asc";
function getCurrentSort() { return currentSort; }
//const API_URL = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&latlong=47.6062,-122.3321&radius=30&unit=miles&size=100&expand=venues`;
function getApiUrl() {  //builds the URL fresh each time using whatever sort is current
  return `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&latlong=47.6062,-122.3321&radius=30&unit=miles&size=100&expand=venues&sort=${currentSort}`; // tracks which sort is active
}
/*Ticketmaster handles the actual sorting on their end — date,asc means soonest events first, onSaleStartDate,desc means most recently listed events first*/

function setSort(sortValue) { //updates the sort, highlights the active button in green, and reloads the events
  currentSort = sortValue;

  // Update active button styling
  document.querySelectorAll(".sort-btn").forEach(btn => {
    btn.classList.remove("active-sort");
  });
  document.getElementById(
    sortValue === "date,asc" ? "sort-date" : "sort-newest"
  ).classList.add("active-sort");

  // Reload events with new sort
  loadEvents();

}

// ── Build one event card from Ticketmaster data ────────────────────────────
function buildEventCard(event) {
  // Find a 16:9 image or fall back to the first available
  const image = event.images
  .filter(img => img.ratio === "16_9") //collects ALL the 16_9 images into a list
  .sort((a, b) => b.width - a.width)[0] || event.images[0]; // sorts them from widest to narrowest and piks the first one

  // Get date
  const date = event.dates.start.localDate;

  // Get venue - lives inside _embedded.venues[0]
  const venue = event._embedded && event._embedded.venues && event._embedded.venues[0];
  const city = venue ? venue.city.name + ", " + venue.state.stateCode : "Seattle, WA";
  const venueName = venue ? venue.name : "";

  // Build the card element
  const card = document.createElement("div");
  card.className = "event-card";
  card.style.cursor = "pointer";

  card.innerHTML = `
    <img src="${image.url}" alt="${event.name}">
    <div class="card-title-row">
      <h3>${event.name}</h3>
      <button class="card-btn" onclick="event.stopPropagation()">Save</button>
    </div>
    <p>${venueName}</p> 
    <p>${city}</p>
    <p>${date}</p>
  `;

  card.addEventListener("click", () => {
    window.location.href = `event.html?id=${event.id}`;
  });

  const btn = card.querySelector(".card-btn");

  // LOAD INITIAL BUTTON STATE
  isEventSaved(event.id).then(saved => {
    if (saved) {
      btn.textContent = "Saved";
      btn.style.background = "#a5d6a7";
    }
  });

  // SAVE / UNSAVE
  btn.addEventListener("click", async () => {
    await handleSaveEvent(event, btn);
  });

  return card;
}

// ── Fetch events and display them ──────────────────────────────────────────
function loadEvents() {
  const container = document.querySelector(".event-container");
  
  // Show loading message while we wait
  container.innerHTML = "<p>Loading events...</p>";

  return fetch(getApiUrl())
    .then(response => response.json())
    .then(data => {
      // Clear the loading message
      container.innerHTML = "";

      // Get the events array from the response
      const events = data._embedded.events;
      const uniqueEvents = events.filter((event, index, self) =>
        index === self.findIndex(e => e.name === event.name)
      );
      const shuffled = uniqueEvents.sort(() => Math.random() - 0.5);
      const twelveEvents = shuffled.slice(0, 12);

      // Build a card for each event and add it to the page
      twelveEvents.forEach(event => {
        const card = buildEventCard(event);
        container.appendChild(card);
      });
    })
    .catch(error => {
      container.innerHTML = "<p>Failed to load events. Please try again later.</p>";
      console.error("Error fetching events:", error);
    });
}

// ── Run when page loads ────────────────────────────────────────────────────
if (typeof window !== "undefined" && typeof module === "undefined") {
  loadEvents();
}

// ── Exports (for Jest tests) ──────────────────────────────────────────────
if (typeof module !== "undefined") {
  module.exports = { getApiUrl, buildEventCard, loadEvents, setSort, getCurrentSort };
}