/**
 * @jest-environment jsdom
 */

// ─────────────────────────────────────────────
// DOM SETUP (MUST BE FIRST)
// ─────────────────────────────────────────────
document.body.innerHTML = `
  <input id="check-all" type="checkbox" checked>
  <input id="check-you" type="checkbox" checked>
  <input id="check-alex" type="checkbox" checked>
  <input id="check-jordan" type="checkbox" checked>
  <div id="calendar"></div>
`;

// ─────────────────────────────────────────────
// MOCK API LAYER (IMPORTANT FOR YOUR CODE)
// ─────────────────────────────────────────────
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve([
        {
          title: 'Friend Event',
          date: '2026-11-05',
          owner: 'Alex',
          ticketmasterId: '',
        },
      ]),
  }),
);

// REQUIRED because api.js is imported indirectly
global.getSavedEvents = jest.fn(() =>
  Promise.resolve([
    {
      title: 'My Event',
      startDate: '2026-11-05',
      owner: 'You',
      ticketmasterId: '123',
    },
  ]),
);

// prevent noisy console errors from failing tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// ─────────────────────────────────────────────
// IMPORT AFTER MOCKS (CRITICAL)
// ─────────────────────────────────────────────
const calendar = require('../src/js/calendar.js');

// ─────────────────────────────────────────────
// TEST STATE RESET
// ─────────────────────────────────────────────
beforeEach(() => {
  calendar.checkboxes['You'].checked = true;
  calendar.checkboxes['Alex'].checked = true;
  calendar.checkboxes['Jordan'].checked = true;

  calendar.selectAllCheckbox.checked = true;

  calendar.updateActiveCalendars();
});

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────
describe('Calendar UI Behavior Tests', () => {
  test('Select All toggles all users OFF', () => {
    calendar.selectAllCheckbox.checked = false;
    calendar.toggleSelectAll();

    expect(calendar.checkboxes['You'].checked).toBe(false);
    expect(calendar.checkboxes['Alex'].checked).toBe(false);
    expect(calendar.checkboxes['Jordan'].checked).toBe(false);
  });

  test('Unchecking one user unchecks Select All', () => {
    calendar.checkboxes['Alex'].checked = false;
    calendar.togglePerson();

    expect(calendar.selectAllCheckbox.checked).toBe(false);
  });

  test('shouldShowEvent filters by active calendars', () => {
    const event = { owner: 'Alex' };

    calendar.checkboxes['Alex'].checked = true;
    calendar.updateActiveCalendars();

    expect(calendar.shouldShowEvent(event)).toBe(true);
  });

  test('should hide event when owner is unchecked', () => {
    const event = { owner: 'Jordan' };

    calendar.checkboxes['Jordan'].checked = false;
    calendar.updateActiveCalendars();

    expect(calendar.shouldShowEvent(event)).toBe(false);
  });
});
