const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const User = require('../src/models/User');

describe('Step 2: Authentication, Authorization & User Domain', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new student successfully with tokens and cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Rahul Kumar',
          email: 'rahul.kumar@sof.org',
          password: 'Password123!',
          role: 'student',
          phone: '+919876543210',
          centerId: 'SOF-BLR-01'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('rahul.kumar@sof.org');
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Verify Set-Cookie header contains refreshToken
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken=');
    });

    it('should register a coordinator with role=coordinator', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Priya Sharma (Coordinator)',
          email: 'priya.coordinator@sof.org',
          password: 'CoordinatorPass123!',
          role: 'coordinator'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('coordinator');
    });

    it('should fail with 400 on invalid email or short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'A',
          email: 'not-an-email',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail with 409 Conflict if email is already registered', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Rahul Kumar',
          email: 'rahul@sof.org',
          password: 'Password123!'
        });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Another Rahul',
          email: 'rahul@sof.org',
          password: 'AnotherPassword123!'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Ananya Nair',
          email: 'ananya@sof.org',
          password: 'SecurePassword123!',
          role: 'student'
        });
    });

    it('should log in successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'ananya@sof.org',
          password: 'SecurePassword123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('ananya@sof.org');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should fail with 401 on incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'ananya@sof.org',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should fail with 401 on non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'ghost@sof.org',
          password: 'SomePassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token;

    beforeEach(async () => {
      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Kiran Rao',
          email: 'kiran@sof.org',
          password: 'KiranPassword123!',
          role: 'coordinator'
        });
      token = reg.body.data.accessToken;
    });

    it('should return the current user profile when valid token provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Kiran Rao');
      expect(res.body.data.user.email).toBe('kiran@sof.org');
      expect(res.body.data.user.role).toBe('coordinator');
    });

    it('should fail with 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-garbage-token');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh and /api/v1/auth/logout', () => {
    let accessToken;
    let refreshToken;

    beforeEach(async () => {
      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Session User',
          email: 'session@sof.org',
          password: 'SessionPass123!'
        });
      accessToken = reg.body.data.accessToken;
      refreshToken = reg.body.data.refreshToken;
    });

    it('should successfully refresh access token and rotate refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Test that the newly issued access token works on protected endpoints
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${res.body.data.accessToken}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.email).toBe('session@sof.org');
    });

    it('should log out and invalidate refresh token', async () => {
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Attempting to refresh with the old refresh token should now fail
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });
  });
});
