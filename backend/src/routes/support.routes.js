const express = require('express');
const { z } = require('zod');
const supportController = require('../controllers/support.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

const createSupportSchema = {
  body: z.object({
    category: z.enum(['academic', 'career', 'skill', 'college', 'financial', 'general']),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium')
  })
};

router.post('/', validate(createSupportSchema), supportController.createRequest);
router.get('/my', supportController.getMyRequests);
router.get('/:id', supportController.getRequestById);
router.put('/:id', supportController.updateRequest);
router.delete('/:id', supportController.cancelRequest);

module.exports = router;
