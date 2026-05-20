function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function getSavedEvents() {
  if (!localStorage.getItem('token')) return [];
  const res = await fetch('/api/events', {
    headers: getAuthHeader()
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function saveEventToDatabase(eventData) {
  const res = await fetch('/api/events', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body:    JSON.stringify(eventData)
  });
  return res.json();
}

async function deleteSavedEvent(ticketmasterId) {
  await fetch(`/api/events/${ticketmasterId}`, {
    method:  'DELETE',
    headers: getAuthHeader()
  });
}

/**
 * Make functions available globally for other scripts (calendar.js, etc.)
 * This fixes ESLint "no-undef" across multi-script architecture
 */
async function getCalendarEntries() {
  const res = await fetch('/api/calendar', { 
    headers: getAuthHeader() 
  });
  return res.json();
}

async function savePreferences(preferences) {
  const res = await fetch('/api/preferences', {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body:    JSON.stringify(preferences)
  });
  return res.json();
}

async function getPreferences() {
  const res = await fetch('/api/preferences', { 
    headers: getAuthHeader() 
  });
  return res.json();
}

if (typeof window !== 'undefined') {
  window.getSavedEvents      = getSavedEvents;
  window.saveEventToDatabase = saveEventToDatabase;
  window.deleteSavedEvent    = deleteSavedEvent;
  window.getCalendarEntries  = getCalendarEntries;
  window.savePreferences     = savePreferences;
  window.getPreferences      = getPreferences;
}

// Optional export for test environments (Jest)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    getSavedEvents, saveEventToDatabase, deleteSavedEvent,
    getCalendarEntries, savePreferences, getPreferences
  };
}