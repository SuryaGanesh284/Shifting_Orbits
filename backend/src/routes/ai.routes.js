const express = require('express');
const { z } = require('zod');
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

const actionPlanSchema = {
  body: z.object({
    focusArea: z.string().optional()
  })
};

const careerMatchSchema = {
  body: z.object({
    targetCareer: z.string().optional()
  })
};

// Student & Coordinator AI endpoints
router.post('/action-plan', validate(actionPlanSchema), aiController.generateActionPlan);
router.post('/career-match', validate(careerMatchSchema), aiController.matchCareerSkills);
router.get('/nudges', aiController.getNudges);

// Coordinator only AI briefing summary
router.get('/student-summary/:studentId', authorizeRoles('coordinator', 'admin'), aiController.getStudentSummary);

module.exports = router;
