/**
 * @jest-environment jsdom
 */

/**
 * events.test.js
 * Unit, Integration, and Smoke Tests for events.js
 */

global.fetch = jest.fn();

const {
  getApiUrl,
  getSearchUrl,
  buildEventCard,
  loadEvents,
  setSort,
  getCurrentSort,
  getCurrentSearch,
  handleSearch,
  clearSearch,
} = require('../src/js/events');

// ── MOCK MISSING GLOBAL DEPENDENCIES ────────────────────────────────────────
global.isEventSaved = jest.fn(() => Promise.resolve(false));
global.getSavedEvents = jest.fn(() => []);

// silence expected console errors from app code
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const mockEvent = {
  name: 'Teddy Swims: The UGLY Tour',
  id: 'vvG1HZ_FUJPIyp',
  url: 'https://www.ticketmaster.com/event/123',
  images: [
    {
      ratio: '3_2',
      url: 'https://example.com/small.jpg',
      width: 305,
      height: 203,
    },
    {
      ratio: '16_9',
      url: 'https://example.com/medium.jpg',
      width: 640,
      height: 360,
    },
    {
      ratio: '16_9',
      url: 'https://example.com/large.jpg',
      width: 2048,
      height: 1152,
    },
  ],
  dates: { start: { localDate: '2026-11-05' } },
  _embedded: {
    venues: [
      {
        name: 'Climate Pledge Arena',
        city: { name: 'Seattle' },
        state: { stateCode: 'WA' },
      },
    ],
  },
};

const mockApiResponse = {
  _embedded: { events: [mockEvent] },
};

// ── HELPERS ────────────────────────────────────────────────────────────────
const flushPromises = () => Promise.resolve();

// ── RESET BEFORE EACH TEST ─────────────────────────────────────────────────
beforeEach(() => {
  document.body.innerHTML = `
    <div class="event-container"></div>
    <input type="text" id="search-input" />
    <button id="search-btn">Search</button>
    <button id="clear-search-btn" style="display:none;">Clear</button>
    <button class="sort-btn active-sort" id="sort-date">Soonest</button>
    <button class="sort-btn" id="sort-newest">Latest</button>
  `;

  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(mockApiResponse),
    }),
  );

  clearSearch();
});

