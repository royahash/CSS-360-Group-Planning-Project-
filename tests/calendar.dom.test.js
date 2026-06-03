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

const calendar = require('../src/js/calendar.js');

beforeEach(() => {
  calendar.checkboxes['You'].checked = true;
  calendar.checkboxes['Alex'].checked = true;
  calendar.checkboxes['Jordan'].checked = true;
  // selectAllCheckbox is null in the refactored calendar — removed
  calendar.updateActiveCalendars();
});

describe('Calendar UI Behavior Tests', () => {
  test('toggleSelectAll does not throw when selectAllCheckbox is null', () => {
    expect(() => calendar.toggleSelectAll()).not.toThrow();
  });

  test('Unchecking one user removes them from active calendars', () => {
    calendar.checkboxes['Alex'].checked = false;
    calendar.updateActiveCalendars();
    expect(calendar.shouldShowEvent({ owner: 'Alex' })).toBe(false);
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
