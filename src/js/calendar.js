let currentView = 'month';
let events = [];

const checkboxes = {
  You: null,
  Alex: null,
  Jordan: null,
};

let selectAllCheckbox = null;
let activeCalendars = ['You', 'Alex', 'Jordan'];

document.addEventListener('DOMContentLoaded', function () {
  initializeCheckboxes();
  initializeViewButtons();
  loadCalendarEvents();
});

function initializeViewButtons() {
  const monthViewBtn = document.getElementById('monthViewBtn');
  const weekViewBtn = document.getElementById('weekViewBtn');

  if (monthViewBtn) {
    monthViewBtn.addEventListener('click', function () {
      setView('month');
    });
  }

  if (weekViewBtn) {
    weekViewBtn.addEventListener('click', function () {
      setView('week');
    });
  }
}

function initializeCheckboxes() {
  selectAllCheckbox = document.getElementById('check-all');

  checkboxes.You = document.getElementById('check-you');
  checkboxes.Alex = document.getElementById('check-alex');
  checkboxes.Jordan = document.getElementById('check-jordan');

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', toggleSelectAll);
  }

  Object.values(checkboxes).forEach(function (checkbox) {
    if (checkbox) {
      checkbox.addEventListener('change', togglePerson);
    }
  });

  updateActiveCalendars();
}

async function loadCalendarEvents() {
  try {
    const response = await fetch('/api/calendar-events', {
      credentials: 'include'
    });

    if (response.status === 401) {
      showCalendarMessage('Please log in to view your calendar.');
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load calendar events.');
    }

    events = Array.isArray(data) ? data : [];
    renderCalendar();
  } catch (error) {
    console.error('Calendar loading error:', error);
    showCalendarMessage(
      'Could not load calendar events. Please make sure the backend server is running.'
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
    selectAllCheckbox = document.getElementById('check-all');
  }

  const isChecked = selectAllCheckbox ? selectAllCheckbox.checked : true;

  Object.values(checkboxes).forEach(function (checkbox) {
    if (checkbox) {
      checkbox.checked = isChecked;
    }
  });

  updateActiveCalendars();
}

function togglePerson() {
  const validCheckboxes = Object.values(checkboxes).filter(Boolean);

  const allChecked = validCheckboxes.length > 0
    ? validCheckboxes.every(function (checkbox) {
        return checkbox.checked;
      })
    : true;

  if (!selectAllCheckbox) {
    selectAllCheckbox = document.getElementById('check-all');
  }

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

function setView(view) {
  currentView = view;
  renderCalendar();
}

function renderCalendar() {
  const calendarContainer = getCalendarContainer();

  if (!calendarContainer) {
    return;
  }

  calendarContainer.innerHTML = '';

  if (!events || events.length === 0) {
    showCalendarMessage('No events on your calendar yet.');
    return;
  }

  if (currentView === 'week') {
    renderWeek(calendarContainer);
  } else {
    renderMonth(calendarContainer);
  }
}

function renderMonth(calendarContainer) {
  calendarContainer.className = 'calendar-container month-view';

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const day = document.createElement('div');
    day.className = 'calendar-day';

    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

    day.innerHTML = `<strong>${dayNumber}</strong>`;

    events.forEach(function (event) {
      const eventDate = event.startDate || event.date;

      if (eventDate === date && shouldShowEvent(event)) {
        day.appendChild(createCalendarEventElement(event));
      }
    });

    calendarContainer.appendChild(day);
  }
}

function renderWeek(calendarContainer) {
  calendarContainer.className = 'calendar-container week-view';

  const today = new Date();

  for (let index = 0; index < 7; index++) {
    const currentDay = new Date();
    currentDay.setDate(today.getDate() + index);

    const formattedDate = currentDay.toISOString().split('T')[0];

    const day = document.createElement('div');
    day.className = 'calendar-day';

    day.innerHTML = `
      <strong>
        ${currentDay.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'numeric',
          day: 'numeric'
        })}
      </strong>
    `;

    events.forEach(function (event) {
      const eventDate = event.startDate || event.date;

      if (eventDate === formattedDate && shouldShowEvent(event)) {
        day.appendChild(createCalendarEventElement(event));
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
  const source = event.source === 'event-request' ? 'Event Request' : 'Saved Event';
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

  if (owner === 'You') {
    return activeCalendars.includes('You');
  }

  return true;
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
  window.setView = setView;
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
    setView,
    loadCalendarEvents,
    getCalendarContainer,
    renderMonth,
    renderWeek,
    createCalendarEventElement,
    showEventDetails,
    showCalendarMessage,
    escapeHTML
  };
}
