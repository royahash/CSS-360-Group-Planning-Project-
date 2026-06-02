document.addEventListener("DOMContentLoaded", function () {
  loadCalendarEvents();
});

async function loadCalendarEvents() {
  try {
    const response = await fetch("/api/calendar-events");
    const events = await response.json();

    if (!response.ok) {
      throw new Error(events.error || "Failed to load calendar events.");
    }

    renderCalendarEvents(events);
  } catch (error) {
    console.error("Calendar loading error:", error);

    const calendarContainer = getCalendarContainer();
    if (calendarContainer) {
      calendarContainer.innerHTML = `
        <p class="calendar-error">
          Could not load calendar events. Please make sure the backend server is running.
        </p>
      `;
    }
  }
}

function getCalendarContainer() {
  return (
    document.getElementById("calendarEvents") ||
    document.getElementById("calendar-events") ||
    document.getElementById("calendar") ||
    document.querySelector(".calendar") ||
    document.querySelector(".calendar-container")
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
    calendarContainer.innerHTML = `
      <p class="no-events-message">No events on your calendar yet.</p>
    `;
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

    eventCard.innerHTML = `
      <h3>${title}</h3>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>Status:</strong> <span class="event-status">${status}</span></p>
      ${
        description
          ? `<p><strong>Description:</strong> ${description}</p>`
          : ""
      }
    `;

    calendarContainer.appendChild(eventCard);
  });
}
