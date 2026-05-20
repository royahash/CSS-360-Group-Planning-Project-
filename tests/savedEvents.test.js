global.getSavedEvents = jest.fn();

global.saveEventToDatabase =
  jest.fn();

global.deleteSavedEvent =
  jest.fn();

const {
  handleSaveEvent,
  isEventSaved,
} = require(
  '../src/js/savedEvents.js'
);

describe(
  'Save Event Logic',
  () => {

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test(
      'isEventSaved returns true',
      async () => {

        getSavedEvents.mockResolvedValue([
          {
            ticketmasterId: '123',
          },
        ]);

        const result =
          await isEventSaved('123');

        expect(result).toBe(true);
      }
    );

    test(
      'saves event correctly',
      async () => {

        getSavedEvents.mockResolvedValue([]);

        const button =
          document.createElement(
            'button'
          );

        button.textContent =
          'Save';

        const eventData = {
          id: '123',

          name: 'Concert',

          images: [
            { url: 'img.jpg' },
          ],

          dates: {
            start: {
              localDate:
                '2026-05-20',
            },
          },

          _embedded: {
            venues: [
              {
                name: 'Arena',

                city: {
                  name: 'Seattle',
                },
              },
            ],
          },
        };

        await handleSaveEvent(
          eventData,
          button
        );

        expect(
          saveEventToDatabase
        ).toHaveBeenCalled();

        expect(
          button.textContent
        ).toBe('Saved');
      }
    );

    test(
      'unsaves event correctly',
      async () => {

        getSavedEvents.mockResolvedValue([
          {
            ticketmasterId: '123',
          },
        ]);

        const button =
          document.createElement(
            'button'
          );

        button.textContent =
          'Saved';

        const eventData = {
          id: '123',
        };

        await handleSaveEvent(
          eventData,
          button
        );

        expect(
          deleteSavedEvent
        ).toHaveBeenCalled();

        expect(
          button.textContent
        ).toBe('Save');
      }
    );
  }
);