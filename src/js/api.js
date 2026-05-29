async function getSavedEvents() {
  const response = await fetch('/api/events', {
    credentials: 'include',
  });
  if (!response.ok) return [];
  return response.json();
}

async function saveEventToDatabase(eventData) {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(eventData),
  });
  if (!response.ok) return null;
  return response.json();
}

async function deleteSavedEvent(ticketmasterId) {
  await fetch(`/api/events/${ticketmasterId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

if (typeof window !== 'undefined') {
  window.getSavedEvents = getSavedEvents;
  window.saveEventToDatabase = saveEventToDatabase;
  window.deleteSavedEvent = deleteSavedEvent;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getSavedEvents, saveEventToDatabase, deleteSavedEvent };
}