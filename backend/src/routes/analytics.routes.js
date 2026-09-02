const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('coordinator', 'admin'));

router.get('/overview', analyticsController.getOverview);
router.get('/centers', analyticsController.getCenters);
router.get('/centers/:centerId', analyticsController.getCenterDetails);
router.get('/export/:reportType', analyticsController.exportReport);

module.exports = router;
