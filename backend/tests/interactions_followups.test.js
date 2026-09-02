const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const Student = require('../src/models/Student');

describe('Step 4: Support Requests, Interactions & Follow-Up Management', () => {
  let studentToken;
  let studentUserId;
  let studentDocId;
  let coordinatorToken;
  let coordinatorUserId;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Register a student
    const studentReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Rahul Student',
        email: 'rahul.support@sof.org',
        password: 'Password123!',
        role: 'student'
      });
    studentToken = studentReg.body.data.accessToken;
    studentUserId = studentReg.body.data.user._id;

    // Initialize student profile
    const profileRes = await request(app)
      .get('/api/v1/students/me')
      .set('Authorization', `Bearer ${studentToken}`);
    studentDocId = profileRes.body.data._id;

    // Register a coordinator
    const coordReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Priya Coordinator',
        email: 'priya.support@sof.org',
        password: 'Coordinator123!',
        role: 'coordinator'
      });
    coordinatorToken = coordReg.body.data.accessToken;
    coordinatorUserId = coordReg.body.data.user._id;
  });

  describe('Support Requests Lifecycle', () => {
    let requestId;

    it('POST /api/v1/support-requests should allow student to submit a support request', async () => {
      const res = await request(app)
        .post('/api/v1/support-requests')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          category: 'career',
          title: 'Guidance on choosing Computer Science vs Electronics',
          description: 'I need advice on engineering branch options after 12th grade.',
          priority: 'high'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Guidance on choosing Computer Science vs Electronics');
      expect(res.body.data.category).toBe('career');
      expect(res.body.data.status).toBe('pending');
      requestId = res.body.data._id;
    });

    it('GET /api/v1/support-requests/my should return list of student requests', async () => {
      await request(app)
        .post('/api/v1/support-requests')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          category: 'academic',
          title: 'Math tutoring request',
          description: 'Need help with Trigonometry integration.',
          priority: 'medium'
        });

      const res = await request(app)
        .get('/api/v1/support-requests/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].category).toBe('academic');
    });

    it('PUT /api/v1/support-requests/:id should allow coordinator to update status and add resolution notes', async () => {
      const createRes = await request(app)
        .post('/api/v1/support-requests')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          category: 'financial',
          title: 'College application scholarship query',
          description: 'Looking for fee waiver eligibility information.',
          priority: 'urgent'
        });

      const reqId = createRes.body.data._id;

      const updateRes = await request(app)
        .put(`/api/v1/support-requests/${reqId}`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          status: 'resolved',
          resolutionNotes: 'Connected student with SOF higher-education scholarship grant fund.'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.status).toBe('resolved');
      expect(updateRes.body.data.resolutionNotes).toContain('scholarship grant fund');
    });

    it('DELETE /api/v1/support-requests/:id should allow student to cancel a pending request', async () => {
      const createRes = await request(app)
        .post('/api/v1/support-requests')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          category: 'general',
          title: 'Test cancel request',
          description: 'Will cancel this request immediately.',
          priority: 'low'
        });

      const reqId = createRes.body.data._id;

      const cancelRes = await request(app)
        .delete(`/api/v1/support-requests/${reqId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.message).toContain('cancelled successfully');
    });
  });

  describe('Interactions & Automatic Follow-Up Creation', () => {
    it('POST /api/v1/interactions should record meeting notes and auto-create follow-up task', async () => {
      const nextDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          studentId: studentDocId,
          type: 'in_person',
          notes: 'Discussed semester exam preparation and career path towards software engineering.',
          summary: 'Student is motivated; needs assistance with math sample papers.',
          concerns: ['Trigonometry formulas', 'Time management during exams'],
          actionItems: [
            { description: 'Complete 3 math practice tests by next Friday', isCompleted: false },
            { description: 'Review Git tutorial video', isCompleted: false }
          ],
          nextFollowUpDate: nextDate,
          followUpTitle: 'Review Math Sample Papers Results',
          followUpPriority: 'high'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notes).toContain('Discussed semester exam');
      expect(res.body.data.actionItems.length).toBe(2);

      // Verify follow-up task was automatically created
      expect(res.body.createdFollowUp).toBeDefined();
      expect(res.body.createdFollowUp.title).toBe('Review Math Sample Papers Results');
      expect(res.body.createdFollowUp.priority).toBe('high');
    });

    it('GET /api/v1/interactions/student/:studentId should return student interaction history', async () => {
      await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          studentId: studentDocId,
          notes: 'Quarterly review interaction with student.'
        });

      const res = await request(app)
        .get(`/api/v1/interactions/student/${studentDocId}`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });

    it('should block non-coordinators from recording interactions', async () => {
      const res = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: studentDocId,
          notes: 'Unauthorized interaction log attempt'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('Follow-Ups Management', () => {
    let followUpId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          studentId: studentDocId,
          title: 'Check student attendance and project submission',
          description: 'Follow up on Javascript portfolio project.',
          dueDate: new Date().toISOString(),
          priority: 'medium'
        });
      followUpId = createRes.body.data._id;
    });

    it('GET /api/v1/followups should return coordinator follow-up list', async () => {
      const res = await request(app)
        .get('/api/v1/followups')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].title).toBe('Check student attendance and project submission');
    });

    it('GET /api/v1/followups/today should return follow-ups due today', async () => {
      const res = await request(app)
        .get('/api/v1/followups/today')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });

    it('POST /api/v1/followups/:id/complete should mark follow-up completed', async () => {
      const res = await request(app)
        .post(`/api/v1/followups/${followUpId}/complete`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          completionNotes: 'Student submitted project successfully.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.completionNotes).toBe('Student submitted project successfully.');
    });
  });
});
