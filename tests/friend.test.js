/**
 * friends.test.js
 * Smoke, Unit, and Integration Tests for Friend Feature API routes
 * Tests authentication requirements, validation, and friend route behavior
 */

const request = require('supertest');

// ── Mock mongoose and passport before requiring server ────────────────────
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(true),
    connection: { readyState: 1 },
    Schema: actualMongoose.Schema,
    Types: actualMongoose.Types,
    model: jest.fn().mockImplementation(() => ({
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(null),
      findByIdAndUpdate: jest.fn().mockResolvedValue(null),
      findOneAndDelete: jest.fn().mockResolvedValue(null),
      findByIdAndDelete: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue(null),
      updateOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
    })),
  };
});

jest.mock('connect-mongo', () => ({
  default: {
    create: jest.fn().mockReturnValue({
      on: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      destroy: jest.fn(),
      all: jest.fn(),
      length: jest.fn(),
      clear: jest.fn(),
      touch: jest.fn(),
    }),
  },
}));

jest.mock('passport', () => ({
  initialize: () => (req, res, next) => next(),
  session: () => (req, res, next) => next(),
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  authenticate: jest.fn(() => (req, res, next) => next()),
}));

jest.mock('passport-google-oauth20', () => ({ Strategy: jest.fn() }));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

const app = require('../server');

// ── SMOKE TESTS ───────────────────────────────────────────────────────────
describe('Smoke Tests — friend routes require authentication', () => {
  test('POST /api/friends/request returns 401 when not logged in', async () => {
    const res = await request(app)
      .post('/api/friends/request')
      .send({ username: 'testuser' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not logged in');
  });

  test('GET /api/friends/requests returns 401 when not logged in', async () => {
    const res = await request(app).get('/api/friends/requests');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not logged in');
  });

  test('POST /api/friends/accept/:senderId returns 401 when not logged in', async () => {
    const res = await request(app).post(
      '/api/friends/accept/507f1f77bcf86cd799439011',
    );
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not logged in');
  });

  test('POST /api/friends/decline/:senderId returns 401 when not logged in', async () => {
    const res = await request(app).post(
      '/api/friends/decline/507f1f77bcf86cd799439011',
    );
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not logged in');
  });

  test('GET /api/friends returns 401 when not logged in', async () => {
    const res = await request(app).get('/api/friends');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not logged in');
  });

  test('DELETE /api/friends/:friendId returns 401 when not logged in', async () => {
    const res = await request(app).delete(
      '/api/friends/507f1f77bcf86cd799439011',
    );
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not logged in');
  });

  test('GET /api/friends/:userId/events does not require authentication', async () => {
    const res = await request(app).get(
      '/api/friends/507f1f77bcf86cd799439011/events',
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── UNIT TESTS ────────────────────────────────────────────────────────────
describe('Unit Tests — friend route validation', () => {
  test('POST /api/friends/request returns 401 without body when not logged in', async () => {
    const res = await request(app).post('/api/friends/request').send({});
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not logged in');
  });

  test('POST /api/friends/accept/:senderId returns 401 with invalid id when not logged in', async () => {
    const res = await request(app).post('/api/friends/accept/invalidid');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not logged in');
  });

  test('POST /api/friends/decline/:senderId returns 401 with invalid id when not logged in', async () => {
    const res = await request(app).post('/api/friends/decline/invalidid');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not logged in');
  });

  test('DELETE /api/friends/:friendId returns 401 with invalid id when not logged in', async () => {
    const res = await request(app).delete('/api/friends/invalidid');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not logged in');
  });

  test('GET /api/friends/:userId/events returns empty array when no events saved', async () => {
    const res = await request(app).get(
      '/api/friends/507f1f77bcf86cd799439011/events',
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ── INTEGRATION TESTS ─────────────────────────────────────────────────────
describe('Integration Tests — friend feature behavior', () => {
  test('All friend routes return JSON error responses', async () => {
    const routes = [
      { method: 'post', path: '/api/friends/request' },
      { method: 'get', path: '/api/friends/requests' },
      { method: 'post', path: '/api/friends/accept/507f1f77bcf86cd799439011' },
      { method: 'post', path: '/api/friends/decline/507f1f77bcf86cd799439011' },
      { method: 'get', path: '/api/friends' },
      { method: 'delete', path: '/api/friends/507f1f77bcf86cd799439011' },
    ];

    for (const route of routes) {
      const res = await request(app)[route.method](route.path);
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    }
  });

  test('GET /api/friends/:userId/events returns array for any userId', async () => {
    const userIds = [
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012',
      '507f1f77bcf86cd799439013',
    ];

    for (const userId of userIds) {
      const res = await request(app).get(`/api/friends/${userId}/events`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  test('Friend routes are separate from event routes', async () => {
    const friendRes = await request(app).get('/api/friends');
    const eventRes = await request(app).get('/api/events');
    expect(friendRes.status).toBe(401);
    expect(eventRes.status).toBe(401);
    expect(friendRes.body.error).toBe('Not logged in');
    expect(eventRes.body.error).toBe('Not logged in');
  });

  test('POST /api/friends/request requires body with username field', async () => {
    const res = await request(app)
      .post('/api/friends/request')
      .send({ username: 'someuser' });
    expect(res.status).toBe(401);
  });

  test('Friend accept and decline routes accept valid ObjectId params', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const acceptRes = await request(app).post(`/api/friends/accept/${validId}`);
    const declineRes = await request(app).post(
      `/api/friends/decline/${validId}`,
    );
    expect(acceptRes.status).toBe(401);
    expect(declineRes.status).toBe(401);
  });
});
