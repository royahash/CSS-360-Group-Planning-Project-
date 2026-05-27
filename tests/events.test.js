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
  buildEventCard,
  loadEvents,
  setSort,
  getCurrentSort,
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
  _embedded: {
    events: [mockEvent],
  },
};

// ── HELPERS ────────────────────────────────────────────────────────────────
const flushPromises = () => Promise.resolve();

// ── RESET BEFORE EACH TEST ─────────────────────────────────────────────────
beforeEach(() => {
  document.body.innerHTML = `
    <div class="event-container"></div>
    <button class="sort-btn active-sort" id="sort-date">Soonest</button>
    <button class="sort-btn" id="sort-newest">Latest</button>
  `;

  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(mockApiResponse),
    }),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SMOKE TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('Smoke Tests', () => {
  test('functions exist', () => {
    expect(typeof getApiUrl).toBe('function');
    expect(typeof buildEventCard).toBe('function');
    expect(typeof loadEvents).toBe('function');
    expect(typeof setSort).toBe('function');
  });

  test('event container exists', () => {
    expect(document.querySelector('.event-container')).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('getApiUrl()', () => {
  test('returns valid https url', () => {
    expect(getApiUrl().startsWith('https://')).toBe(true);
  });

  test('includes Ticketmaster endpoint', () => {
    expect(getApiUrl()).toContain(
      'app.ticketmaster.com/discovery/v2/events.json',
    );
  });

  test('includes coordinates', () => {
    const url = getApiUrl();
    expect(url).toContain('47.6062');
    expect(url).toContain('-122.3321');
  });
});

describe('setSort()', () => {
  test('updates sort value', () => {
    setSort('date,asc');
    expect(getCurrentSort()).toBe('date,asc');
  });

  test('toggles active button', () => {
    setSort('date,desc');
    expect(
      document.getElementById('sort-newest').classList.contains('active-sort'),
    ).toBe(true);
    expect(
      document.getElementById('sort-date').classList.contains('active-sort'),
    ).toBe(false);
  });
});

describe('buildEventCard()', () => {
  test('creates event card', () => {
    const card = buildEventCard(mockEvent);
    expect(card.tagName).toBe('DIV');
  });

  test('contains event info', () => {
    const card = buildEventCard(mockEvent);
    expect(card.innerHTML).toContain('Teddy Swims: The UGLY Tour');
    expect(card.innerHTML).toContain('2026-11-05');
    expect(card.innerHTML).toContain('Climate Pledge Arena');
    expect(card.innerHTML).toContain('Seattle, WA');
  });

  test('uses largest image', () => {
    const card = buildEventCard(mockEvent);
    expect(card.innerHTML).toContain('https://example.com/large.jpg');
  });

  test('has save button', () => {
    const card = buildEventCard(mockEvent);
    const btn = card.querySelector('.card-btn');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('Save');
  });

  test('fallback venue works', () => {
    const eventNoVenue = { ...mockEvent, _embedded: {} };
    const card = buildEventCard(eventNoVenue);
    expect(card.innerHTML).toContain('Seattle, WA');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('loadEvents integration', () => {
  test('fetch called once', async () => {
    await loadEvents();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('fetch URL is correct', async () => {
    await loadEvents();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('app.ticketmaster.com');
  });

  test('renders event cards', async () => {
    await loadEvents();
    await flushPromises();

    const container = document.querySelector('.event-container');
    const cards = container.querySelectorAll('.event-card');

    expect(cards.length).toBeGreaterThan(0);
  });

  test('renders correct event name', async () => {
    await loadEvents();
    await flushPromises();

    const container = document.querySelector('.event-container');
    expect(container.innerHTML).toContain('Teddy Swims: The UGLY Tour');
  });

  test('sort affects API request', async () => {
    setSort('date,desc');
    await loadEvents();

    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('sort=date,desc');
  });
});
