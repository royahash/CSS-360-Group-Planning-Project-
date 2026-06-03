document.addEventListener("DOMContentLoaded", function () {
  loadCalendarEvents();
});

async function loadCalendarEvents() {
  try {
    const response = await fetch("/api/calendar-events", {
      credentials: "include"
    });

    if (response.status === 401) {
      showCalendarMessage("Please log in to view your calendar.");
      return;
    }

    const events = await response.json();

    if (!response.ok) {
      throw new Error(events.error || "Failed to load calendar events.");
    }

    renderCalendarEvents(events);
  } catch (error) {
    console.error("Calendar loading error:", error);
    showCalendarMessage(
      "Could not load calendar events. Please make sure the backend server is running."
    );
  }
}

function getCalendarContainer() {
  return (
    document.getElementById("calendarEvents") ||
    document.getElementById("calendar-events") ||
    document.getElementById("calendar") ||
    document.querySelector(".calendar-container") ||
    document.querySelector(".calendar")
  );
}

function renderCalendarEvents(events) {
  const calendarContainer = getCalendarContainer();

  if (!calendarContainer) {
    console.error("Calendar container not found.");
    return;
  }

  calendarContainer.innerHTML = "";

  if (!events || events.length === 0) {
    showCalendarMessage("No events on your calendar yet.");
    return;
  }

  events.forEach(function (event) {
    const eventCard = document.createElement("div");

    eventCard.classList.add("calendar-event-card");

    if (event.status === "pending") {
      eventCard.classList.add("pending-event");
    } else if (event.status === "confirmed") {
      eventCard.classList.add("confirmed-event");
    } else if (event.status === "declined") {
      eventCard.classList.add("declined-event");
    }

    const title = event.title || "Untitled Event";
    const date = event.startDate || event.date || "No date listed";
    const time = event.startTime || event.time || "No time listed";
    const location = event.location || event.venue || "No location listed";
    const description = event.description || "";
    const status = event.status || "pending";
    const source =
      event.source === "event-request" ? "Event Request" : "Saved Event";
    const owner = event.owner || "You";

    eventCard.innerHTML = `
      <h3>${escapeHTML(title)}</h3>
      <p><strong>Date:</strong> ${escapeHTML(date)}</p>
      <p><strong>Time:</strong> ${escapeHTML(time)}</p>
      <p><strong>Location:</strong> ${escapeHTML(location)}</p>
      <p><strong>Status:</strong> <span class="event-status">${escapeHTML(status)}</span></p>
      <p><strong>Source:</strong> ${escapeHTML(source)}</p>
      <p><strong>Owner:</strong> ${escapeHTML(owner)}</p>
      ${
        description
          ? `<p><strong>Description:</strong> ${escapeHTML(description)}</p>`
          : ""
      }
    `;

    calendarContainer.appendChild(eventCard);
  });
}

function showCalendarMessage(message) {
  const calendarContainer = getCalendarContainer();

  if (calendarContainer) {
    calendarContainer.innerHTML = `
      <p class="no-events-message">${escapeHTML(message)}</p>
    `;
  }
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
