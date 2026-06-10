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

function formatTime(timeStr) {
  if (!timeStr || timeStr === 'No time listed') return timeStr;
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${ampm}`;
}

function showEventDetails(event) {
  const existingDetail = document.querySelector('.calendar-event-card');
  if (existingDetail) existingDetail.remove();

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
  const time = formatTime(event.startTime || event.time || 'No time listed');
  const location = event.location || event.venue || 'No location listed';
  const description = event.description || '';
  const status = event.status || 'pending';
  const owner = event.owner || 'You';
  const isCreator = owner === 'You';

  let sourceLabel = 'Saved Event';
  if (event.source === 'event-request') sourceLabel = 'Event Request';
  else if (event.source === 'friend-event' || event.source === 'friend')
    sourceLabel = 'Friend Event';

  // Build responses summary for creator
  let responsesSummaryHTML = '';
  if (isCreator && event.source === 'event-request') {
    const responses = event.responses || [];
    if (responses.length === 0) {
      responsesSummaryHTML = `<p><em>No responses yet.</em></p>`;
    } else {
      const rows = responses.map((r) => {
        const name = escapeHTML(r.displayName || r.email || 'Someone');
        const rs = escapeHTML(r.responseStatus || '');
        const votes = r.votes || {};
        const voteStr = [votes.date, votes.time, votes.location, votes.activity]
          .filter(Boolean)
          .join(', ');
        return `<li><strong>${name}</strong>: ${rs}${voteStr ? ` — voted: ${escapeHTML(voteStr)}` : ''}</li>`;
      });
      responsesSummaryHTML = `
        <div class="poll-section">
          <h4>Responses (${responses.length})</h4>
          <ul style="margin:4px 0; padding-left:18px;">${rows.join('')}</ul>
        </div>`;
    }
  }

  // Confirm event button for creator
  const confirmBtnHTML =
    isCreator && event.source === 'event-request'
      ? `
    <div style="margin-top:10px;">
      <button type="button" class="card-btn" id="confirmEventBtn">
        ${status === 'confirmed' ? '✓ Event Confirmed' : 'Confirm Event for Everyone'}
      </button>
    </div>`
      : '';

  detailCard.innerHTML = `
    <h3>${escapeHTML(title)}</h3>
    <p style="color:#666; font-size:13px; margin-top:-4px; margin-bottom:8px;">
      ${isCreator ? 'Created by you' : `Created by ${escapeHTML(owner)}`}
    </p>
    <p><strong>Date:</strong> ${escapeHTML(date)}</p>
    <p><strong>Time:</strong> ${escapeHTML(time)}</p>
    <p><strong>Location:</strong> ${escapeHTML(location)}</p>
    <p><strong>Status:</strong> <span class="event-status">${escapeHTML(status)}</span></p>
    <p><strong>Type:</strong> ${escapeHTML(sourceLabel)}</p>
    ${description ? `<p><strong>Description:</strong> ${escapeHTML(description)}</p>` : ''}
    ${responsesSummaryHTML}
    ${confirmBtnHTML}
    ${event.source === 'event-request' && event.canRespond ? buildPollHTML(event) : ''}
  `;

  calendarContainer.insertAdjacentElement('beforebegin', detailCard);

  // Confirm button listener (creator only)
  const confirmBtn = document.getElementById('confirmEventBtn');
  if (confirmBtn && status !== 'confirmed') {
    confirmBtn.addEventListener('click', async () => {
      try {
        const res = await fetch(`/api/event-requests/${event.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'confirmed' }),
        });
        if (res.ok) {
          confirmBtn.textContent = '✓ Event Confirmed';
          confirmBtn.disabled = true;
          await loadCalendarEvents();
        }
      } catch (err) {
        console.error('Failed to confirm event:', err);
      }
    });
  }

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
      ${buildOptionGroup('date', 'Date Options', dateOptions)}
      ${buildOptionGroup('time', 'Time Options', timeOptions)}
      ${buildOptionGroup('location', 'Location Options', locationOptions)}
      ${buildOptionGroup('activity', 'Activity Options', activityOptions)}
      <div class="profile-actions">
        <button type="button" class="card-btn" id="acceptRequestBtn">I&#39;ll Attend</button>
        <button type="button" class="card-btn" id="voteRequestBtn">Submit Vote</button>
        <button type="button" class="card-btn" id="cantAttendBtn">Can&#39;t Attend</button>
        <button type="button" class="card-btn" id="noOptionsBtn">None of these options work</button>
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
  const cantAttendBtn = document.getElementById('cantAttendBtn');
  const noOptionsBtn = document.getElementById('noOptionsBtn');

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

  if (cantAttendBtn) {
    cantAttendBtn.addEventListener('click', function () {
      submitEventRequestResponse(event.id, 'declined');
    });
  }

  if (noOptionsBtn) {
    noOptionsBtn.addEventListener('click', function () {
      // Voted with no selections — signals options need revisiting
      submitEventRequestResponse(event.id, 'voted', {});
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
