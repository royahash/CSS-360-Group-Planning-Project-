async function getSavedEvents() {
  const response = await fetch('/api/events');
  return response.json();
}

async function saveEventToDatabase(eventData) {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  return response.json();
}

async function deleteSavedEvent(ticketmasterId) {
  await fetch(`/api/events/${ticketmasterId}`, {
    method: 'DELETE',
  });
}

/**
 * Make functions available globally for other scripts (calendar.js, etc.)
 * This fixes ESLint "no-undef" across multi-script architecture
 */
if (typeof window !== 'undefined') {
  window.getSavedEvents = getSavedEvents;
  window.saveEventToDatabase = saveEventToDatabase;
  window.deleteSavedEvent = deleteSavedEvent;
}

// Optional export for test environments (Jest)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getSavedEvents,
    saveEventToDatabase,
    deleteSavedEvent,
  };
}
