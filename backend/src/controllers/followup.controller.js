const followUpService = require('../services/followup.service');
const { asyncHandler } = require('../middleware/errorHandler');

const createFollowUp = asyncHandler(async (req, res) => {
  const followUp = await followUpService.createFollowUp(req.user._id, req.body);
  res.status(201).json({ success: true, message: 'Follow-up created', data: followUp });
});

const getFollowUps = asyncHandler(async (req, res) => {
  const followups = await followUpService.getCoordinatorFollowUps(req.user._id, req.query);
  res.status(200).json({ success: true, count: followups.length, data: followups });
});

const getTodayFollowUps = asyncHandler(async (req, res) => {
  const followups = await followUpService.getTodayFollowUps(req.user._id);
  res.status(200).json({ success: true, count: followups.length, data: followups });
});

const getOverdueFollowUps = asyncHandler(async (req, res) => {
  const followups = await followUpService.getOverdueFollowUps(req.user._id);
  res.status(200).json({ success: true, count: followups.length, data: followups });
});

const updateFollowUp = asyncHandler(async (req, res) => {
  const followUp = await followUpService.updateFollowUp(req.params.id, req.user._id, req.body);
  res.status(200).json({ success: true, message: 'Follow-up updated', data: followUp });
});

const completeFollowUp = asyncHandler(async (req, res) => {
  const followUp = await followUpService.completeFollowUp(req.params.id, req.user._id, req.body.completionNotes);
  res.status(200).json({ success: true, message: 'Follow-up marked completed', data: followUp });
});

module.exports = {
  createFollowUp,
  getFollowUps,
  getTodayFollowUps,
  getOverdueFollowUps,
  updateFollowUp,
  completeFollowUp
};
