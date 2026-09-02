const interactionService = require('../services/interaction.service');
const { asyncHandler } = require('../middleware/errorHandler');

const createInteraction = asyncHandler(async (req, res) => {
  const result = await interactionService.createInteraction(req.user._id, req.body);
  res.status(201).json({
    success: true,
    message: 'Interaction recorded successfully',
    data: result.interaction,
    createdFollowUp: result.createdFollowUp
  });
});

const getInteractionById = asyncHandler(async (req, res) => {
  const interaction = await interactionService.getInteractionById(req.params.id, req.user);
  res.status(200).json({ success: true, data: interaction });
});

const getStudentInteractions = asyncHandler(async (req, res) => {
  const interactions = await interactionService.getStudentInteractions(req.params.studentId, req.user);
  res.status(200).json({ success: true, count: interactions.length, data: interactions });
});

const updateInteraction = asyncHandler(async (req, res) => {
  const interaction = await interactionService.updateInteraction(req.params.id, req.user._id, req.body);
  res.status(200).json({ success: true, message: 'Interaction updated', data: interaction });
});

const deleteInteraction = asyncHandler(async (req, res) => {
  const result = await interactionService.deleteInteraction(req.params.id, req.user._id);
  res.status(200).json({ success: true, message: result.message });
});

const getAllInteractions = asyncHandler(async (req, res) => {
  const interactions = await interactionService.getAllInteractions(req.user, req.query);
  res.status(200).json({ success: true, count: interactions.length, data: interactions });
});

module.exports = {
  createInteraction,
  getInteractionById,
  getStudentInteractions,
  getAllInteractions,
  updateInteraction,
  deleteInteraction
};
