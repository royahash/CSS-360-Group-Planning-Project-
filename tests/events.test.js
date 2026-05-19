/**
 * events.test.js
 * Unit, Integration, and Smoke Tests for events.js
 * Event Explorer — Homepage Ticketmaster API Feature
 *
 * Run with: npx jest tests/events.test.js
 */
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ _embedded: { events: [] } }),
  }),
);
const {
  getApiUrl,
  buildEventCard,
  loadEvents,
  setSort,
  getCurrentSort,
} = require('../src/js/events');

// ── Mock Data ────────────────────────────────────────────────────────────────
// This is a fake event object that matches the real Ticketmaster JSON structure.
// We use this instead of making real API calls during tests.
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
      fallback: false,
    },
    {
      ratio: '16_9',
      url: 'https://example.com/medium.jpg',
      width: 640,
      height: 360,
      fallback: false,
    },
    {
      ratio: '16_9',
      url: 'https://example.com/large.jpg',
      width: 2048,
      height: 1152,
      fallback: false,
    },
  ],
  dates: {
    start: {
      localDate: '2026-11-05',
    },
  },
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

// Mock for fetch so tests don't make real API calls
const mockApiResponse = {
  _embedded: {
    events: [mockEvent],
  },
};

// Reset DOM and sort before each test
beforeEach(() => {
  // Set up a basic DOM with the event container
  document.body.innerHTML = `
    <div class="event-container"></div>
    <button class="sort-btn active-sort" id="sort-date">Soonest</button>
    <button class="sort-btn" id="sort-newest">Latest</button>
  `;

  // Reset fetch mock fresh for each test
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(mockApiResponse),
    }),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SMOKE TESTS
// Basic sanity checks — does everything exist and start without crashing?
// ─────────────────────────────────────────────────────────────────────────────
describe('Smoke Tests', () => {
  test('getApiUrl function exists and returns a string', () => {
    expect(typeof getApiUrl).toBe('function');
    expect(typeof getApiUrl()).toBe('string');
  });

  test('buildEventCard function exists', () => {
    expect(typeof buildEventCard).toBe('function');
  });

  test('loadEvents function exists', () => {
    expect(typeof loadEvents).toBe('function');
  });

  test('setSort function exists', () => {
    expect(typeof setSort).toBe('function');
  });

  test('event container exists in the DOM', () => {
    const container = document.querySelector('.event-container');
    expect(container).not.toBeNull();
  });

  test('getApiUrl returns a URL that starts with https', () => {
    const url = getApiUrl();
    expect(url.startsWith('https://')).toBe(true);
  });

  test('getApiUrl contains the Ticketmaster base endpoint', () => {
    const url = getApiUrl();
    expect(url).toContain('app.ticketmaster.com/discovery/v2/events.json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT TESTS
// Test each function in isolation with controlled input
// ─────────────────────────────────────────────────────────────────────────────
describe('getApiUrl() — Unit Tests', () => {
  test('includes date,asc sort by default', () => {
    setSort('date,asc');
    expect(getApiUrl()).toContain('sort=date,asc');
  });

  test('includes date,desc when sort is set to latest', () => {
    setSort('date,desc');
    expect(getApiUrl()).toContain('sort=date,desc');
  });

  test('includes Seattle coordinates', () => {
    const url = getApiUrl();
    expect(url).toContain('47.6062');
    expect(url).toContain('-122.3321');
  });

  test('includes expand=venues parameter', () => {
    expect(getApiUrl()).toContain('expand=venues');
  });
});

describe('setSort() — Unit Tests', () => {
  test('updates currentSort to date,asc', () => {
    setSort('date,asc');
    expect(getCurrentSort()).toBe('date,asc');
  });

  test('updates currentSort to date,desc', () => {
    setSort('date,desc');
    expect(getCurrentSort()).toBe('date,desc');
  });

  test('updates the active sort button styling', () => {
    setSort('date,desc');
    const newestBtn = document.getElementById('sort-newest');
    expect(newestBtn.classList.contains('active-sort')).toBe(true);
  });

  test('removes active-sort from previously active button', () => {
    setSort('date,desc');
    const dateBtn = document.getElementById('sort-date');
    expect(dateBtn.classList.contains('active-sort')).toBe(false);
  });
});

describe('buildEventCard() — Unit Tests', () => {
  test('returns a div element', () => {
    const card = buildEventCard(mockEvent);
    expect(card.tagName).toBe('DIV');
  });

  test('card has the event-card class', () => {
    const card = buildEventCard(mockEvent);
    expect(card.classList.contains('event-card')).toBe(true);
  });

  test('card displays the correct event name', () => {
    const card = buildEventCard(mockEvent);
    expect(card.innerHTML).toContain('Teddy Swims: The UGLY Tour');
  });

  test('card displays the correct date', () => {
    const card = buildEventCard(mockEvent);
    expect(card.innerHTML).toContain('2026-11-05');
  });

  test('card displays the correct venue name', () => {
    const card = buildEventCard(mockEvent);
    expect(card.innerHTML).toContain('Climate Pledge Arena');
  });

  test('card displays the correct city', () => {
    const card = buildEventCard(mockEvent);
    expect(card.innerHTML).toContain('Seattle, WA');
  });

  test('card selects the largest 16_9 image', () => {
    const card = buildEventCard(mockEvent);
    expect(card.innerHTML).toContain('https://example.com/large.jpg');
  });

  test('card has a Save button', () => {
    const card = buildEventCard(mockEvent);
    const btn = card.querySelector('.card-btn');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('Save');
  });

  test('card falls back to Seattle WA when no venue provided', () => {
    const eventNoVenue = { ...mockEvent, _embedded: {} };
    const card = buildEventCard(eventNoVenue);
    expect(card.innerHTML).toContain('Seattle, WA');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION TESTS
// Test that multiple functions work correctly together
// ─────────────────────────────────────────────────────────────────────────────
describe('setSort() + getApiUrl() — Integration Tests', () => {
  test('changing sort updates the URL used for fetching', () => {
    setSort('date,asc');
    expect(getApiUrl()).toContain('sort=date,asc');

    setSort('date,desc');
    expect(getApiUrl()).toContain('sort=date,desc');
  });

  test('URL always reflects the most recently set sort', () => {
    setSort('date,asc');
    setSort('date,desc');
    setSort('date,asc');
    expect(getApiUrl()).toContain('sort=date,asc');
  });
});

describe('loadEvents() + buildEventCard() — Integration Tests', () => {
  test('loadEvents calls fetch once', async () => {
    await loadEvents();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('loadEvents calls fetch with a URL containing the API endpoint', async () => {
    await loadEvents();
    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain('app.ticketmaster.com');
  });

  test('loadEvents populates the event container with cards', async () => {
    await loadEvents();
    const container = document.querySelector('.event-container');
    const cards = container.querySelectorAll('.event-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  test('cards built by loadEvents contain real event names', async () => {
    await loadEvents();
    const container = document.querySelector('.event-container');
    expect(container.innerHTML).toContain('Teddy Swims: The UGLY Tour');
  });

  test('changing sort and reloading fetches with new sort value', async () => {
    setSort('date,desc');
    await loadEvents();
    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain('sort=date,desc');
  });
});
