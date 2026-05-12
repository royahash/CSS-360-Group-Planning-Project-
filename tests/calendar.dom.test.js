/**
 * @jest-environment jsdom
 */

// Set up fake HTML BEFORE importing your script
document.body.innerHTML = `
  <input id="check-all" type="checkbox" checked>
  <input id="check-you" type="checkbox" checked>
  <input id="check-alex" type="checkbox" checked>
  <input id="check-jordan" type="checkbox" checked>
  <div id="calendar"></div>
`;

const calendar = require('../src/js/calendar.js');

describe('Calendar UI Behavior Tests', () => {
  beforeEach(() => {
    // Reset all checkboxes before each test
    calendar.checkboxes['You'].checked = true;
    calendar.checkboxes['Alex'].checked = true;
    calendar.checkboxes['Jordan'].checked = true;
    calendar.selectAllCheckbox.checked = true;

    calendar.updateActiveCalendars();
  });

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
});
