const request = require('supertest');
const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('../src/app');
const { initSocket } = require('../src/config/socket');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const Notification = require('../src/models/Notification');
const notificationService = require('../src/services/notification.service');

describe('Step 6: Real-Time Engine (Socket.IO) & In-App Notification System', () => {
  let server;
  let serverPort;
  let coordinatorToken;
  let coordinatorUserId;
  let studentToken;
  let studentUserId;
  let studentDocId;

  beforeAll(async () => {
    await connectTestDB();
    server = http.createServer(app);
    initSocket(server);
    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Register Coordinator
    const coordReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Priya Sharma',
        email: 'priya.notif@sof.org',
        password: 'Coordinator123!',
        role: 'coordinator',
        centerId: 'SOF-BLR-01'
      });
    coordinatorToken = coordReg.body.data.accessToken;
    coordinatorUserId = coordReg.body.data.user._id;

    // Register Student
    const studentReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Rahul Kumar',
        email: 'rahul.notif@sof.org',
        password: 'Password123!',
        role: 'student',
        centerId: 'SOF-BLR-01'
      });
    studentToken = studentReg.body.data.accessToken;
    studentUserId = studentReg.body.data.user._id;

    const profileRes = await request(app)
      .get('/api/v1/students/me')
      .set('Authorization', `Bearer ${studentToken}`);
    studentDocId = profileRes.body.data._id;
  });

  describe('Notification CRUD & Lifecycle Endpoints', () => {
    let notifId;

    beforeEach(async () => {
      const notif = await notificationService.createNotification({
        userId: studentUserId,
        title: 'New Assignment Available',
        message: 'Physics Unit 3 Practice Problems have been assigned.',
        type: 'academic_update',
        priority: 'medium'
      });
      notifId = notif._id.toString();

      await notificationService.createNotification({
        userId: studentUserId,
        title: 'Meeting Scheduled',
        message: 'One-on-one review session with Priya Sharma tomorrow.',
        type: 'interaction',
        priority: 'high'
      });
    });

    it('GET /api/v1/notifications should return paginated list and unread count', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBe(2);
      expect(res.body.unreadCount).toBe(2);
      expect(res.body.data.length).toBe(2);
    });

    it('GET /api/v1/notifications/unread-count should return unread count only', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unreadCount).toBe(2);
    });

    it('PUT /api/v1/notifications/:id/read should mark a single notification as read', async () => {
      const res = await request(app)
        .put(`/api/v1/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
      expect(res.body.data.readAt).toBeDefined();

      const countRes = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(countRes.body.unreadCount).toBe(1);
    });

    it('PUT /api/v1/notifications/read-all should mark all notifications as read', async () => {
      const res = await request(app)
        .put('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.modifiedCount).toBe(2);

      const countRes = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(countRes.body.unreadCount).toBe(0);
    });

    it('DELETE /api/v1/notifications/:id should delete a notification', async () => {
      const res = await request(app)
        .delete(`/api/v1/notifications/${notifId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');
    });
  });

  describe('Automated Notification Generation from System Events', () => {
    it('should generate in-app notification for coordinator when student creates support request', async () => {
      await request(app)
        .post('/api/v1/support-requests')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          category: 'career',
          title: 'College entrance mock exam schedule request',
          description: 'Need mock exam dates for Karnataka CET.',
          priority: 'high'
        });

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      const requestNotif = res.body.data.find((n) => n.type === 'support_request');
      expect(requestNotif).toBeDefined();
      expect(requestNotif.title).toContain('Support Request');
    });

    it('should generate in-app notification for student when coordinator records an interaction', async () => {
      await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          studentId: studentDocId,
          type: 'in_person',
          notes: 'Discussed semester plan and trigonometry tutorials.',
          actionItems: [{ description: 'Watch lecture 4', isCompleted: false }]
        });

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const interactionNotif = res.body.data.find((n) => n.type === 'interaction');
      expect(interactionNotif).toBeDefined();
      expect(interactionNotif.title).toContain('Interaction Logged');
    });
  });

  describe('Socket.IO Client Connection & Real-Time Event Reception', () => {
    it('should connect via WebSocket with JWT auth and receive real-time notification events', (done) => {
      const socket = Client(`http://localhost:${serverPort}`, {
        auth: { token: studentToken },
        transports: ['websocket']
      });

      socket.on('connect', async () => {
        socket.on('notification.created', (payload) => {
          expect(payload.title).toBe('Real-Time Alert Test');
          socket.disconnect();
          done();
        });

        // Trigger notification emission
        await notificationService.createNotification({
          userId: studentUserId,
          title: 'Real-Time Alert Test',
          message: 'Testing live socket emission delivery.',
          type: 'system'
        });
      });
    });
  });
});
