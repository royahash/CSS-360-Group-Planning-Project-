const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set fallback env variables for testing
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret-for-jest';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret';
process.env.TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || 'test-ticketmaster-key';