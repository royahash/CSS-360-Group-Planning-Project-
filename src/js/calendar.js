/* global getSavedEvents */

const calendarEl = document.getElementById('calendar');

let currentView = 'month';

let activeCalendars = ['You', 'Alex', 'Jordan'];

// CHECKBOXES
const checkboxes = {
  You: document.getElementById('check-you'),
  Alex: document.getElementById('check-alex'),
  Jordan: document.getElementById('check-jordan'),
};

const selectAllCheckbox =
  document.getElementById('check-all');

// EVENTS
let events = [];

// LOAD EVENTS
async function loadCalendarEvents() {
  try {
    // DATABASE EVENTS
    const savedEvents = await getSavedEvents();

    const savedEventsArray = Array.isArray(savedEvents)
      ? savedEvents
      : [];

    // MOCK FRIEND EVENTS
    const response =
      await fetch('/data/mockFriends.json');

    const friendEvents = await response.json();

    // COMBINE
    events = [
      ...savedEventsArray.map((event) => ({
        title: event.title,
        date: event.startDate,
        owner: event.owner,
        ticketmasterId:
          event.ticketmasterId || '',
      })),

      ...friendEvents,
    ];

    renderCalendar();
  } catch (error) {
    console.error(
      'Failed to load calendar events:',
      error
    );

    calendarEl.innerHTML = `
      <p style="padding:20px;">
        Failed to load calendar events
      </p>
    `;
  }
}

// LOAD ON START
loadCalendarEvents();

// COLOR HELPER
function getColor(variable) {
  return getComputedStyle(
    document.documentElement
  )
    .getPropertyValue(variable)
    .trim();
}

const ownerColors = {
  You: () => getColor('--color-you'),
  Alex: () => getColor('--color-alex'),
  Jordan: () => getColor('--color-jordan'),
};

// SELECT ALL
function toggleSelectAll() {
  const isChecked =
    selectAllCheckbox.checked;

  Object.values(checkboxes).forEach(
    (cb) => {
      cb.checked = isChecked;
    }
  );

  updateActiveCalendars();
}

// INDIVIDUAL TOGGLE
function togglePerson() {
  const allChecked =
    Object.values(checkboxes).every(
      (cb) => cb.checked
    );

  selectAllCheckbox.checked =
    allChecked;

  updateActiveCalendars();
}

// UPDATE ACTIVE LIST
function updateActiveCalendars() {
  activeCalendars =
    Object.keys(checkboxes).filter(
      (name) => checkboxes[name].checked
    );

  renderCalendar();
}

// VIEW SWITCH
function setView(view) {
  currentView = view;

  renderCalendar();
}

// FILTER
function shouldShowEvent(event) {
  return activeCalendars.includes(
    event.owner
  );
}

// MAIN RENDER
function renderCalendar() {
  calendarEl.innerHTML = '';

  if (currentView === 'month') {
    renderMonth();
  } else {
    renderWeek();
  }
}

// MONTH VIEW
function renderMonth() {
  calendarEl.className =
    'calendar-container month-view';

  const today = new Date();

  const currentMonth =
    today.getMonth();

  const currentYear =
    today.getFullYear();

  const daysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  for (
    let i = 1;
    i <= daysInMonth;
    i++
  ) {
    const day =
      document.createElement('div');

    day.className = 'calendar-day';

    const date =
      `${currentYear}-${String(
        currentMonth + 1
      ).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

    day.innerHTML = `<strong>${i}</strong>`;

    events.forEach((event) => {
      if (
        event.date === date &&
        shouldShowEvent(event)
      ) {
        const eventEl =
          document.createElement('div');

        eventEl.className =
          'calendar-event';

        eventEl.innerText =
          event.title;

        eventEl.style.backgroundColor =
          ownerColors[event.owner]
            ? ownerColors[event.owner]()
            : '#cccccc';

        eventEl.onclick = () => {
          if (event.ticketmasterId) {
            window.location.href =
              `event.html?id=${event.ticketmasterId}`;
          } else {
            window.location.href =
              `event.html?title=${encodeURIComponent(
                event.title
              )}`;
          }
        };

        day.appendChild(eventEl);
      }
    });

    calendarEl.appendChild(day);
  }
}

// WEEK VIEW
function renderWeek() {
  calendarEl.className =
    'calendar-container week-view';

  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date();

    currentDay.setDate(
      today.getDate() + i
    );

    const formattedDate =
      currentDay
        .toISOString()
        .split('T')[0];

    const day =
      document.createElement('div');

    day.className = 'calendar-day';

    day.innerHTML = `
      <strong>
        ${currentDay.toLocaleDateString(
          'en-US',
          {
            weekday: 'short',
            month: 'numeric',
            day: 'numeric',
          }
        )}
      </strong>
    `;

    events.forEach((event) => {
      if (
        event.date === formattedDate &&
        shouldShowEvent(event)
      ) {
        const eventEl =
          document.createElement('div');

        eventEl.className =
          'calendar-event';

        eventEl.innerText =
          event.title;

        eventEl.style.backgroundColor =
          ownerColors[event.owner]
            ? ownerColors[event.owner]()
            : '#cccccc';

        eventEl.onclick = () => {
          if (event.ticketmasterId) {
            window.location.href =
              `event.html?id=${event.ticketmasterId}`;
          } else {
            window.location.href =
              `event.html?title=${encodeURIComponent(
                event.title
              )}`;
          }
        };

        day.appendChild(eventEl);
      }
    });

    calendarEl.appendChild(day);
  }
}

// EXPORTS FOR TESTS
if (
  typeof module !== 'undefined' &&
  module.exports
) {
  module.exports = {
    checkboxes,
    selectAllCheckbox,
    toggleSelectAll,
    togglePerson,
    shouldShowEvent,
    updateActiveCalendars,
    renderCalendar,
    setView,
  };
}