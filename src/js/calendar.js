/* global getSavedEvents */

let events = [];
let isLoggedIn = false;
let currentUserId = null;

const today = new Date();

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

// Maintains compatibility with existing calendar checkbox tests.
// The live calendar UI now uses My Calendar, Event Requests, and Friend Events.
const checkboxes = {
<<<<<<< HEAD
  You: document.getElementById('check-you'),
  Alex: document.getElementById('check-alex'),
  Jordan: document.getElementById('check-jordan'),
};

let selectAllCheckbox = document.getElementById('check-all');
let activeCalendars = ['You', 'Alex', 'Jordan'];
=======
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
>>>>>>> 8a48f30e8d47a12eddc9b16ce632c52bba4e03a2

document.addEventListener('DOMContentLoaded', function () {
  initializeMonthNavigation();
  initializeCheckboxListeners();
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
<<<<<<< HEAD
  if (!selectAllCheckbox) {
    selectAllCheckbox = document.querySelector('.calendar-select-all input[type="checkbox"]');
  }

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', toggleSelectAll);
=======
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
>>>>>>> 8a48f30e8d47a12eddc9b16ce632c52bba4e03a2
  }

  // SELECT ALL
  all.addEventListener('change', () => {
    const value = all.checked;

    my.checked = value;
    requests.checked = value;
    friends.checked = value;

    syncState();
  });

<<<<<<< HEAD
  document.querySelectorAll('.calendar-sidebar label input[type="checkbox"]').forEach(function (checkbox) {
    checkbox.addEventListener('change', function () {
      if (!checkbox.closest('.calendar-select-all')) {
        renderCalendar();
      }
    });
  });

  updateActiveCalendars();
=======
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
>>>>>>> 8a48f30e8d47a12eddc9b16ce632c52bba4e03a2
}

async function loadCalendarEvents() {
  try {
<<<<<<< HEAD
    const response = await fetch('/api/calendar-events', {
      credentials: 'include'
    });
=======
    const currentUser = await fetchCurrentUser();
>>>>>>> 8a48f30e8d47a12eddc9b16ce632c52bba4e03a2

    if (!currentUser) {
      events = [];
      isLoggedIn = false;
      showCalendarMessage('Please log in to view calendar events.');
      return;
    }

    currentUserId = currentUser.id;

    const saved = await getSavedEvents(); // <-- use your existing API helper

    if (!saved) {
      events = [];
      showCalendarMessage('Could not load events.');
      return;
    }

    isLoggedIn = true;

    // normalize dates so calendar can read them and classify ownership
    events = saved.map((e) => {
      const source = e.source ||
        (String(e.userId) === String(currentUserId) ? 'my' : 'friend');

      return {
        ...e,
        date: e.startDate || e.date,
        source,
        owner: e.owner || (source === 'friend' ? 'friend' : 'my'),
      };
    });

    renderCalendar();
<<<<<<< HEAD
  } catch (error) {
    console.error('Calendar loading error:', error);
    showCalendarMessage(
      'Could not load calendar events. Please make sure the backend server is running.'
    );
=======
  } catch (err) {
    console.error(err);
    showCalendarMessage('Failed to load calendar events.');
>>>>>>> 8a48f30e8d47a12eddc9b16ce632c52bba4e03a2
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
    selectAllCheckbox = document.querySelector('.calendar-select-all input[type="checkbox"]');
  }

  if (!selectAllCheckbox) return;

  const isChecked = selectAllCheckbox.checked;

  Object.values(checkboxes).forEach(function (checkbox) {
    if (checkbox) {
      checkbox.checked = isChecked;
    }
  });

  document.querySelectorAll('.calendar-sidebar label input[type="checkbox"]').forEach(function (checkbox) {
    checkbox.checked = isChecked;
  });

  updateActiveCalendars();
  renderCalendar();
}

function togglePerson() {
  const validCheckboxes = Object.values(checkboxes).filter(Boolean);

  const allChecked = validCheckboxes.length > 0
    ? validCheckboxes.every(function (checkbox) {
        return checkbox.checked;
      })
    : true;

  if (!selectAllCheckbox) {
    selectAllCheckbox = document.querySelector('.calendar-select-all input[type="checkbox"]');
  }

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

<<<<<<< HEAD

  if (!isLoggedIn) return;
=======
  if (!isLoggedIn) {
    calendarContainer.innerHTML = '';
    return;
  }
>>>>>>> 8a48f30e8d47a12eddc9b16ce632c52bba4e03a2

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
<<<<<<< HEAD
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
    const date =
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
=======
>>>>>>> 8a48f30e8d47a12eddc9b16ce632c52bba4e03a2

    day.innerHTML = `
      <div class="day-number">
        ${dayNumber}
      </div>
    `;

    events.forEach((event) => {
      const eventDateRaw = event.startDate || event.date;
      const eventDate = eventDateRaw?.split('T')[0]; // normalize ISO → YYYY-MM-DD
      if (eventDate === date && shouldShowEvent(event)) {
        day.appendChild(createCalendarEventElement(event));
      }
    });

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
  const existingDetail = document.querySelector('.calendar-event-card');

  if (existingDetail) {
    existingDetail.remove();
  }

  const calendarContainer = getCalendarContainer();
  if (!calendarContainer) return;

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
  const source = event.source === 'event-request'
    ? 'Event Request'
    : event.source === 'friend-event'
      ? 'Friend Event'
      : 'Saved Event';
  const owner = event.owner || 'You';

  detailCard.innerHTML = `
    <h3>${escapeHTML(title)}</h3>
    <p><strong>Date:</strong> ${escapeHTML(date)}</p>
    <p><strong>Time:</strong> ${escapeHTML(time)}</p>
    <p><strong>Location:</strong> ${escapeHTML(location)}</p>
    <p><strong>Status:</strong> <span class="event-status">${escapeHTML(status)}</span></p>
    <p><strong>Source:</strong> ${escapeHTML(source)}</p>
    <p><strong>Owner:</strong> ${escapeHTML(owner)}</p>
    ${description ? `<p><strong>Description:</strong> ${escapeHTML(description)}</p>` : ''}
    ${event.source === 'event-request' && event.canRespond ? buildPollHTML(event) : ''}
  `;

  calendarContainer.insertAdjacentElement('beforebegin', detailCard);

  if (event.source === 'event-request' && event.canRespond) {
    attachPollListeners(event);
  }
}

