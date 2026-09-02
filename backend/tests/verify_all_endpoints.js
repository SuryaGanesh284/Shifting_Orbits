const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');

async function verifyAllEndpoints() {
  console.log('\n============================================================');
  console.log('🚀 RUNNING COMPREHENSIVE END-TO-END BACKEND API AUDIT');
  console.log('============================================================\n');

  await connectTestDB();
  await clearTestDB();

  const results = [];

  async function check(name, method, url, sendData = null, token = null, expectedStatus = 200) {
    let req = request(app)[method.toLowerCase()](url);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    if (sendData) req = req.send(sendData);

    const res = await req;
    const isSuccess = res.status === expectedStatus || (expectedStatus === 200 && (res.status === 200 || res.status === 201));
    const icon = isSuccess ? '✅' : '❌';
    console.log(`${icon} [${method.toUpperCase()}] ${url.padEnd(45)} -> Status: ${res.status} (Expected ${expectedStatus})`);
    results.push({ name, method, url, status: res.status, expected: expectedStatus, passed: isSuccess });
    return res;
  }

  // 1. Health & Root
  console.log('\n--- MODULE 1: HEALTH & CORE ---');
  await check('Root Welcome API', 'GET', '/', null, null, 200);
  await check('System Health Check', 'GET', '/api/v1/health', null, null, 200);

  // 2. Auth & RBAC
  console.log('\n--- MODULE 2: AUTHENTICATION & RBAC ---');
  const sReg = await check('Register Student', 'POST', '/api/v1/auth/register', {
    name: 'Rahul Audit Student',
    email: 'rahul.audit@sof.org',
    password: 'Password123!',
    role: 'student',
    centerId: 'SOF-BLR-01'
  }, null, 201);
  const studentToken = sReg.body.data.accessToken;
  const studentUserId = sReg.body.data.user._id;

  const cReg = await check('Register Coordinator', 'POST', '/api/v1/auth/register', {
    name: 'Priya Audit Coordinator',
    email: 'priya.audit@sof.org',
    password: 'Coordinator123!',
    role: 'coordinator',
    centerId: 'SOF-BLR-01'
  }, null, 201);
  const coordinatorToken = cReg.body.data.accessToken;

  const sLogin = await check('Login User', 'POST', '/api/v1/auth/login', {
    email: 'rahul.audit@sof.org',
    password: 'Password123!'
  }, null, 200);
  const refreshToken = sLogin.body.data.refreshToken;

  await check('Get Current User (Student)', 'GET', '/api/v1/auth/me', null, studentToken, 200);
  await check('Refresh Token Rotation', 'POST', '/api/v1/auth/refresh', { refreshToken }, null, 200);

  // 3. Student Domain
  console.log('\n--- MODULE 3: STUDENT DOMAIN & PROGRESS ---');
  const pRes = await check('Get Student Profile', 'GET', '/api/v1/students/me', null, studentToken, 200);
  const studentDocId = pRes.body.data._id;

  await check('Update Student Profile', 'PUT', '/api/v1/students/me', {
    education: { currentGrade: 'Grade 11', institution: 'Audit PU College', stream: 'Science' },
    aspirations: { targetCareer: 'Software Engineer', higherEducationGoal: 'B.Tech CS' }
  }, studentToken, 200);

  await check('Get Student Dashboard', 'GET', '/api/v1/students/me/dashboard', null, studentToken, 200);
  await check('Get Student Journey Roadmap', 'GET', '/api/v1/students/me/journey', null, studentToken, 200);

  await check('Add Academic Record', 'POST', '/api/v1/students/me/academic-records', {
    academicYear: '2025-2026',
    grade: 'Grade 11',
    term: 'Midterm',
    subject: 'Mathematics',
    score: 91,
    attendance: 95
  }, studentToken, 201);

  await check('Get Academic Records', 'GET', '/api/v1/students/me/academic-records', null, studentToken, 200);
  await check('Get Academic Progress Analytics', 'GET', '/api/v1/students/me/progress', null, studentToken, 200);

  const skillRes = await check('Add Skill', 'POST', '/api/v1/students/me/skills', {
    name: 'JavaScript',
    category: 'technical',
    level: 'intermediate'
  }, studentToken, 201);
  const skillId = skillRes.body.data._id;

  await check('Get Skills List', 'GET', '/api/v1/students/me/skills', null, studentToken, 200);
  await check('Update Skill', 'PUT', `/api/v1/students/me/skills/${skillId}`, { level: 'advanced' }, studentToken, 200);

  const goalRes = await check('Add Goal', 'POST', '/api/v1/students/me/goals', {
    title: 'Complete Algorithms Course',
    category: 'skill',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }, studentToken, 201);
  const goalId = goalRes.body.data._id;

  await check('Get Goals List', 'GET', '/api/v1/students/me/goals', null, studentToken, 200);
  await check('Update Goal', 'PUT', `/api/v1/students/me/goals/${goalId}`, { status: 'in_progress' }, studentToken, 200);
  await check('Get Career Readiness', 'GET', '/api/v1/students/me/career-readiness', null, studentToken, 200);

  // 4. Support Requests, Interactions & Follow-Ups
  console.log('\n--- MODULE 4: SUPPORT REQUESTS & INTERACTIONS ---');
  const reqRes = await check('Create Support Request', 'POST', '/api/v1/support-requests', {
    category: 'career',
    title: 'Mentoring session request',
    description: 'Would like advice on university computer science entrance.',
    priority: 'high'
  }, studentToken, 201);
  const supportReqId = reqRes.body.data._id;

  await check('Get My Support Requests', 'GET', '/api/v1/support-requests/my', null, studentToken, 200);
  await check('Get Support Request By ID', 'GET', `/api/v1/support-requests/${supportReqId}`, null, studentToken, 200);
  await check('Update Support Request (Coordinator)', 'PUT', `/api/v1/support-requests/${supportReqId}`, {
    status: 'in_progress',
    resolutionNotes: 'Meeting scheduled with student'
  }, coordinatorToken, 200);

  const intRes = await check('Record Coordinator Interaction', 'POST', '/api/v1/interactions', {
    studentId: studentDocId,
    type: 'in_person',
    notes: 'Discussed university admissions and algorithms progress.',
    actionItems: [{ description: 'Practice 2 mock tests', isCompleted: false }],
    nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    followUpTitle: 'Review Mock Test Results'
  }, coordinatorToken, 201);
  const interactionId = intRes.body.data._id;

  await check('List All Interactions', 'GET', '/api/v1/interactions', null, coordinatorToken, 200);
  await check('Get Interaction By ID', 'GET', `/api/v1/interactions/${interactionId}`, null, coordinatorToken, 200);
  await check('Get Student Interactions History', 'GET', `/api/v1/interactions/student/${studentDocId}`, null, coordinatorToken, 200);

  const fList = await check('Get Coordinator Follow-Ups', 'GET', '/api/v1/followups', null, coordinatorToken, 200);
  await check('Get Follow-Ups Due Today', 'GET', '/api/v1/followups/today', null, coordinatorToken, 200);
  await check('Get Overdue Follow-Ups', 'GET', '/api/v1/followups/overdue', null, coordinatorToken, 200);

  if (fList.body.data.length > 0) {
    const fId = fList.body.data[0]._id;
    await check('Complete Follow-Up', 'POST', `/api/v1/followups/${fId}/complete`, { completionNotes: 'Done' }, coordinatorToken, 200);
  }

  // 5. Coordinator Domain & 360 View
  console.log('\n--- MODULE 5: COORDINATOR 360 PORTAL ---');
  await check('Coordinator Dashboard', 'GET', '/api/v1/coordinator/dashboard', null, coordinatorToken, 200);
  await check('Coordinator Students Directory', 'GET', '/api/v1/coordinator/students', null, coordinatorToken, 200);
  await check('Early Attention Required List', 'GET', '/api/v1/coordinator/attention', null, coordinatorToken, 200);
  await check('Full Student 360 Profile', 'GET', `/api/v1/coordinator/students/${studentDocId}`, null, coordinatorToken, 200);
  await check('Student Attention Factor Breakdown', 'GET', `/api/v1/coordinator/students/${studentDocId}/attention`, null, coordinatorToken, 200);
  await check('Student Academic History (Coordinator)', 'GET', `/api/v1/coordinator/students/${studentDocId}/academic`, null, coordinatorToken, 200);
  await check('Student Skills (Coordinator)', 'GET', `/api/v1/coordinator/students/${studentDocId}/skills`, null, coordinatorToken, 200);

  // 6. Real-Time Notifications
  console.log('\n--- MODULE 6: REAL-TIME NOTIFICATIONS ---');
  const nList = await check('Get Notifications List', 'GET', '/api/v1/notifications', null, studentToken, 200);
  await check('Get Unread Notification Count', 'GET', '/api/v1/notifications/unread-count', null, studentToken, 200);

  if (nList.body.data.length > 0) {
    const nId = nList.body.data[0]._id;
    await check('Mark Single Notification As Read', 'PUT', `/api/v1/notifications/${nId}/read`, null, studentToken, 200);
  }
  await check('Mark All Notifications As Read', 'PUT', '/api/v1/notifications/read-all', null, studentToken, 200);

  // 7. AI Intelligence Layer
  console.log('\n--- MODULE 7: AI INTELLIGENCE LAYER ---');
  await check('AI Action Plan Generator', 'POST', '/api/v1/ai/action-plan', { focusArea: 'Software Engineer' }, studentToken, 200);
  await check('AI Career Skill Gap Matcher', 'POST', '/api/v1/ai/career-match', { targetCareer: 'Software Engineer' }, studentToken, 200);
  await check('AI Smart Nudges Engine', 'GET', '/api/v1/ai/nudges', null, studentToken, 200);
  await check('AI Student Briefing Summary (Coordinator)', 'GET', `/api/v1/ai/student-summary/${studentDocId}`, null, coordinatorToken, 200);

  // 8. Institutional Analytics & Reports
  console.log('\n--- MODULE 8: INSTITUTIONAL ANALYTICS & REPORTS ---');
  await check('Institutional Foundation Overview', 'GET', '/api/v1/analytics/overview', null, coordinatorToken, 200);
  await check('Cross-Center Comparison Analytics', 'GET', '/api/v1/analytics/centers', null, coordinatorToken, 200);
  await check('Center Details (SOF-BLR-01)', 'GET', '/api/v1/analytics/centers/SOF-BLR-01', null, coordinatorToken, 200);
  await check('Export At-Risk Students (JSON)', 'GET', '/api/v1/analytics/export/at_risk_students', null, coordinatorToken, 200);
  await check('Export Center Summary (CSV)', 'GET', '/api/v1/analytics/export/center_summary?format=csv', null, coordinatorToken, 200);

  await closeTestDB();

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n============================================================');
  console.log(`📊 FINAL AUDIT SUMMARY: ${passed}/${total} ENDPOINTS PASSED (${failed} FAILED)`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

verifyAllEndpoints().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
