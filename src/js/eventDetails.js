const params = new URLSearchParams(window.location.search);

const eventId = params.get('id');

const API_KEY = CONFIG.TICKETMASTER_API_KEY;


async function loadEventDetails() {
  const response = await fetch(
    `https://app.ticketmaster.com/discovery/v2/events/${eventId}.json?apikey=${API_KEY}`
  );

  const event = await response.json();

  document.querySelector('.event-details-img').src =
    event.images[0].url;

  document.querySelector('.event-details-info h2').textContent =
    event.name;

  document.querySelector('.event-details-description').innerHTML = `
    <p>${event.info || 'No description available.'}</p>
  `;
}

loadEventDetails();