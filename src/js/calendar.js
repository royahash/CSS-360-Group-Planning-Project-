let currentView = 'month';
let events = [];

document.addEventListener('DOMContentLoaded', function () {
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

  loadCalendarEvents();
});

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

function setView(view) {
  currentView = view;
  renderCalendar();
}

function renderCalendar() {
  const calendarContainer = getCalendarContainer();

  if (!calendarContainer) {
    console.error('Calendar container not found.');
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

  if (event.source === 'event-request') {
    eventEl.title = 'Event Request';
  } else if (event.source === 'saved-event') {
    eventEl.title = 'Saved Event';
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
  const source = event.source || '';
  const owner = event.owner || '';

  const calendarCheckboxes = document.querySelectorAll('.calendar-sidebar input[type="checkbox"]');
  const labels = Array.from(calendarCheckboxes).map(function (checkbox) {
    return {
      checked: checkbox.checked,
      text: checkbox.parentElement ? checkbox.parentElement.textContent.trim() : ''
    };
  });

  const selectAll = labels.find(function (label) {
    return label.text.includes('Select All');
  });

  if (selectAll && selectAll.checked) {
    return true;
  }

  const myCalendar = labels.find(function (label) {
    return label.text.includes('My Calendar');
  });

  const eventRequests = labels.find(function (label) {
    return label.text.includes('Event Requests');
  });

  const friendEvents = labels.find(function (label) {
    return label.text.includes('Friend Events');
  });

  if ((owner === 'You' || source === 'saved-event') && myCalendar && myCalendar.checked) {
    return true;
  }

  if (source === 'event-request' && eventRequests && eventRequests.checked) {
    return true;
  }

  if (owner !== 'You' && source !== 'event-request' && friendEvents && friendEvents.checked) {
    return true;
  }

  return !myCalendar && !eventRequests && !friendEvents;
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

// EXPORTS FOR TESTS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadCalendarEvents,
    getCalendarContainer,
    setView,
    renderCalendar,
    renderMonth,
    renderWeek,
    createCalendarEventElement,
    showEventDetails,
    shouldShowEvent,
    showCalendarMessage,
    escapeHTML
  };
}