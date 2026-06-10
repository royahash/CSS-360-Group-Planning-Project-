/**
 * @jest-environment jsdom
 */

document.body.innerHTML = `
  <input id="check-all" type="checkbox" checked>
  <input id="check-my-calendar" type="checkbox" checked>
  <input id="check-event-requests" type="checkbox" checked>
  <input id="check-friend-events" type="checkbox" checked>

  <div id="calendarEvents"></div>
`;

global.getSavedEvents = jest.fn(() =>
  Promise.resolve([
    {
      title: 'Concert',
      startDate: '2026-11-05',
      ticketmasterId: '123',
      userId: 'user1',
    },
  ]),
);

global.fetch = jest.fn((url) => {
  if (url === '/auth/me') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 'user1' }),
    });
  }

  return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
});

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

jest.resetModules();
const calendar = require('../src/js/calendar.js');

describe('Calendar DOM Tests', () => {
  beforeEach(() => {
    document.getElementById('check-all').checked = true;
    document.getElementById('check-my-calendar').checked = true;
    document.getElementById('check-event-requests').checked = true;
    document.getElementById('check-friend-events').checked = true;

    calendar.updateActiveCalendars();
  });

  test('toggleSelectAll does not throw', () => {
    expect(() => calendar.toggleSelectAll()).not.toThrow();
  });

  test('my calendar events are visible when checked', () => {
    expect(
      calendar.shouldShowEvent({
        source: 'my',
      }),
    ).toBe(true);
  });

  test('event request events are hidden when unchecked', () => {
    document.getElementById('check-event-requests').checked = false;

    calendar.updateActiveCalendars();

    expect(
      calendar.shouldShowEvent({
        source: 'event-request',
      }),
    ).toBe(false);
  });

  test('friend events are hidden when unchecked', () => {
    document.getElementById('check-friend-events').checked = false;

    calendar.updateActiveCalendars();

    expect(
      calendar.shouldShowEvent({
        source: 'friend',
      }),
    ).toBe(false);
  });

  test('events without a source default to My Calendar', () => {
    expect(
      calendar.shouldShowEvent({
        title: 'Saved Ticketmaster Event',
      }),
    ).toBe(true);
  });
});