function buildPollHTML(event) {
  const pollOptions = event.pollOptions || {};

  const dateOptions = pollOptions.dates || [];
  const timeOptions = pollOptions.times || [];
  const locationOptions = pollOptions.locations || [];
  const activityOptions = pollOptions.activities || [];

  return `
    <div class="poll-section">
      <h3>Respond to Event Request</h3>

      ${buildOptionGroup('date', 'Date Vote', dateOptions)}
      ${buildOptionGroup('time', 'Time Vote', timeOptions)}
      ${buildOptionGroup('location', 'Location Vote', locationOptions)}
      ${buildOptionGroup('activity', 'Activity Vote', activityOptions)}

      <div class="profile-actions">
        <button type="button" class="card-btn" id="acceptRequestBtn">Accept</button>
        <button type="button" class="card-btn" id="voteRequestBtn">Submit Vote</button>
        <button type="button" class="card-btn" id="declineRequestBtn">Decline</button>
      </div>

      <p id="calendarResponseMessage"></p>
    </div>
  `;
}

function buildOptionGroup(category, label, options) {
  if (!options || options.length === 0) {
    return `
      <div class="poll-category">
        <h4>${escapeHTML(label)}</h4>
        <p>No ${escapeHTML(label.toLowerCase())} options were provided.</p>
      </div>
    `;
  }

  return `
    <div class="poll-category">
      <h4>${escapeHTML(label)}</h4>
      ${options.map((option) => {
        return `
          <label class="checkbox-label">
            <input type="radio" name="${escapeHTML(category)}Vote" value="${escapeHTML(option)}">
            ${escapeHTML(option)}
          </label>
        `;
      }).join('')}
    </div>
  `;
}

function attachPollListeners(event) {
  const acceptBtn = document.getElementById('acceptRequestBtn');
  const voteBtn = document.getElementById('voteRequestBtn');
  const declineBtn = document.getElementById('declineRequestBtn');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', function () {
      submitEventRequestResponse(event.id, 'accepted');
    });
  }

  if (voteBtn) {
    voteBtn.addEventListener('click', function () {
      submitEventRequestResponse(event.id, 'voted', collectVotes());
    });
  }

  if (declineBtn) {
    declineBtn.addEventListener('click', function () {
      submitEventRequestResponse(event.id, 'declined');
    });
  }
}

function collectVotes() {
  const getValue = function (name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : '';
  };

  return {
    date: getValue('dateVote'),
    time: getValue('timeVote'),
    location: getValue('locationVote'),
    activity: getValue('activityVote')
  };
}

async function submitEventRequestResponse(eventRequestId, responseStatus, votes = {}) {
  const message = document.getElementById('calendarResponseMessage');

  try {
    const response = await fetch(`/api/event-requests/${eventRequestId}/respond`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        responseStatus,
        votes
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to save response.');
    }

    if (message) {
      message.textContent = 'Response saved successfully.';
      message.style.color = 'green';
    }

    await loadCalendarEvents();
  } catch (error) {
    console.error('Event request response error:', error);

    if (message) {
      message.textContent = error.message || 'Failed to save response.';
      message.style.color = 'red';
    }
  }
}

function shouldShowEvent(event) {
  const source = event.source || 'my';

<<<<<<< HEAD
  if (event.calendarType === 'my-calendar') {
    return isCalendarFilterChecked('My Calendar');
  }

  if (event.calendarType === 'event-requests') {
    return isCalendarFilterChecked('Event Requests');
  }

  if (event.calendarType === 'friend-events') {
    return isCalendarFilterChecked('Friend Events');
  }

  if (activeCalendars.length === 0) {
    return false;
  }
=======
  if (source === 'event-request') return activeCalendars.requests;
  if (source === 'friend') return activeCalendars.friends;
>>>>>>> 8a48f30e8d47a12eddc9b16ce632c52bba4e03a2

  // default: Ticketmaster saved events
  return activeCalendars.my;
}

function isCalendarFilterChecked(labelText) {
  const labels = document.querySelectorAll('.calendar-sidebar label');

  for (const label of labels) {
    const text = label.textContent.trim();
    const checkbox = label.querySelector('input[type="checkbox"]');

    if (text.includes(labelText)) {
      return checkbox ? checkbox.checked : true;
    }
  }

  return true;
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
    escapeHTML
  };
}

window.addEventListener('calendarUpdated', loadCalendarEvents);
