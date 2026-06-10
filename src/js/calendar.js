/* global getSavedEvents */

let events = [];
let isLoggedIn = false;
let currentUserId = null;

const today = new Date();

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

const checkboxes = {
  all: document.getElementById('check-all'),
  my: document.getElementById('check-my-calendar'),
  requests: document.getElementById('check-event-requests'),
  friends: document.getElementById('check-friend-events'),
};

const selectAllCheckbox = checkboxes.all;

let activeCalendars = {
  my: true,
  requests: true,
  friends: true,
};

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
  const { all, my, requests, friends } = checkboxes;

  if (!all || !my || !requests || !friends) return;

  function syncState() {
    activeCalendars = {
      my: my.checked,
      requests: requests.checked,
      friends: friends.checked,
    };

    // Select All logic (derived state)
    all.checked = my.checked && requests.checked && friends.checked;

    renderCalendar();
  }

  // SELECT ALL
  all.addEventListener('change', () => {
    const value = all.checked;

    my.checked = value;
    requests.checked = value;
    friends.checked = value;

    syncState();
  });

  // INDIVIDUAL CHECKBOXES
  [my, requests, friends].forEach((cb) => {
    cb.addEventListener('change', syncState);
  });
}

async function fetchCurrentUser() {
  try {
    const response = await fetch('/auth/me', {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return user;
  } catch (err) {
    console.error('Error fetching current user:', err);
    return null;
  }
}

async function loadCalendarEvents() {
  try {
    const currentUser = await fetchCurrentUser();

    if (!currentUser) {
      events = [];
      isLoggedIn = false;
      showCalendarMessage('Please log in to view calendar events.');
      return;
    }

    currentUserId = currentUser.id;

    const response = await fetch('/api/calendar-events', { credentials: 'include' });
    if (!response.ok) {
      events = [];
      showCalendarMessage('Could not load events.');
      return;
    }
    const saved = await response.json();

    isLoggedIn = true;

    // normalize dates so calendar can read them and classify ownership
    events = saved.map((e) => {
      const source =
        e.source ||
        (String(e.userId) === String(currentUserId) ? 'my' : 'friend');

      return {
        ...e,
        date: e.startDate || e.date,
        source,
        owner: e.owner || (source === 'friend' ? 'friend' : 'my'),
      };
    });

    renderCalendar();
  } catch (err) {
    console.error(err);
    showCalendarMessage('Failed to load calendar events.');
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
  const { my, requests, friends } = checkboxes;

  activeCalendars = {
    my: !!my?.checked,
    requests: !!requests?.checked,
    friends: !!friends?.checked,
  };

  renderCalendar();
}

function renderCalendar() {
  const calendarContainer = getCalendarContainer();

  if (!calendarContainer) return;

  if (!isLoggedIn) {
    calendarContainer.innerHTML = '';
    return;
  }

  calendarContainer.innerHTML = '';

  if (!Array.isArray(events)) events = [];

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

  monthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  calendarContainer.innerHTML = '';

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  weekdays.forEach((dayName) => {
    const header = document.createElement('div');

    header.className = 'calendar-header-day';

    header.innerHTML = `<strong>${dayName}</strong>`;

    calendarContainer.appendChild(header);
  });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');

    emptyCell.className = 'calendar-day empty-day';

    calendarContainer.appendChild(emptyCell);
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const day = document.createElement('div');

    day.className = 'calendar-day';

    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

    day.innerHTML = `
      <div class="day-number">
        ${dayNumber}
      </div>
    `;

    const dayEvents = events.filter((event) => {
  const eventDateRaw = event.startDate || event.date;
  const eventDate = eventDateRaw?.split('T')[0];
  return eventDate === date && shouldShowEvent(event);
});

const maxVisible = 4;
dayEvents.slice(0, maxVisible).forEach((event) => {
  day.appendChild(createCalendarEventElement(event));
});

if (dayEvents.length > maxVisible) {
  const overflow = document.createElement('div');
  overflow.className = 'calendar-overflow';
  overflow.innerText = `+${dayEvents.length - maxVisible} more`;
  overflow.addEventListener('click', () => {
    dayEvents.slice(maxVisible).forEach((event) => {
      day.insertBefore(createCalendarEventElement(event), overflow);
    });
    overflow.remove();
  });
  day.appendChild(overflow);
}

    calendarContainer.appendChild(day);
  }
}

function createCalendarEventElement(event) {
  const eventEl = document.createElement('div');
  eventEl.classList.add('calendar-event');

  const source = event.source || 'my';

  if (source === 'event-request') {
    eventEl.classList.add('request-event');
  } else if (source === 'friend') {
    eventEl.classList.add('friend-event');
  } else {
    eventEl.classList.add('my-event');
  }

  const title = event.title || 'Untitled Event';
  const status = event.status || 'pending';

  eventEl.innerText = title;
  eventEl.title = title; // shows full title on hover as tooltip

  if (status === 'pending') {
    eventEl.classList.add('pending-event');
  } else if (status === 'confirmed') {
    eventEl.classList.add('confirmed-event');
  } else if (status === 'declined') {
    eventEl.classList.add('declined-event');
  }

  eventEl.addEventListener('click', function () {
    window.location.href = `/html/event.html?id=${event.ticketmasterId}`;
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
  const source = event.source || 'my';

  if (source === 'event-request') return activeCalendars.requests;
  if (source === 'friend') return activeCalendars.friends;

  // default: Ticketmaster saved events
  return activeCalendars.my;
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

window.addEventListener('calendarUpdated', loadCalendarEvents);