// ─────────────────────────────────────────────────────────────────────────────
// SMOKE TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('Smoke Tests', () => {
  test('all functions exist', () => {
    expect(typeof getApiUrl).toBe('function');
    expect(typeof getSearchUrl).toBe('function');
    expect(typeof buildEventCard).toBe('function');
    expect(typeof loadEvents).toBe('function');
    expect(typeof setSort).toBe('function');
    expect(typeof handleSearch).toBe('function');
    expect(typeof clearSearch).toBe('function');
  });

  test('event container exists in DOM', () => {
    expect(document.querySelector('.event-container')).not.toBeNull();
  });

  test('search input exists in DOM', () => {
    expect(document.getElementById('search-input')).not.toBeNull();
  });

  test('search button exists in DOM', () => {
    expect(document.getElementById('search-btn')).not.toBeNull();
  });

  test('clear button exists in DOM', () => {
    expect(document.getElementById('clear-search-btn')).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT TESTS — getApiUrl
// ─────────────────────────────────────────────────────────────────────────────
describe('getApiUrl()', () => {
  test('returns our backend proxy URL', () => {
    expect(getApiUrl()).toContain('/api/ticketmaster/events');
  });

  test('includes Seattle coordinates', () => {
    const url = getApiUrl();
    expect(url).toContain('47.6062');
    expect(url).toContain('-122.3321');
  });

  test('includes sort parameter', () => {
    expect(getApiUrl()).toContain('sort=');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT TESTS — getSearchUrl
// ─────────────────────────────────────────────────────────────────────────────
describe('getSearchUrl()', () => {
  test('returns our backend proxy URL', () => {
    expect(getSearchUrl('concert')).toContain('/api/ticketmaster/events');
  });

  test('uses stateCode for US state abbreviations', () => {
    const url = getSearchUrl('WA');
    expect(url).toContain('stateCode=WA');
    expect(url).toContain('countryCode=US');
  });

  test('uses stateCode for lowercase state input', () => {
    const url = getSearchUrl('wa');
    expect(url).toContain('stateCode=WA');
  });

  test('uses classificationName for known categories', () => {
    const url = getSearchUrl('music');
    expect(url).toContain('classificationName=music');
  });

  test('uses classificationName for sports category', () => {
    const url = getSearchUrl('sports');
    expect(url).toContain('classificationName=sports');
  });

  test('uses keyword for general event name searches', () => {
    const url = getSearchUrl('Teddy Swims');
    expect(url).toContain('keyword=Teddy%20Swims');
  });

  test('uses keyword for city name searches', () => {
    const url = getSearchUrl('Chicago');
    expect(url).toContain('keyword=Chicago');
  });

  test('includes countryCode US for all searches', () => {
    expect(getSearchUrl('music')).toContain('countryCode=US');
    expect(getSearchUrl('WA')).toContain('countryCode=US');
    expect(getSearchUrl('Chicago')).toContain('countryCode=US');
  });

  test('includes current sort parameter', () => {
    setSort('date,asc');
    expect(getSearchUrl('music')).toContain('sort=date,asc');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT TESTS — getCurrentSearch
// ─────────────────────────────────────────────────────────────────────────────
describe('getCurrentSearch()', () => {
  test('returns empty string by default', () => {
    expect(getCurrentSearch()).toBe('');
  });

  test('returns current search after handleSearch is called', () => {
    document.getElementById('search-input').value = 'Seattle';
    handleSearch();
    expect(getCurrentSearch()).toBe('Seattle');
  });

  test('returns empty string after clearSearch is called', () => {
    document.getElementById('search-input').value = 'Seattle';
    handleSearch();
    clearSearch();
    expect(getCurrentSearch()).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT TESTS — handleSearch and clearSearch
// ─────────────────────────────────────────────────────────────────────────────
describe('handleSearch()', () => {
  test('sets currentSearch to input value', () => {
    document.getElementById('search-input').value = 'jazz festival';
    handleSearch();
    expect(getCurrentSearch()).toBe('jazz festival');
  });

  test('shows clear button after search', () => {
    document.getElementById('search-input').value = 'Chicago';
    handleSearch();
    const clearBtn = document.getElementById('clear-search-btn');
    expect(clearBtn.style.display).toBe('inline-block');
  });

  test('calls loadEvents when search query is provided', () => {
    document.getElementById('search-input').value = 'concert';
    handleSearch();
    expect(global.fetch).toHaveBeenCalled();
  });

  test('calls clearSearch when input is empty', () => {
    document.getElementById('search-input').value = '';
    handleSearch();
    expect(getCurrentSearch()).toBe('');
  });

  test('trims whitespace from search input', () => {
    document.getElementById('search-input').value = '  Seattle  ';
    handleSearch();
    expect(getCurrentSearch()).toBe('Seattle');
  });
});

describe('clearSearch()', () => {
  test('resets currentSearch to empty string', () => {
    document.getElementById('search-input').value = 'music';
    handleSearch();
    clearSearch();
    expect(getCurrentSearch()).toBe('');
  });

  test('clears the search input field', () => {
    document.getElementById('search-input').value = 'music';
    handleSearch();
    clearSearch();
    expect(document.getElementById('search-input').value).toBe('');
  });

  test('hides the clear button', () => {
    document.getElementById('search-input').value = 'music';
    handleSearch();
    clearSearch();
    const clearBtn = document.getElementById('clear-search-btn');
    expect(clearBtn.style.display).toBe('none');
  });

  test('calls loadEvents to restore default feed', () => {
    clearSearch();
    expect(global.fetch).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT TESTS — setSort
// ─────────────────────────────────────────────────────────────────────────────
describe('setSort()', () => {
  test('updates sort value to date,asc', () => {
    setSort('date,asc');
    expect(getCurrentSort()).toBe('date,asc');
  });

  test('updates sort value to date,desc', () => {
    setSort('date,desc');
    expect(getCurrentSort()).toBe('date,desc');
  });

  test('toggles active button to Latest', () => {
    setSort('date,desc');
    expect(
      document.getElementById('sort-newest').classList.contains('active-sort'),
    ).toBe(true);
    expect(
      document.getElementById('sort-date').classList.contains('active-sort'),
    ).toBe(false);
  });

  test('toggles active button back to Soonest', () => {
    setSort('date,desc');
    setSort('date,asc');
    expect(
      document.getElementById('sort-date').classList.contains('active-sort'),
    ).toBe(true);
    expect(
      document.getElementById('sort-newest').classList.contains('active-sort'),
    ).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT TESTS — buildEventCard
// ─────────────────────────────────────────────────────────────────────────────
describe('buildEventCard()', () => {
  test('creates a div element', () => {
    const card = buildEventCard(mockEvent);
    expect(card.tagName).toBe('DIV');
  });

  test('contains event name', () => {
    const card = buildEventCard(mockEvent);
    expect(card.innerHTML).toContain('Teddy Swims: The UGLY Tour');
  });

  test('contains event date', () => {
    const card = buildEventCard(mockEvent);
    expect(card.innerHTML).toContain('2026-11-05');
  });

  test('contains venue name', () => {
    const card = buildEventCard(mockEvent);
    expect(card.innerHTML).toContain('Climate Pledge Arena');
  });

  test('contains city and state', () => {
    const card = buildEventCard(mockEvent);
    expect(card.innerHTML).toContain('Seattle, WA');
  });

  test('uses largest 16:9 image', () => {
    const card = buildEventCard(mockEvent);
    expect(card.innerHTML).toContain('https://example.com/large.jpg');
  });

  test('has save button', () => {
    const card = buildEventCard(mockEvent);
    const btn = card.querySelector('.card-btn');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('Save');
  });

  test('fallback city when no venue', () => {
    const eventNoVenue = { ...mockEvent, _embedded: {} };
    const card = buildEventCard(eventNoVenue);
    expect(card.innerHTML).toContain('Seattle, WA');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT TESTS — renderPage no results
// ─────────────────────────────────────────────────────────────────────────────
describe('renderPage() — no results', () => {
  test('shows no results message when allEvents is empty', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
      }),
    );
    await loadEvents();
    await flushPromises();
    const container = document.querySelector('.event-container');
    expect(container.innerHTML).toContain('No events found');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('loadEvents() integration', () => {
  test('fetch is called', async () => {
    global.fetch.mockClear();
    await loadEvents();
    expect(global.fetch).toHaveBeenCalled();
  });

  test('fetch URL contains our backend proxy', async () => {
    await loadEvents();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('/api/ticketmaster/events');
  });

  test('renders event cards after fetch', async () => {
    await loadEvents();
    await flushPromises();
    const cards = document.querySelectorAll('.event-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  test('renders correct event name', async () => {
    await loadEvents();
    await flushPromises();
    expect(document.querySelector('.event-container').innerHTML).toContain(
      'Teddy Swims: The UGLY Tour',
    );
  });

  test('sort affects API request URL', async () => {
    global.fetch.mockClear();
    setSort('date,desc');
    await loadEvents();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('sort=date,desc');
    setSort('date,asc');
  });

  test('search uses getSearchUrl when currentSearch is set', async () => {
    global.fetch.mockClear();
    document.getElementById('search-input').value = 'music';
    handleSearch();
    await flushPromises();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('classificationName=music');
  });

  test('clear search restores default API URL', async () => {
    document.getElementById('search-input').value = 'music';
    handleSearch();
    clearSearch();
    await flushPromises();
    const lastCall =
      global.fetch.mock.calls[global.fetch.mock.calls.length - 1][0];
    expect(lastCall).toContain('latlong=47.6062');
  });

  test('shows loading message while fetching', () => {
    loadEvents();
    const container = document.querySelector('.event-container');
    expect(container.innerHTML).toContain('Loading events');
  });

  test('shows error message when fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
    await loadEvents();
    const container = document.querySelector('.event-container');
    expect(container.innerHTML).toContain('Failed to load events');
  });
});
