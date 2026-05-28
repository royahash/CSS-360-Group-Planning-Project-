/**
 * events.js
 * Fetches real events from Ticketmaster API and builds event cards
 * on the homepage dynamically.
 */
/* global CONFIG, handleSaveEvent, isEventSaved */

// ── Config ─────────────────────────────────────────────────────────────────
const API_KEY =
  typeof CONFIG !== 'undefined' ? CONFIG.TICKETMASTER_API_KEY : 'test_key';

let currentSort = 'date,asc';
let currentPage = 0;
let allEvents = [];
let currentSearch = '';

function getCurrentSort() {
  return currentSort;
}

function getCurrentSearch() {
  return currentSearch;
}

function setSort(sortValue) {
  currentSort = sortValue;

  // Update active button styling
  document.querySelectorAll('.sort-btn').forEach((btn) => {
    btn.classList.remove('active-sort');
  });
  document
    .getElementById(sortValue === 'date,asc' ? 'sort-date' : 'sort-newest')
    .classList.add('active-sort');

  // Reload events with new sort
  loadEvents();
}

// ── URL Builders ───────────────────────────────────────────────────────────
function getApiUrl() {
  return `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&latlong=47.6062,-122.3321&radius=30&unit=miles&size=100&expand=venues&sort=${currentSort}`;
}

