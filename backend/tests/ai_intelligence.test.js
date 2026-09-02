const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');

describe('Step 7: AI Intelligence Layer (Action Plan Generator, Career Skill Matcher & Nudges)', () => {
  let studentToken;
  let studentUserId;
  let studentDocId;
  let coordinatorToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Register Student
    const studentReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Rahul Student',
        email: 'rahul.ai@sof.org',
        password: 'Password123!',
        role: 'student',
        centerId: 'SOF-BLR-01'
      });
    studentToken = studentReg.body.data.accessToken;
    studentUserId = studentReg.body.data.user._id;

    // Register Coordinator
    const coordReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Priya Coordinator',
        email: 'priya.ai@sof.org',
        password: 'Coordinator123!',
        role: 'coordinator',
        centerId: 'SOF-BLR-01'
      });
    coordinatorToken = coordReg.body.data.accessToken;

    // Setup student profile with aspirations
    const profileRes = await request(app)
      .put('/api/v1/students/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        education: { currentGrade: 'Grade 11', institution: 'Government PU College', stream: 'Science (PCMC)' },
        aspirations: { targetCareer: 'Software Engineer', higherEducationGoal: 'B.Tech CS' }
      });
    studentDocId = profileRes.body.data._id;

    // Add academic record
    await request(app)
      .post('/api/v1/students/me/academic-records')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        academicYear: '2025-2026',
        grade: 'Grade 11',
        term: 'Midterm',
        subject: 'Mathematics',
        score: 88,
        attendance: 94
      });

    // Add skills
    await request(app)
      .post('/api/v1/students/me/skills')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'JavaScript', category: 'technical', level: 'intermediate' });
  });

  describe('Action Plan Generation', () => {
    it('POST /api/v1/ai/action-plan should generate structured 4-week learning roadmap', async () => {
      const res = await request(app)
        .post('/api/v1/ai/action-plan')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ focusArea: 'Software Engineer' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.planTitle).toBeDefined();
      expect(res.body.data.durationWeeks).toBe(4);
      expect(Array.isArray(res.body.data.weeklyMilestones)).toBe(true);
      expect(res.body.data.weeklyMilestones.length).toBe(4);
      expect(res.body.data.weeklyMilestones[0].tasks.length).toBeGreaterThan(0);
      expect(res.body.data.skillRecommendations).toBeDefined();
    });
  });

  describe('Career Skill Gap Matcher', () => {
    it('POST /api/v1/ai/career-match should evaluate readiness against career benchmarks', async () => {
      const res = await request(app)
        .post('/api/v1/ai/career-match')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ targetCareer: 'Software Engineer' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.targetCareer).toBe('Software Engineer');
      expect(typeof res.body.data.readinessScore).toBe('number');
      expect(res.body.data.matchedSkills.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.missingCriticalSkills.length).toBeGreaterThan(0);
      expect(res.body.data.recommendedLearningPath.length).toBeGreaterThan(0);
    });
  });

  describe('Smart Nudge Engine', () => {
    it('GET /api/v1/ai/nudges should return motivational, context-aware nudges for student', async () => {
      const res = await request(app)
        .get('/api/v1/ai/nudges')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toBeDefined();
      expect(res.body.data[0].actionUrl).toBeDefined();
    });
  });

  describe('Coordinator AI Student Briefing', () => {
    it('GET /api/v1/ai/student-summary/:studentId should generate executive notes for coordinator', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/student-summary/${studentDocId}`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.studentName).toBe('Rahul Student');
      expect(res.body.data.executiveSummary).toBeDefined();
      expect(res.body.data.keyStrengths.length).toBeGreaterThan(0);
      expect(res.body.data.suggestedDiscussionPoints.length).toBeGreaterThanOrEqual(3);
      expect(res.body.data.recommendedAction).toBeDefined();
    });

    it('should forbid student from accessing coordinator briefing notes', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/student-summary/${studentDocId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });
});
