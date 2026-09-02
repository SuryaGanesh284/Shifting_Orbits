const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const Student = require('../src/models/Student');
const AcademicRecord = require('../src/models/AcademicRecord');

describe('Step 8: Institutional Analytics, Center Reports & Production Hardening', () => {
  let coordinatorToken;
  let studentToken;

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
        name: 'Priya Institutional Coordinator',
        email: 'priya.analytics@sof.org',
        password: 'Coordinator123!',
        role: 'coordinator',
        centerId: 'SOF-BLR-01'
      });
    coordinatorToken = coordReg.body.data.accessToken;

    // Register Student 1 (Center 1)
    const s1Reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Rahul Bangalore',
        email: 'rahul.blr@sof.org',
        password: 'Password123!',
        role: 'student',
        centerId: 'SOF-BLR-01'
      });
    studentToken = s1Reg.body.data.accessToken;

    const s1Profile = await request(app)
      .get('/api/v1/students/me')
      .set('Authorization', `Bearer ${studentToken}`);

    await AcademicRecord.create({
      studentId: s1Profile.body.data._id,
      academicYear: '2025-2026',
      grade: 'Grade 11',
      term: 'Midterm',
      subject: 'Mathematics',
      score: 92,
      attendance: 96
    });

    // Register Student 2 (Center 2 - Mumbai)
    const s2Reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Aarav Mumbai',
        email: 'aarav.mum@sof.org',
        password: 'Password123!',
        role: 'student',
        centerId: 'SOF-MUM-01'
      });
    const s2Token = s2Reg.body.data.accessToken;

    const s2Profile = await request(app)
      .get('/api/v1/students/me')
      .set('Authorization', `Bearer ${s2Token}`);

    await Student.findByIdAndUpdate(s2Profile.body.data._id, {
      centerId: 'SOF-MUM-01',
      program: 'Stambha',
      stage: 'Grade 12'
    });

    await AcademicRecord.create({
      studentId: s2Profile.body.data._id,
      academicYear: '2025-2026',
      grade: 'Grade 12',
      term: 'Midterm',
      subject: 'Physics',
      score: 78,
      attendance: 88
    });
  });

  describe('Institutional Foundation-Wide Overview', () => {
    it('GET /api/v1/analytics/overview should return aggregate metrics and distributions', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalStudents).toBe(2);
      expect(res.body.data.summary.foundationAvgScore).toBe(85);
      expect(res.body.data.programDistribution.Sethu).toBe(1);
      expect(res.body.data.programDistribution.Stambha).toBe(1);
      expect(res.body.data.supportPriorityDistribution).toBeDefined();
    });
  });

  describe('Cross-Center Comparison Analytics', () => {
    it('GET /api/v1/analytics/centers should compare metrics across distinct learning centers', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/centers')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(2);

      const blrCenter = res.body.data.find((c) => c.centerId === 'SOF-BLR-01');
      expect(blrCenter).toBeDefined();
      expect(blrCenter.studentCount).toBe(1);
      expect(blrCenter.averageScore).toBe(92);
    });

    it('GET /api/v1/analytics/centers/:centerId should return deep center details with student roster', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/centers/SOF-BLR-01')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.centerId).toBe('SOF-BLR-01');
      expect(res.body.data.students.length).toBe(1);
    });
  });

  describe('Data Export Engine (JSON & CSV)', () => {
    it('GET /api/v1/analytics/export/center_summary should export JSON format', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/export/center_summary')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/analytics/export/center_summary?format=csv should export valid CSV file', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/export/center_summary?format=csv')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('centerId');
      expect(res.text).toContain('SOF-BLR-01');
    });
  });

  describe('RBAC Authorization Protection', () => {
    it('should block students from viewing institutional analytics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });
});
