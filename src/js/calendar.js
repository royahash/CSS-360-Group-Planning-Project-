let currentView = 'month';
let events = [];
let currentUserId = null;

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

const checkboxes = {
  my: document.getElementById('check-my-calendar'),
  requests: document.getElementById('check-event-requests'),
  friends: document.getElementById('check-friend-events'),
};

let selectAllCheckbox = document.getElementById('check-all');
let activeCalendars = ['my', 'requests', 'friends'];

document.addEventListener('DOMContentLoaded', function () {
  refreshCheckboxReferences();
  initializeViewButtons();
  initializeCheckboxListeners();
  loadCalendarEvents();
});

function refreshCheckboxReferences() {
  checkboxes.my = document.getElementById('check-my-calendar');
  checkboxes.requests = document.getElementById('check-event-requests');
  checkboxes.friends = document.getElementById('check-friend-events');

  selectAllCheckbox = document.getElementById('check-all');
}

function initializeViewButtons() {
  const monthViewBtn = document.getElementById('monthViewBtn');
  const weekViewBtn = document.getElementById('weekViewBtn');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');

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

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', function () {
      changeMonth(-1);
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', function () {
      changeMonth(1);
    });
  }
}

function initializeCheckboxListeners() {
  refreshCheckboxReferences();

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
      credentials: 'include',
    });

    if (response.status === 401) {
      showCalendarMessage('Please log in to view your calendar.');
      return;
    }

    if (!response.ok) {
      events = [];
      showCalendarMessage('Could not load events.');
      return;
    }

    const saved = await response.json();

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
  refreshCheckboxReferences();

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
  refreshCheckboxReferences();

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
  refreshCheckboxReferences();

  activeCalendars = Object.keys(checkboxes).filter(function (name) {
    return checkboxes[name] && checkboxes[name].checked;
  });

  renderCalendar();
}

function setView(view) {
  currentView = view;
  renderCalendar();
}

function changeMonth(direction) {
  currentMonth += direction;

  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear -= 1;
  }

  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear += 1;
  }

  renderCalendar();
}

function renderCalendar() {
  const calendarContainer = getCalendarContainer();

  if (!calendarContainer) {
    return;
  }

  calendarContainer.innerHTML = '';

  if (!events) {
    events = [];
  }

  if (currentView === 'week') {
    renderWeek(calendarContainer);
  } else {
    renderMonth(calendarContainer);
  }
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

  if (monthLabel) {
    monthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  }

  calendarContainer.innerHTML = '';

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  weekdays.forEach(function (weekday) {
    const weekdayHeader = document.createElement('div');
    weekdayHeader.className = 'calendar-weekday';
    weekdayHeader.textContent = weekday;
    calendarContainer.appendChild(weekdayHeader);
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
          day: 'numeric',
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

  const source = event.source || event.calendarType || 'my';

  if (source === 'event-request' || source === 'event-requests') {
    eventEl.classList.add('request-event');
  } else if (
    source === 'friend' ||
    source === 'friend-event' ||
    source === 'friend-events'
  ) {
    eventEl.classList.add('friend-event');
  } else {
    eventEl.classList.add('my-event');
  }

  const title = event.title || 'Untitled Event';
  const status = event.status || 'pending';

  eventEl.innerText = title;
  eventEl.title = title;

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
  const existingDetail = document.querySelector('.calendar-event-card');

  if (existingDetail) {
    existingDetail.remove();
  }

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
  const owner = event.owner || 'You';

  let source = 'Saved Event';

  if (event.source === 'event-request') {
    source = 'Event Request';
  } else if (event.source === 'friend-event' || event.source === 'friend') {
    source = 'Friend Event';
  }

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
      ${options
        .map(function (option) {
          return `
          <label class="checkbox-label">
            <input type="radio" name="${escapeHTML(category)}Vote" value="${escapeHTML(option)}">
            ${escapeHTML(option)}
          </label>
        `;
        })
        .join('')}
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
    activity: getValue('activityVote'),
  };
}

async function submitEventRequestResponse(
  eventRequestId,
  responseStatus,
  votes = {},
) {
  const message = document.getElementById('calendarResponseMessage');

  try {
    const response = await fetch(
      `/api/event-requests/${eventRequestId}/respond`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          responseStatus,
          votes,
        }),
      },
    );

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
  const type = event.calendarType || event.source || 'my-calendar';

  if (type === 'my-calendar' || type === 'saved-event') {
    return activeCalendars.includes('my');
  }

  if (type === 'event-requests' || type === 'event-request') {
    return activeCalendars.includes('requests');
  }

  if (
    type === 'friend-events' ||
    type === 'friend-event' ||
    type === 'friend'
  ) {
    return activeCalendars.includes('friends');
  }

  return activeCalendars.includes('my');
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
  window.changeMonth = changeMonth;
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
    changeMonth,
    loadCalendarEvents,
    getCalendarContainer,
    renderMonth,
    renderWeek,
    createCalendarEventElement,
    showEventDetails,
    showCalendarMessage,
    escapeHTML,
  };
}
