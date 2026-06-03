// calendarLogic.js

function shouldShowEvent(event, activeCalendars) {
  return activeCalendars.includes(event.owner);
}

function getActiveCalendars(checkboxes) {
  return Object.keys(checkboxes).filter((name) => checkboxes[name]);
}

function toggleAll(checkboxes, value) {
  const updated = {};
  Object.keys(checkboxes).forEach((name) => {
    updated[name] = value;
  });
  return updated;
}

function getEventsForDate(events, date, activeCalendars) {
  return events.filter((event) => {
    return event.date === date && activeCalendars.includes(event.owner);
  });
}

module.exports = {
  shouldShowEvent,
  getActiveCalendars,
  toggleAll,
  getEventsForDate,
};
