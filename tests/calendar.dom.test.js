/**
 * @jest-environment jsdom
 */
document.body.innerHTML = `
  <input id="check-all" type="checkbox" checked>
  <input id="check-you" type="checkbox" checked>
  <input id="check-alex" type="checkbox" checked>
  <input id="check-jordan" type="checkbox" checked>
  <div id="calendar"></div>
`;

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

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

jest.resetModules();
const calendar = require('../src/js/calendar.js');

beforeEach(() => {
  const youEl = document.getElementById('check-you');
  const alexEl = document.getElementById('check-alex');
  const jordanEl = document.getElementById('check-jordan');
  if (youEl) youEl.checked = true;
  if (alexEl) alexEl.checked = true;
  if (jordanEl) jordanEl.checked = true;
  calendar.updateActiveCalendars();
});

describe('Calendar UI Behavior Tests', () => {
  test('toggleSelectAll does not throw when selectAllCheckbox is null', () => {
    expect(() => calendar.toggleSelectAll()).not.toThrow();
  });

  test('Unchecking one user removes them from active calendars', () => {
    const alexEl = document.getElementById('check-alex');
    if (alexEl) alexEl.checked = false;
    calendar.updateActiveCalendars();
    expect(calendar.shouldShowEvent({ owner: 'Alex' })).toBe(false);
  });

  test('shouldShowEvent returns false for owner not in any calendar', () => {
    calendar.updateActiveCalendars();
    expect(calendar.shouldShowEvent({ owner: 'UnknownPerson' })).toBe(false);
  });

  test('should hide event when owner is unchecked', () => {
    const jordanEl = document.getElementById('check-jordan');
    if (jordanEl) jordanEl.checked = false;
    calendar.updateActiveCalendars();
    expect(calendar.shouldShowEvent({ owner: 'Jordan' })).toBe(false);
  });
});
