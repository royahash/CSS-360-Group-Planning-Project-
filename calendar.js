const calendarEl = document.getElementById("calendar");

let currentView = "month";

let activeCalendars = ["You", "Alex", "Jordan", "Group"];

// MOCK EVENTS
const events = [
  { title: "Music Festival", date: "2026-04-22", owner: "You" },
  { title: "Art Show", date: "2026-04-25", owner: "Alex" },
  { title: "Study Group", date: "2026-04-24", owner: "Jordan" },
  { title: "Farmers Market", date: "2026-04-27", owner: "You" }
];

// GET COLORS FROM CSS
function getColor(variable) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
}

const ownerColors = {
  "You": () => getColor("--color-you"),
  "Alex": () => getColor("--color-alex"),
  "Jordan": () => getColor("--color-jordan")
};

function toggleCalendar(name) {
  if (activeCalendars.includes(name)) {
    activeCalendars = activeCalendars.filter(c => c !== name);
  } else {
    activeCalendars.push(name);
  }
  renderCalendar();
}

function setView(view) {
  currentView = view;
  renderCalendar();
}

function shouldShowEvent(event) {
  if (activeCalendars.includes("Group")) return true;
  return activeCalendars.includes(event.owner);
}

function renderCalendar() {
  calendarEl.innerHTML = "";

  if (currentView === "month") {
    renderMonth();
  } else {
    renderWeek();
  }
}

// MONTH VIEW
function renderMonth() {
  calendarEl.className = "calendar-container month-view";

  for (let i = 1; i <= 30; i++) {
    const day = document.createElement("div");
    day.className = "calendar-day";

    const date = `2026-04-${String(i).padStart(2, "0")}`;
    day.innerHTML = `<strong>${i}</strong>`;

    events.forEach(event => {
      if (event.date === date && shouldShowEvent(event)) {
        const eventEl = document.createElement("div");
        eventEl.className = "calendar-event";
        eventEl.innerText = event.title;

        eventEl.style.backgroundColor = ownerColors[event.owner]();

        eventEl.onclick = () => {
          window.location.href = "event.html";
        };

        day.appendChild(eventEl);
      }
    });

    calendarEl.appendChild(day);
  }
}

// WEEK VIEW (simple but functional)
function renderWeek() {
  calendarEl.className = "calendar-container week-view";

  const weekDates = [
    "2026-04-22",
    "2026-04-23",
    "2026-04-24",
    "2026-04-25",
    "2026-04-26",
    "2026-04-27",
    "2026-04-28"
  ];

  weekDates.forEach((date, index) => {
    const day = document.createElement("div");
    day.className = "calendar-day";

    day.innerHTML = `<strong>Day ${index + 1}</strong>`;

    events.forEach(event => {
      if (event.date === date && shouldShowEvent(event)) {
        const eventEl = document.createElement("div");
        eventEl.className = "calendar-event";
        eventEl.innerText = event.title;

        eventEl.style.backgroundColor = ownerColors[event.owner]();

        eventEl.onclick = () => {
          window.location.href = "event.html";
        };

        day.appendChild(eventEl);
      }
    });

    calendarEl.appendChild(day);
  });
}

renderCalendar();