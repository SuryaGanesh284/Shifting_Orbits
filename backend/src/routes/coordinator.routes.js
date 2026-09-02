const express = require('express');
const coordinatorController = require('../controllers/coordinator.controller');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

const router = express.Router();

// All coordinator routes require authentication and coordinator or admin role
router.use(authenticate);
router.use(authorizeRoles('coordinator', 'admin'));

// Dashboard & student lists
router.get('/dashboard', coordinatorController.getDashboard);
router.get('/students', coordinatorController.getStudents);
router.get('/attention', coordinatorController.getAttentionList);

// Specific student 360 profile and sub-domains
router.get('/students/:studentId', coordinatorController.getStudent360);
router.get('/students/:studentId/attention', coordinatorController.getStudentAttention);
router.get('/students/:studentId/progress', coordinatorController.getStudentProgress);
router.get('/students/:studentId/academic', coordinatorController.getStudentAcademic);
router.get('/students/:studentId/skills', coordinatorController.getStudentSkills);
router.get('/students/:studentId/career', coordinatorController.getStudentCareer);
router.get('/students/:studentId/interactions', coordinatorController.getStudentInteractions);

module.exports = router;
