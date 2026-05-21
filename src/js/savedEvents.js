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

// eslint-disable-next-line no-unused-vars
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

    startTime:
      eventData.dates.start.localTime || '',

    endDate:
      eventData.dates.end?.localDate || '',

    venue:
      eventData._embedded?.venues?.[0]?.name || '',

    city:
      eventData._embedded?.venues?.[0]?.city?.name || '',

    address:
      eventData._embedded?.venues?.[0]?.address?.line1 || '',

    owner: 'You',

    users: [
      {
        email: 'user@example.com'
      }
    ],

    eventURL:
      eventData.url || '',

    description:
      eventData.info ||
      'No description available.'
  });

  buttonEl.textContent =
    'Saved';

  buttonEl.style.background =
    '#a5d6a7';

  return 'saved';
}
