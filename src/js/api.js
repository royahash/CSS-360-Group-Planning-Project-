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