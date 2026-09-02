const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');

describe('Step 3: Student Profile, Academic Records, Skills & Goals Modules', () => {
  let studentToken;
  let studentUserId;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Rahul Student',
        email: 'rahul.test@sof.org',
        password: 'Password123!',
        role: 'student',
        phone: '+919876543210',
        centerId: 'SOF-BLR-01'
      });

    studentToken = reg.body.data.accessToken;
    studentUserId = reg.body.data.user._id;
  });

  describe('Student Profile & Dashboard', () => {
    it('GET /api/v1/students/me should return initial student profile', async () => {
      const res = await request(app)
        .get('/api/v1/students/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.program).toBe('Sethu');
      expect(res.body.data.stage).toBe('Grade 11');
      expect(res.body.data.profileCompletion).toBeGreaterThanOrEqual(20);
    });

    it('PUT /api/v1/students/me should update profile details and calculate completion score', async () => {
      const res = await request(app)
        .put('/api/v1/students/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          education: {
            currentGrade: 'Grade 11',
            institution: 'Government PU College, Bangalore',
            stream: 'Science (PCMC)',
            graduationYear: 2026
          },
          interests: ['Programming', 'Robotics', 'Mathematics'],
          aspirations: {
            targetCareer: 'Software Engineer',
            higherEducationGoal: 'B.Tech in Computer Science',
            dreamCompanies: ['Infosys', 'Google', 'JPMC']
          },
          contact: {
            parentName: 'Ramesh Kumar',
            parentPhone: '+919876500000',
            address: '123 Main Road, Bangalore'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.education.institution).toBe('Government PU College, Bangalore');
      expect(res.body.data.aspirations.targetCareer).toBe('Software Engineer');
      expect(res.body.data.profileCompletion).toBe(100);
    });

    it('GET /api/v1/students/me/dashboard should return aggregated summary statistics', async () => {
      const res = await request(app)
        .get('/api/v1/students/me/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.currentStage).toBe('Grade 11');
      expect(res.body.data.summary.program).toBe('Sethu');
    });

    it('GET /api/v1/students/me/journey should return lifecycle roadmap stages', async () => {
      const res = await request(app)
        .get('/api/v1/students/me/journey')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stages.length).toBe(6);
      expect(res.body.data.stages[0].title).toContain('Grade 11');
      expect(res.body.data.stages[0].isCurrent).toBe(true);
    });
  });

  describe('Academic Records & Progress Analytics', () => {
    it('POST & GET /api/v1/students/me/academic-records should add and retrieve marks', async () => {
      const addRes = await request(app)
        .post('/api/v1/students/me/academic-records')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          academicYear: '2025-2026',
          grade: 'Grade 11',
          term: 'Term 1 Midterm',
          subject: 'Mathematics',
          score: 88,
          attendance: 94,
          strengths: ['Calculus', 'Algebra'],
          areasForImprovement: ['Trigonometry']
        });

      expect(addRes.status).toBe(201);
      expect(addRes.body.data.subject).toBe('Mathematics');
      expect(addRes.body.data.score).toBe(88);

      const getRes = await request(app)
        .get('/api/v1/students/me/academic-records')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.count).toBe(1);
      expect(getRes.body.data[0].score).toBe(88);
    });

    it('GET /api/v1/students/me/progress should compute subject averages and trends', async () => {
      await request(app)
        .post('/api/v1/students/me/academic-records')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          academicYear: '2025-2026',
          grade: 'Grade 11',
          term: 'Unit 1',
          subject: 'Computer Science',
          score: 92,
          attendance: 95,
          strengths: ['Python Basics']
        });

      await request(app)
        .post('/api/v1/students/me/academic-records')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          academicYear: '2025-2026',
          grade: 'Grade 11',
          term: 'Unit 2',
          subject: 'Computer Science',
          score: 96,
          attendance: 98,
          strengths: ['OOP Concepts']
        });

      const res = await request(app)
        .get('/api/v1/students/me/progress')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalAssessments).toBe(2);
      expect(res.body.data.subjectBreakdown[0].averageScore).toBe(94);
      expect(res.body.data.identifiedStrengths).toContain('Python Basics');
    });
  });

  describe('Skills Management & Gap Analysis', () => {
    let skillId;

    it('POST /api/v1/students/me/skills should add a skill with evidence', async () => {
      const res = await request(app)
        .post('/api/v1/students/me/skills')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'JavaScript',
          category: 'technical',
          level: 'intermediate',
          evidence: [
            {
              title: 'Built Portfolio Website',
              type: 'project',
              url: 'https://github.com/rahul/portfolio'
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('JavaScript');
      expect(res.body.data.level).toBe('intermediate');
      skillId = res.body.data._id;
    });

    it('PUT & DELETE /api/v1/students/me/skills/:skillId should update and remove skill', async () => {
      const addRes = await request(app)
        .post('/api/v1/students/me/skills')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Git', category: 'technical', level: 'beginner' });

      const id = addRes.body.data._id;

      const updateRes = await request(app)
        .put(`/api/v1/students/me/skills/${id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ level: 'advanced' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.level).toBe('advanced');

      const delRes = await request(app)
        .delete(`/api/v1/students/me/skills/${id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(delRes.status).toBe(200);
    });

    it('GET /api/v1/students/me/career-readiness should evaluate skill gaps against target career', async () => {
      // Set aspiration to Software Engineer
      await request(app)
        .put('/api/v1/students/me/career-profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ targetCareer: 'Software Engineer' });

      // Add 2 of the 5 benchmark skills (JavaScript & Git)
      await request(app)
        .post('/api/v1/students/me/skills')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'JavaScript', category: 'technical', level: 'intermediate' });

      await request(app)
        .post('/api/v1/students/me/skills')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Git', category: 'technical', level: 'beginner' });

      const res = await request(app)
        .get('/api/v1/students/me/career-readiness')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.targetCareer).toBe('Software Engineer');
      expect(res.body.data.matchedSkills).toContain('JavaScript');
      expect(res.body.data.matchedSkills).toContain('Git');
      expect(res.body.data.missingSkills).toContain('Data Structures');
      expect(res.body.data.missingSkills).toContain('Problem Solving');
    });
  });

  describe('Goals & Action Planning', () => {
    it('POST & PUT /api/v1/students/me/goals should manage goals and recalculate progress', async () => {
      const addRes = await request(app)
        .post('/api/v1/students/me/goals')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Complete 11th Grade Board Exam Preparation',
          category: 'academic',
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          milestones: [
            { title: 'Finish Physics Revision', isCompleted: true },
            { title: 'Finish Math Sample Papers', isCompleted: false }
          ]
        });

      expect(addRes.status).toBe(201);
      expect(addRes.body.data.progress).toBe(50);
      expect(addRes.body.data.status).toBe('in_progress');

      const goalId = addRes.body.data._id;

      // Mark second milestone complete
      const updateRes = await request(app)
        .put(`/api/v1/students/me/goals/${goalId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          milestones: [
            { title: 'Finish Physics Revision', isCompleted: true },
            { title: 'Finish Math Sample Papers', isCompleted: true }
          ]
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.progress).toBe(100);
      expect(updateRes.body.data.status).toBe('completed');
    });
  });
});
