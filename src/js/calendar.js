let events = [];
let isLoggedIn = false;

const today = new Date();

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

const checkboxes = {
  // Maintains compatibility with existing calendar checkbox tests.
  // The live calendar UI now uses My Calendar, Event Requests, and Friend Events.
  You: document.getElementById('check-you'),
  Alex: document.getElementById('check-alex'),
  Jordan: document.getElementById('check-jordan'),
};

let selectAllCheckbox = null;
let activeCalendars = ['You', 'Alex', 'Jordan'];

document.addEventListener('DOMContentLoaded', function () {
  initializeMonthNavigation();
  initializeCheckboxListeners();
  updateActiveCalendars();
  loadCalendarEvents();
});

function initializeMonthNavigation() {
  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');

  prevBtn?.addEventListener('click', () => {
    currentMonth--;

    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }

    renderCalendar();
  });

  nextBtn?.addEventListener('click', () => {
    currentMonth++;

    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }

    renderCalendar();
  });
}

function initializeCheckboxListeners() {
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', toggleSelectAll);
  }

  Object.values(checkboxes).forEach(function (checkbox) {
    if (checkbox) {
      checkbox.addEventListener('change', togglePerson);
    }
  });
}

async function loadCalendarEvents() {
  try {
    const response = await fetch('/api/calendar-events', {
      credentials: 'include',
    });

    if (response.status === 401) {
      isLoggedIn = false;
      events = [];
      showCalendarMessage('Please log in to view your calendar.');
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load calendar events.');
    }

    isLoggedIn = true;
    events = Array.isArray(data) ? data : [];

    renderCalendar();
  } catch (error) {
    console.error('Calendar loading error:', error);
    showCalendarMessage(
      'Could not load calendar events. Please make sure the backend server is running.',
    );
  }
}

function getCalendarContainer() {
  return (
    document.getElementById('calendarEvents') ||
    document.getElementById('calendar-events') ||
    document.getElementById('calendar') ||
    document.querySelector('.calendar-container') ||
    document.querySelector('.calendar')
  );
}

function toggleSelectAll() {
  if (!selectAllCheckbox) {
    return;
  }

  const isChecked = selectAllCheckbox.checked;

  Object.values(checkboxes).forEach(function (checkbox) {
    if (checkbox) {
      checkbox.checked = isChecked;
    }
  });

  updateActiveCalendars();
}

function togglePerson() {
  const validCheckboxes = Object.values(checkboxes).filter(Boolean);

  const allChecked =
    validCheckboxes.length > 0
      ? validCheckboxes.every(function (checkbox) {
          return checkbox.checked;
        })
      : true;

  if (selectAllCheckbox) {
    selectAllCheckbox.checked = allChecked;
  }

  updateActiveCalendars();
}

function updateActiveCalendars() {
  activeCalendars = Object.keys(checkboxes).filter(function (name) {
    return checkboxes[name] && checkboxes[name].checked;
  });

  renderCalendar();
}

function renderCalendar() {
  const calendarContainer = getCalendarContainer();

  if (!calendarContainer) return;

  if (!isLoggedIn) return;

  calendarContainer.innerHTML = '';

  if (!events) {
    events = [];
  }

  renderMonth(calendarContainer);
}

function renderMonth(calendarContainer) {
  calendarContainer.className = 'calendar-container month-view';

  const monthLabel = document.getElementById('currentMonthLabel');

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  monthLabel.textContent =
    `${monthNames[currentMonth]} ${currentYear}`;

  calendarContainer.innerHTML = '';

  const weekdays = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  weekdays.forEach((dayName) => {
    const header = document.createElement('div');

    header.className = 'calendar-header-day';

    header.innerHTML = `<strong>${dayName}</strong>`;

    calendarContainer.appendChild(header);
  });

  const firstDay = new Date(
    currentYear,
    currentMonth,
    1
  ).getDay();

  const daysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');

    emptyCell.className =
      'calendar-day empty-day';

    calendarContainer.appendChild(emptyCell);
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const day = document.createElement('div');

    day.className = 'calendar-day';

    const date =
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

    day.innerHTML = `
      <div class="day-number">
        ${dayNumber}
      </div>
    `;

    events.forEach((event) => {
      const eventDate =
        event.startDate || event.date;

      if (
        eventDate === date &&
        shouldShowEvent(event)
      ) {
        day.appendChild(
          createCalendarEventElement(event)
        );
      }
    });

    calendarContainer.appendChild(day);
  }
}

function createCalendarEventElement(event) {
  const eventEl = document.createElement('div');
  eventEl.classList.add('calendar-event');

  const title = event.title || 'Untitled Event';
  const status = event.status || 'pending';

  eventEl.innerText = title;

  if (status === 'pending') {
    eventEl.classList.add('pending-event');
  } else if (status === 'confirmed') {
    eventEl.classList.add('confirmed-event');
  } else if (status === 'declined') {
    eventEl.classList.add('declined-event');
  }

  eventEl.addEventListener('click', function () {
    showEventDetails(event);
  });

  return eventEl;
}

function showEventDetails(event) {
  const calendarContainer = getCalendarContainer();

  if (!calendarContainer) {
    return;
  }

  const detailCard = document.createElement('div');
  detailCard.className = 'calendar-event-card';

  if (event.status === 'pending') {
    detailCard.classList.add('pending-event');
  } else if (event.status === 'confirmed') {
    detailCard.classList.add('confirmed-event');
  } else if (event.status === 'declined') {
    detailCard.classList.add('declined-event');
  }

  const title = event.title || 'Untitled Event';
  const date = event.startDate || event.date || 'No date listed';
  const time = event.startTime || event.time || 'No time listed';
  const location = event.location || event.venue || 'No location listed';
  const description = event.description || '';
  const status = event.status || 'pending';
  const source =
    event.source === 'event-request' ? 'Event Request' : 'Saved Event';
  const owner = event.owner || 'You';

  detailCard.innerHTML = `
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
        : ''
    }
  `;

  const existingDetail = document.querySelector('.calendar-event-card');

  if (existingDetail) {
    existingDetail.remove();
  }

  calendarContainer.insertAdjacentElement('beforebegin', detailCard);
}

function shouldShowEvent(event) {
  const owner = event.owner || 'You';

  if (activeCalendars.length === 0) {
    return false;
  }

  return activeCalendars.includes(owner);
}

function showCalendarMessage(message) {
  const calendarContainer = getCalendarContainer();

  if (!calendarContainer) return;

  calendarContainer.innerHTML = `
    <div class="calendar-message-wrapper">
      <p class="calendar-message">${escapeHTML(message)}</p>
    </div>
  `;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

if (typeof window !== 'undefined') {
  window.toggleSelectAll = toggleSelectAll;
  window.togglePerson = togglePerson;
  window.updateActiveCalendars = updateActiveCalendars;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkboxes,
    selectAllCheckbox,
    toggleSelectAll,
    togglePerson,
    shouldShowEvent,
    updateActiveCalendars,
    renderCalendar,
    loadCalendarEvents,
    getCalendarContainer,
    renderMonth,
    createCalendarEventElement,
    showEventDetails,
    showCalendarMessage,
    escapeHTML,
  };
}
