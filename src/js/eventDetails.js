/* global handleSaveEvent, isEventSaved */

const params = new URLSearchParams(window.location.search);

const eventId = params.get('id');
const eventTitle = params.get('title');

const saveBtn = document.getElementById('save-btn');

async function loadEventDetails() {
  // =========================
  // TICKETMASTER EVENTS
  // =========================
  if (eventId) {
    const response = await fetch(`/api/ticketmaster/event/${eventId}`);

    const event = await response.json();

    document.querySelector('.event-details-img').src =
      event.images?.[0]?.url || '';

    document.getElementById('event-title').textContent =
      event.name || 'Untitled Event';

    const venue = event._embedded?.venues?.[0];

    document.getElementById('event-location').innerHTML = `
      <i class="fa-solid fa-location-dot" style="color:red;"></i>
      ${venue?.name || 'Unknown Venue'}
    `;

    document.getElementById('event-date').innerHTML = `
      <i class="fa-solid fa-calendar" style="color:red;"></i>
      ${event.dates?.start?.localDate || 'Date unavailable'}
    `;

    // =========================
    // CATEGORY PILLS
    // =========================
    const classification = event.classifications?.[0];

    const rawCategories = [
      classification?.segment?.name,
      classification?.genre?.name,
      classification?.subGenre?.name,
    ].filter(Boolean);

    let categoryParts = rawCategories.filter(
      (value, index, array) => array.indexOf(value) === index,
    );

    if (categoryParts.length > 1) {
      categoryParts = categoryParts.filter(
        (category) => category.toLowerCase() !== 'undefined',
      );
    }

    document.getElementById('event-category').innerHTML = `
      <i class="fa-solid fa-tag" style="color:red;"></i>

      <div class="category-container">
        ${
          categoryParts.length
            ? categoryParts
                .map(
                  (category) => `
                    <button
                      class="category-pill category-link"
                      data-category="${category}"
                    >
                      ${category}
                    </button>
                  `,
                )
                .join('')
            : `
                <button
                  class="category-pill category-link"
                  data-category="Unknown Category"
                >
                  Unknown Category
                </button>
              `
        }
      </div>
    `;

    // =========================
    // CATEGORY BUTTON HANDLERS
    // =========================
    document.querySelectorAll('.category-link').forEach((button) => {
      button.addEventListener('click', () => {
        const category = button.dataset.category;

        sessionStorage.setItem('searchCategory', category);

        window.location.href = '/html/index.html';
      });
    });

    // =========================
    // TICKETMASTER LINK
    // =========================
    document.getElementById('ticketmaster-link').innerHTML = `
      <i class="fa-solid fa-ticket" style="color:red;"></i>
      <a
        href="${event.url}"
        target="_blank"
        rel="noopener noreferrer"
      >
        View on Ticketmaster
      </a>
    `;

    // =========================
    // DESCRIPTION
    // =========================
    document.getElementById('event-description').innerHTML = `
      <p>
        ${event.info || 'No description available.'}
      </p>

      ${
        event.pleaseNote
          ? `
            <br>
            <p>
              <strong>Important Information:</strong><br>
              ${event.pleaseNote}
            </p>
          `
          : ''
      }
    `;

    // =========================
    // INITIAL SAVE STATE
    // =========================
    const alreadySaved = await isEventSaved(event.id);

    if (alreadySaved) {
      saveBtn.textContent = 'Saved';
      saveBtn.style.background = '#a5d6a7';
    }

    // =========================
    // SAVE BUTTON
    // =========================
    saveBtn.addEventListener('click', async () => {
      await handleSaveEvent(event, saveBtn);
    });

    return;
  }

  // =========================
  // MOCK FRIEND EVENTS
  // =========================
  if (eventTitle) {
    const response = await fetch('/data/mockFriends.json');

    const friendEvents = await response.json();

    const event = friendEvents.find((e) => e.title === eventTitle);

    if (!event) return;

    document.querySelector('.event-details-img').src = event.image;

    document.getElementById('event-title').textContent = event.title;

    document.getElementById('event-location').innerHTML = `
      <i class="fa-solid fa-location-dot" style="color:red;"></i>
      ${event.location}
    `;

    document.getElementById('event-date').innerHTML = `
      <i class="fa-solid fa-calendar" style="color:red;"></i>
      ${event.date}
    `;

    document.getElementById('event-category').innerHTML = `
      <i class="fa-solid fa-tag" style="color:red;"></i>

      <div class="category-container">
        <button
          class="category-pill"
          disabled
        >
          Friend Event
        </button>
      </div>
    `;

    document.getElementById('ticketmaster-link').innerHTML = '';

    document.getElementById('event-description').innerHTML = `
      <p>${event.description}</p>
    `;

    saveBtn.style.display = 'none';
  }
}

loadEventDetails();
