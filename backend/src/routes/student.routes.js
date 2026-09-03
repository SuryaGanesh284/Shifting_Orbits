const express = require('express');
const { z } = require('zod');
const studentController = require('../controllers/student.controller');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All student routes require authentication and student role (or coordinator/admin)
router.use(authenticate);
router.use(authorizeRoles('student', 'coordinator', 'admin'));

// Validation Schemas
const updateProfileSchema = {
  body: z.object({
    program: z.enum(['Sethu', 'Stambha']).optional(),
    stage: z.enum(['Grade 11', 'Grade 12', 'Higher Education', 'Skill Development', 'Internship', 'Employment']).optional(),
    education: z.object({
      currentGrade: z.string().optional(),
      institution: z.string().optional(),
      stream: z.string().optional(),
      graduationYear: z.coerce.number().optional(),
      board: z.string().optional()
    }).optional(),
    interests: z.array(z.string()).optional(),
    aspirations: z.object({
      targetCareer: z.string().optional(),
      higherEducationGoal: z.string().optional(),
      dreamCompanies: z.array(z.string()).optional(),
      notes: z.string().optional()
    }).optional(),
    contact: z.object({
      parentName: z.string().optional(),
      parentPhone: z.string().optional(),
      address: z.string().optional(),
      emergencyContact: z.string().optional()
    }).optional()
  })
};

const addAcademicRecordSchema = {
  body: z.object({
    academicYear: z.string().min(1, 'Academic year is required'),
    grade: z.string().min(1, 'Grade is required'),
    term: z.string().optional(),
    subject: z.string().min(1, 'Subject is required'),
    score: z.coerce.number().min(0).max(100),
    maxScore: z.coerce.number().optional().default(100),
    attendance: z.coerce.number().min(0).max(100).optional().default(90),
    strengths: z.array(z.string()).optional(),
    areasForImprovement: z.array(z.string()).optional(),
    remarks: z.string().optional()
  })
};

const skillSchema = {
  body: z.object({
    name: z.string().min(1, 'Skill name is required'),
    category: z.enum(['technical', 'soft', 'domain', 'language']).optional().default('technical'),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional().default('beginner'),
    evidence: z.array(
      z.object({
        title: z.string(),
        type: z.enum(['project', 'certificate', 'competition', 'course', 'other']).optional(),
        url: z.string().optional(),
        issuedBy: z.string().optional()
      })
    ).optional()
  })
};

const goalSchema = {
  body: z.object({
    title: z.string().min(1, 'Goal title is required'),
    description: z.string().optional(),
    category: z.enum(['academic', 'skill', 'career', 'personal']).optional().default('academic'),
    targetDate: z.string().or(z.date()),
    progress: z.number().min(0).max(100).optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'deferred', 'cancelled']).optional(),
    milestones: z.array(
      z.object({
        title: z.string(),
        isCompleted: z.boolean().optional(),
        completedAt: z.date().optional()
      })
    ).optional()
  })
};

// Profile & Journey routes
router.get('/me', studentController.getProfile);
router.put('/me', validate(updateProfileSchema), studentController.updateProfile);
router.get('/me/dashboard', studentController.getDashboard);
router.get('/me/journey', studentController.getJourney);
router.get('/me/progress', studentController.getProgress);

// Academic records
router.get('/me/academic-records', studentController.getAcademicRecords);
router.post('/me/academic-records', validate(addAcademicRecordSchema), studentController.addAcademicRecord);

// Skills
router.get('/me/skills', studentController.getSkills);
router.post('/me/skills', validate(skillSchema), studentController.addSkill);
router.put('/me/skills/:skillId', studentController.updateSkill);
router.delete('/me/skills/:skillId', studentController.deleteSkill);

// Goals
router.get('/me/goals', studentController.getGoals);
router.post('/me/goals', validate(goalSchema), studentController.createGoal);
router.put('/me/goals/:goalId', studentController.updateGoal);
router.delete('/me/goals/:goalId', studentController.deleteGoal);

// Career
router.get('/me/career-profile', studentController.getCareerProfile);
router.put('/me/career-profile', studentController.updateCareerProfile);
router.get('/me/career-readiness', studentController.getCareerReadiness);

module.exports = router;
