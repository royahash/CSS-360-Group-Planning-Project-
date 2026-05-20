/**
 * @jest-environment jsdom
 */

global.CONFIG = {
  TICKETMASTER_API_KEY: 'test_key',
};

document.body.innerHTML = `
  <img class="event-details-img">

  <div class="event-details-info">
    <h2 id="event-title"></h2>

    <p id="event-location"></p>

    <p id="event-date"></p>
  </div>

  <div
    class="event-details-description"
    id="event-description"
  ></div>

  <button id="save-btn">
    Save
  </button>
`;

// MOCK FETCH
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        id: '123',

        name: 'Concert Night',

        images: [
          {
            url: 'test-image.jpg',
          },
        ],

        dates: {
          start: {
            localDate: '2026-05-20',
          },
        },

        info: 'Amazing live music.',

        _embedded: {
          venues: [
            {
              name: 'Seattle Arena',
            },
          ],
        },
      }),
  })
);

// MOCK URL PARAMS
window.history.pushState(
  {},
  '',
  '/event.html?id=123'
);

// MOCK SAVE FUNCTIONS
global.handleSaveEvent =
  jest.fn();

global.isEventSaved =
  jest.fn(() =>
    Promise.resolve(false)
  );

// IMPORT FILE
require('../src/js/eventDetails.js');

describe(
  'Event Details Page',
  () => {

    test(
      'loads event title',
      async () => {

        await new Promise(
          process.nextTick
        );

        expect(
          document.getElementById(
            'event-title'
          ).textContent
        ).toContain(
          'Concert Night'
        );
      }
    );

    test(
      'loads description',
      async () => {

        await new Promise(
          process.nextTick
        );

        expect(
          document.getElementById(
            'event-description'
          ).innerHTML
        ).toContain(
          'Amazing live music.'
        );
      }
    );

    test(
      'loads venue',
      async () => {

        await new Promise(
          process.nextTick
        );

        expect(
          document.getElementById(
            'event-location'
          ).innerHTML
        ).toContain(
          'Seattle Arena'
        );
      }
    );

    test(
      'loads date',
      async () => {

        await new Promise(
          process.nextTick
        );

        expect(
          document.getElementById(
            'event-date'
          ).innerHTML
        ).toContain(
          '2026-05-20'
        );
      }
    );

    test(
      'checks saved state',
      async () => {

        await new Promise(
          process.nextTick
        );

        expect(
          isEventSaved
        ).toHaveBeenCalledWith(
          '123'
        );
      }
    );
  }
);