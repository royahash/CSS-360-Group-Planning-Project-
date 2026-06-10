/* global saveEventToDatabase, deleteSavedEvent, getSavedEvents */

async function isEventSaved(ticketmasterId) {
  const savedEvents = await getSavedEvents();

  return savedEvents.some((event) => event.ticketmasterId === ticketmasterId);
}

// eslint-disable-next-line no-unused-vars
async function handleSaveEvent(eventData, buttonEl) {
  // If not logged in, send to login page
  const response = await fetch('/auth/me', { credentials: 'include' });
  if (!response.ok) {
    window.location.href = '/html/LogIn.html';
    return;
  }

  const alreadySaved = await isEventSaved(eventData.id);

  // =========================
  // UNSAVE
  // =========================
  if (alreadySaved) {
    await deleteSavedEvent(eventData.id);

    window.dispatchEvent(new Event('calendarUpdated'));

    buttonEl.textContent = 'Save';
    buttonEl.style.background = '';

    return 'removed';
  }

  // =========================
  // SAVE
  // =========================
  await saveEventToDatabase({
    ticketmasterId: eventData.id,
    title: eventData.name,
    image: eventData.images?.[0]?.url || '',
    startDate: eventData.dates.start.localDate,
    venue: eventData._embedded?.venues?.[0]?.name || '',
    city: eventData._embedded?.venues?.[0]?.city?.name || '',
    owner: 'You',
    source: 'my',
    description: eventData.info || 'No description available.',
  });

  window.dispatchEvent(new Event('calendarUpdated'));

  buttonEl.textContent = 'Saved';
  buttonEl.style.background = '#a5d6a7';

  return 'saved';
}
