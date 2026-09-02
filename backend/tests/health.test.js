const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB } = require('./setup');

describe('Core Infrastructure & Health Check API', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('GET / should return root API welcome status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Shifting Orbits Foundation');
  });

  it('GET /api/v1/health should return system status and connected database state', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('shifting-orbits-backend');
    expect(res.body.database.connected).toBe(true);
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });

  it('GET /api/v1/non-existent-route should return 404 ApiError response format', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });
});
