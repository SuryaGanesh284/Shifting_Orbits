const express = require('express');
const { z } = require('zod');
const interactionController = require('../controllers/interaction.controller');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

const createInteractionSchema = {
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    type: z.enum(['in_person', 'call', 'online_meeting', 'center_visit', 'home_visit', 'other']).optional().default('in_person'),
    notes: z.string().min(5, 'Discussion notes are required'),
    summary: z.string().optional(),
    concerns: z.array(z.string()).optional(),
    actionItems: z.array(
      z.object({
        description: z.string().min(1),
        isCompleted: z.boolean().optional().default(false),
        targetDate: z.string().or(z.date()).optional()
      })
    ).optional(),
    interactionDate: z.string().or(z.date()).optional(),
    nextFollowUpDate: z.string().or(z.date()).optional(),
    followUpTitle: z.string().optional(),
    followUpDescription: z.string().optional(),
    followUpPriority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
  })
};

// Coordinator only routes for creation, update, delete
router.post('/', authorizeRoles('coordinator', 'admin'), validate(createInteractionSchema), interactionController.createInteraction);
router.put('/:id', authorizeRoles('coordinator', 'admin'), interactionController.updateInteraction);
router.delete('/:id', authorizeRoles('coordinator', 'admin'), interactionController.deleteInteraction);

// Both Coordinator and Student can view interactions
router.get('/', interactionController.getAllInteractions);
router.get('/:id', interactionController.getInteractionById);
router.get('/student/:studentId', interactionController.getStudentInteractions);

module.exports = router;
