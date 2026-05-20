/* global CONFIG, handleSaveEvent, isEventSaved */

const params = new URLSearchParams(
  window.location.search
);

const eventId = params.get('id');

const eventTitle =
  params.get('title');

const API_KEY =
  CONFIG.TICKETMASTER_API_KEY;

const saveBtn =
  document.getElementById('save-btn');

async function loadEventDetails() {

  // =========================
  // TICKETMASTER EVENTS
  // =========================
  if (eventId) {

    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events/${eventId}.json?apikey=${API_KEY}`
    );

    const event =
      await response.json();

    document.querySelector(
      '.event-details-img'
    ).src =
      event.images[0].url;

    document.getElementById(
      'event-title'
    ).textContent =
      event.name;

    const venue =
      event._embedded?.venues?.[0];

    document.getElementById(
      'event-location'
    ).innerHTML = `
      <i class="fa-solid fa-location-dot" style="color:red;"></i>
      ${venue?.name || 'Unknown Venue'}
    `;

    document.getElementById(
      'event-date'
    ).innerHTML = `
      <i class="fa-solid fa-calendar" style="color:red;"></i>
      ${event.dates.start.localDate}
    `;
     // Category segment
    const segment = event.classifications?.[0]?.segment?.name;
    if (segment) {
      const categoryEl = document.createElement("p");
      categoryEl.id = "event-category";
      categoryEl.innerHTML = `
        <i class="fa-solid fa-tag" style="color:red;"></i>
        ${segment}
      `;
      document.getElementById("event-date").insertAdjacentElement("afterend", categoryEl);
    }

    document.getElementById(
      'event-description'
    ).innerHTML = `
      <p>
        ${event.info || 'No description available.'}
      </p>

      <br>

      <p>
        Enjoy a live experience with music,
        entertainment, food, and activities.
      </p>
    `;

    // =========================
    // INITIAL SAVE STATE
    // =========================
    const alreadySaved =
      await isEventSaved(event.id);

    if (alreadySaved) {
      saveBtn.textContent = 'Saved';

      saveBtn.style.background =
        '#a5d6a7';
    }

    // =========================
    // SAVE BUTTON
    // =========================
    saveBtn.addEventListener(
      'click',
      async () => {
        await handleSaveEvent(
          event,
          saveBtn
        );
      }
    );

    return;
  }

  // =========================
  // MOCK FRIEND EVENTS
  // =========================
  if (eventTitle) {

    const response =
      await fetch('/data/mockFriends.json');

    const friendEvents =
      await response.json();

    const event =
      friendEvents.find(
        (e) => e.title === eventTitle
      );

    if (!event) return;

    document.querySelector(
      '.event-details-img'
    ).src =
      event.image;

    document.getElementById(
      'event-title'
    ).textContent =
      event.title;

    document.getElementById(
      'event-location'
    ).innerHTML = `
      <i class="fa-solid fa-location-dot" style="color:red;"></i>
      ${event.location}
    `;

    document.getElementById(
      'event-date'
    ).innerHTML = `
      <i class="fa-solid fa-calendar" style="color:red;"></i>
      ${event.date}
    `;

    document.getElementById(
      'event-description'
    ).innerHTML = `
      <p>${event.description}</p>
    `;

    // Friend events should not be saved
    saveBtn.style.display = 'none';
  }
}

loadEventDetails();