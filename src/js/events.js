/**
 * events.js
 * Fetches real events from Ticketmaster API and builds event cards
 * on the homepage dynamically.
 */
/* global handleSaveEvent, isEventSaved */

//const CITY = "Seattle";
let currentSort = 'date,asc';
let currentPage = 0;
let allEvents = [];
let currentSearch = '';

let selectedCategories = [];

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
  return `/api/ticketmaster/events?latlong=47.6062,-122.3321&radius=30&unit=miles&sort=${currentSort}`;
}

function getSearchUrl(query) {
  const base = `/api/ticketmaster/events?sort=${currentSort}`;

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
    setupFilters();

    const input = document.getElementById('search-input');

    const categorySearch = sessionStorage.getItem('searchCategory');

    if (categorySearch) {
      currentSearch = categorySearch;

      if (input) {
        input.value = categorySearch;
      }

      document.getElementById('clear-search-btn').style.display =
        'inline-block';

      sessionStorage.removeItem('searchCategory');

      loadEvents();
    } else {
      loadEvents();
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleSearch();
        }
      });
    }
  });
}

// ── Build one event card from Ticketmaster data ────────────────────────────
function buildEventCard(event) {
  // Find a 16:9 image or fall back to the first available
  const image =
    event.images
      .filter((img) => img.ratio === '16_9') //collects ALL the 16_9 images into a list
      .sort((a, b) => b.width - a.width)[0] || event.images[0]; // sorts them from widest to narrowest and piks the first one

  // Get date
  const date = event.dates.start.localDate;

  // Get venue - lives inside _embedded.venues[0]
  const venue =
    event._embedded && event._embedded.venues && event._embedded.venues[0];
  const city = venue
    ? venue.city.name + ', ' + venue.state.stateCode
    : 'Seattle, WA';
  const venueName = venue ? venue.name : '';

  // Build the card element
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
    window.location.href = `/html/event.html?id=${event.id}`;
  });

  const btn = card.querySelector('.card-btn');

  // LOAD INITIAL BUTTON STATE
  isEventSaved(event.id).then((saved) => {
    if (saved) {
      btn.textContent = 'Saved';
      btn.style.background = '#a5d6a7';
    }
  });

  // SAVE / UNSAVE
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

      const now = new Date();
      const futureEvents = events.filter((event) => {
        const dateStr =
          event.dates?.start?.dateTime || event.dates?.start?.localDate;
        if (!dateStr) return true; // no date info, include it
        return new Date(dateStr) >= now;
      });

      const uniqueEvents = futureEvents.filter(
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

function setupFilters() {
  const filterBtn = document.getElementById('filter-btn');
  const panel = document.getElementById('filter-panel');

  filterBtn.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  });

  panel.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', applyFilters);
  });
}

function applyFilters() {
  selectedCategories = Array.from(
    document.querySelectorAll('#filter-panel input[type="checkbox"]:checked'),
  ).map((checkbox) => checkbox.value);

  currentPage = 0;

  renderPage();
}

function renderPage() {
  const container = document.querySelector('.event-container');
  container.innerHTML = '';

  let filteredEvents = allEvents;

  if (selectedCategories.length > 0) {
    filteredEvents = allEvents.filter((event) => {
      const segment = event.classifications?.[0]?.segment?.name;

      return selectedCategories.includes(segment);
    });
  }

  if (filteredEvents.length === 0) {
    container.innerHTML = '<p>No events found for selected categories.</p>';
    return;
  }

  const start = currentPage * 12;
  const end = start + 12;

  const pageEvents = filteredEvents.slice(start, end);

  pageEvents.forEach((event) => {
    container.appendChild(buildEventCard(event));
  });

  renderPagination(filteredEvents);
}

function renderPagination(events = allEvents) {
  // Remove existing pagination if any
  const existing = document.querySelector('.pagination');
  if (existing) existing.remove();

  const totalPages = Math.ceil(events.length / 12);
  if (totalPages <= 1) return;

  const pagination = document.createElement('div');
  pagination.className = 'pagination';

  // Previous button
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

  // Next button
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

  // Insert after the event container
  const container = document.querySelector('.event-container');
  container.insertAdjacentElement('afterend', pagination);
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
