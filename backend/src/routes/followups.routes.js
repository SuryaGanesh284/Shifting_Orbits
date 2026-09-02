const express = require('express');
const { z } = require('zod');
const followUpController = require('../controllers/followup.controller');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('coordinator', 'admin'));

const createFollowUpSchema = {
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    title: z.string().min(3, 'Title is required'),
    description: z.string().optional(),
    dueDate: z.string().or(z.date()),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
    interactionId: z.string().optional(),
    supportRequestId: z.string().optional()
  })
};

router.post('/', validate(createFollowUpSchema), followUpController.createFollowUp);
router.get('/', followUpController.getFollowUps);
router.get('/today', followUpController.getTodayFollowUps);
router.get('/overdue', followUpController.getOverdueFollowUps);
router.put('/:id', followUpController.updateFollowUp);
router.post('/:id/complete', followUpController.completeFollowUp);

module.exports = router;
