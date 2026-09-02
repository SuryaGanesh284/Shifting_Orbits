const aiService = require('../services/ai.service');
const { asyncHandler } = require('../middleware/errorHandler');

const generateActionPlan = asyncHandler(async (req, res) => {
  const result = await aiService.generateActionPlan(req.user._id, req.body.focusArea);
  res.status(200).json({ success: true, data: result });
});

const matchCareerSkills = asyncHandler(async (req, res) => {
  const result = await aiService.matchCareerSkills(req.user._id, req.body.targetCareer);
  res.status(200).json({ success: true, data: result });
});

const getNudges = asyncHandler(async (req, res) => {
  const nudges = await aiService.generateNudges(req.user._id);
  res.status(200).json({ success: true, count: nudges.length, data: nudges });
});

const getStudentSummary = asyncHandler(async (req, res) => {
  const summary = await aiService.summarizeStudentForCoordinator(req.params.studentId);
  res.status(200).json({ success: true, data: summary });
});

module.exports = {
  generateActionPlan,
  matchCareerSkills,
  getNudges,
  getStudentSummary
};
