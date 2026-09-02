const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const Student = require('../src/models/Student');
const AcademicRecord = require('../src/models/AcademicRecord');

describe('Step 5: Support Priority Scoring Engine & Coordinator 360° Portal APIs', () => {
  let coordinatorToken;
  let coordinatorUserId;
  let studentToken;
  let studentUserId;
  let studentDocId;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Register Coordinator
    const coordReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Priya Sharma (Coordinator)',
        email: 'priya.coord@sof.org',
        password: 'Coordinator123!',
        role: 'coordinator',
        centerId: 'SOF-BLR-01'
      });
    coordinatorToken = coordReg.body.data.accessToken;
    coordinatorUserId = coordReg.body.data.user._id;

    // Register Student 1 (On track student - Rahul)
    const student1Reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Rahul Kumar',
        email: 'rahul.ontrack@sof.org',
        password: 'Password123!',
        role: 'student',
        centerId: 'SOF-BLR-01'
      });
    studentToken = student1Reg.body.data.accessToken;
    studentUserId = student1Reg.body.data.user._id;

    // Setup Rahul's profile, marks and aspirations
    const profileRes = await request(app)
      .put('/api/v1/students/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        education: { currentGrade: 'Grade 11', institution: 'PU College', stream: 'Science' },
        aspirations: { targetCareer: 'Software Engineer' }
      });
    studentDocId = profileRes.body.data._id;

    await request(app)
      .post('/api/v1/students/me/academic-records')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        academicYear: '2025-2026',
        grade: 'Grade 11',
        term: 'Midterm',
        subject: 'Mathematics',
        score: 90,
        attendance: 95
      });

    await request(app)
      .post('/api/v1/students/me/skills')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'JavaScript', category: 'technical', level: 'intermediate' });

    // Register Student 2 (Needing attention - Ananya: low attendance & failing score)
    const student2Reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Ananya Attention',
        email: 'ananya.needssupport@sof.org',
        password: 'Password123!',
        role: 'student',
        centerId: 'SOF-BLR-01'
      });
    const s2Token = student2Reg.body.data.accessToken;

    const s2Profile = await request(app)
      .get('/api/v1/students/me')
      .set('Authorization', `Bearer ${s2Token}`);

    // Add failing marks and low attendance for Student 2
    await AcademicRecord.create({
      studentId: s2Profile.body.data._id,
      academicYear: '2025-2026',
      grade: 'Grade 11',
      term: 'Term 1',
      subject: 'Physics',
      score: 38,
      attendance: 62,
      areasForImprovement: ['Electromagnetism']
    });
  });

  describe('Coordinator Dashboard & Attention Metrics', () => {
    it('GET /api/v1/coordinator/dashboard should return system metrics and priority breakdowns', async () => {
      const res = await request(app)
        .get('/api/v1/coordinator/dashboard')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalStudents).toBe(2);
      expect(res.body.data.metrics.priorityCounts).toBeDefined();
      expect(res.body.data.metrics.priorityCounts.LOW).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/coordinator/attention should return students requiring early support intervention', async () => {
      const res = await request(app)
        .get('/api/v1/coordinator/attention')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Ananya should be in attention list due to low score and low attendance
      const ananya = res.body.data.find((s) => s.userId?.email === 'ananya.needssupport@sof.org');
      expect(ananya).toBeDefined();
      expect(['HIGH', 'URGENT']).toContain(ananya.supportPriority.level);
      expect(ananya.supportPriority.reasons.length).toBeGreaterThan(0);
    });
  });

  describe('Coordinator Student 360° Profile API', () => {
    it('GET /api/v1/coordinator/students should return paginated students with real-time priority scores', async () => {
      const res = await request(app)
        .get('/api/v1/coordinator/students?search=Rahul')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].userId.name).toBe('Rahul Kumar');
      expect(res.body.data[0].supportPriority).toBeDefined();
      expect(res.body.data[0].supportPriority.score).toBeDefined();
    });

    it('GET /api/v1/coordinator/students/:studentId should return full Student 360° aggregate view', async () => {
      const res = await request(app)
        .get(`/api/v1/coordinator/students/${studentDocId}`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student._id).toBe(studentDocId.toString());
      expect(res.body.data.supportPriority).toBeDefined();
      expect(res.body.data.academicOverview.averageScore).toBe(90);
      expect(res.body.data.academicOverview.averageAttendance).toBe(95);
      expect(res.body.data.skillsOverview.totalSkills).toBe(1);
      expect(res.body.data.careerReadiness.targetCareer).toBe('Software Engineer');
      expect(res.body.data.interactions).toBeDefined();
      expect(res.body.data.followUps).toBeDefined();
    });
  });

  describe('Security & RBAC Protection', () => {
    it('should forbid students from accessing coordinator dashboard or 360° views', async () => {
      const res = await request(app)
        .get('/api/v1/coordinator/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });
});