function getSearchUrl(query) {
  const base = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&size=100&expand=venues&sort=${currentSort}`;

  // US state codes — if query matches, search by state
  const stateCodes = [
    'AL',
    'AK',
    'AZ',
    'AR',
    'CA',
    'CO',
    'CT',
    'DE',
    'FL',
    'GA',
    'HI',
    'ID',
    'IL',
    'IN',
    'IA',
    'KS',
    'KY',
    'LA',
    'ME',
    'MD',
    'MA',
    'MI',
    'MN',
    'MS',
    'MO',
    'MT',
    'NE',
    'NV',
    'NH',
    'NJ',
    'NM',
    'NY',
    'NC',
    'ND',
    'OH',
    'OK',
    'OR',
    'PA',
    'RI',
    'SC',
    'SD',
    'TN',
    'TX',
    'UT',
    'VT',
    'VA',
    'WA',
    'WV',
    'WI',
    'WY',
  ];

  // Known Ticketmaster categories
  const categories = [
    'music',
    'sports',
    'arts',
    'theatre',
    'family',
    'comedy',
    'film',
    'miscellaneous',
    'concerts',
    'festivals',
  ];

  const lower = query.toLowerCase().trim();
  const upper = query.toUpperCase().trim();

  if (stateCodes.includes(upper)) {
    return `${base}&stateCode=${upper}&countryCode=US`;
  }

  if (categories.some((cat) => lower.includes(cat))) {
    return `${base}&classificationName=${encodeURIComponent(query)}&countryCode=US`;
  }

  // Default — search by keyword (covers event names, cities, venues)
  return `${base}&keyword=${encodeURIComponent(query)}&countryCode=US`;
}

// ── Search Handlers ────────────────────────────────────────────────────────
function handleSearch() {
  const input = document.getElementById('search-input');
  const query = input.value.trim();

  if (!query) {
    clearSearch();
    return;
  }

  currentSearch = query;
  document.getElementById('clear-search-btn').style.display = 'inline-block';
  loadEvents();
}

function clearSearch() {
  currentSearch = '';
  document.getElementById('search-input').value = '';
  document.getElementById('clear-search-btn').style.display = 'none';
  loadEvents();
}

// ── Allow pressing Enter to trigger search ─────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('search-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSearch();
      });
    }
  });
}

// ── Build one event card from Ticketmaster data ────────────────────────────
function buildEventCard(event) {
  const image =
    event.images
      .filter((img) => img.ratio === '16_9')
      .sort((a, b) => b.width - a.width)[0] || event.images[0];

  const date = event.dates.start.localDate;

  const venue =
    event._embedded && event._embedded.venues && event._embedded.venues[0];
  const city = venue
    ? venue.city.name + ', ' + venue.state.stateCode
    : 'Seattle, WA';
  const venueName = venue ? venue.name : '';

  const card = document.createElement('div');
  card.className = 'event-card';
  card.style.cursor = 'pointer';

  card.innerHTML = `
    <img src="${image.url}" alt="${event.name}">
    <div class="card-title-row">
      <h3>${event.name}</h3>
      <button class="card-btn" onclick="event.stopPropagation()">Save</button>
    </div>
    <p>${venueName}</p>
    <p>${city}</p>
    <p>${date}</p>
  `;

  card.addEventListener('click', () => {
    window.location.href = `event.html?id=${event.id}`;
  });

  const btn = card.querySelector('.card-btn');

  isEventSaved(event.id).then((saved) => {
    if (saved) {
      btn.textContent = 'Saved';
      btn.style.background = '#a5d6a7';
    }
  });

  btn.addEventListener('click', async () => {
    await handleSaveEvent(event, btn);
  });

  return card;
}

// ── Fetch events and display them ──────────────────────────────────────────
function loadEvents() {
  const container = document.querySelector('.event-container');
  container.innerHTML = '<p>Loading events...</p>';

  const url = currentSearch ? getSearchUrl(currentSearch) : getApiUrl();

  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (!data._embedded || !data._embedded.events) {
        allEvents = [];
        currentPage = 0;
        renderPage();
        return;
      }

      const events = data._embedded.events;
      const uniqueEvents = events.filter(
        (event, index, self) =>
          index === self.findIndex((e) => e.name === event.name),
      );

      allEvents = currentSearch
        ? uniqueEvents
        : uniqueEvents.sort(() => Math.random() - 0.5);

      currentPage = 0;
      renderPage();
    })
    .catch((error) => {
      container.innerHTML =
        '<p>Failed to load events. Please try again later.</p>';
      console.error('Error fetching events:', error);
    });
}

function renderPage() {
  const container = document.querySelector('.event-container');
  container.innerHTML = '';

  if (allEvents.length === 0) {
    container.innerHTML =
      '<p>No events found. Try a different search term.</p>';
    return;
  }

  const start = currentPage * 12;
  const end = start + 12;
  const pageEvents = allEvents.slice(start, end);

  pageEvents.forEach((event) => {
    const card = buildEventCard(event);
    container.appendChild(card);
  });

  renderPagination();
}

function renderPagination() {
  const existing = document.querySelector('.pagination');
  if (existing) existing.remove();

  const totalPages = Math.ceil(allEvents.length / 12);
  if (totalPages <= 1) return;

  const pagination = document.createElement('div');
  pagination.className = 'pagination';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerText = 'Previous';
  prevBtn.disabled = currentPage === 0;
  prevBtn.addEventListener('click', () => {
    currentPage--;
    renderPage();
    window.scrollTo(0, 0);
  });
  pagination.appendChild(prevBtn);

  for (let i = 0; i < totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = 'page-btn' + (i === currentPage ? ' active-page' : '');
    pageBtn.innerText = i + 1;
    pageBtn.addEventListener('click', () => {
      currentPage = i;
      renderPage();
      window.scrollTo(0, 0);
    });
    pagination.appendChild(pageBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerText = 'Next';
  nextBtn.disabled = currentPage === totalPages - 1;
  nextBtn.addEventListener('click', () => {
    currentPage++;
    renderPage();
    window.scrollTo(0, 0);
  });
  pagination.appendChild(nextBtn);

  const container = document.querySelector('.event-container');
  container.insertAdjacentElement('afterend', pagination);
}

// ── Run when page loads ────────────────────────────────────────────────────
if (typeof window !== 'undefined' && typeof module === 'undefined') {
  loadEvents();
}

// ── Expose functions to global scope for HTML onclick handlers ────────────
if (typeof window !== 'undefined') {
  window.setSort = setSort;
  window.handleSearch = handleSearch;
  window.clearSearch = clearSearch;
}

// ── Exports (for Jest tests) ──────────────────────────────────────────────
if (typeof module !== 'undefined') {
  module.exports = {
    getApiUrl,
    getSearchUrl,
    buildEventCard,
    loadEvents,
    setSort,
    getCurrentSort,
    getCurrentSearch,
    handleSearch,
    clearSearch,
    renderPage,
    renderPagination,
  };
}
