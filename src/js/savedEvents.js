/* global saveEventToDatabase, deleteSavedEvent, getSavedEvents */

async function isEventSaved(ticketmasterId) {

  const savedEvents =
    await getSavedEvents();

  return savedEvents.some(
    (event) =>
      event.ticketmasterId ===
      ticketmasterId
  );
}

async function handleSaveEvent(
  eventData,
  buttonEl
) {

  const alreadySaved =
    await isEventSaved(eventData.id);

  // =========================
  // UNSAVE
  // =========================
  if (alreadySaved) {

    await deleteSavedEvent(
      eventData.id
    );

    buttonEl.textContent =
      'Save';

    buttonEl.style.background =
      '';

    return 'removed';
  }

  // =========================
  // SAVE
  // =========================
  await saveEventToDatabase({
    ticketmasterId:
      eventData.id,

    title:
      eventData.name,

    image:
      eventData.images?.[0]?.url || '',

    startDate:
      eventData.dates.start.localDate,

    venue:
      eventData._embedded?.venues?.[0]?.name || '',

    city:
      eventData._embedded?.venues?.[0]?.city?.name || '',

    owner: 'You',

    description:
      eventData.info ||
      'No description available.',
  });

  buttonEl.textContent =
    'Saved';

  buttonEl.style.background =
    '#a5d6a7';

  return 'saved';
}