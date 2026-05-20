global.fetch = jest.fn();

const {
  getSavedEvents,
  saveEventToDatabase,
  deleteSavedEvent,
} = require('../src/js/api.js');

describe(
  'API Functions',
  () => {

    beforeEach(() => {
      fetch.mockClear();
    });

    test(
      'getSavedEvents fetches data',
      async () => {

        fetch.mockResolvedValue({
          json: () =>
            Promise.resolve([]),
        });

        await getSavedEvents();

        expect(fetch)
          .toHaveBeenCalledWith(
            '/api/events'
          );
      }
    );

    test(
      'saveEventToDatabase sends POST request',
      async () => {

        fetch.mockResolvedValue({
          json: () =>
            Promise.resolve({}),
        });

        await saveEventToDatabase({
          title: 'Concert',
        });

        expect(fetch)
          .toHaveBeenCalledWith(
            '/api/events',

            expect.objectContaining({
              method: 'POST',
            })
          );
      }
    );

    test(
      'deleteSavedEvent sends DELETE request',
      async () => {

        fetch.mockResolvedValue({});

        await deleteSavedEvent(
          '123'
        );

        expect(fetch)
          .toHaveBeenCalledWith(
            '/api/events/123',

            expect.objectContaining({
              method: 'DELETE',
            })
          );
      }
    );
  }
);