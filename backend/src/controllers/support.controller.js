const supportService = require('../services/support.service');
const { asyncHandler } = require('../middleware/errorHandler');

const createRequest = asyncHandler(async (req, res) => {
  const request = await supportService.createSupportRequest(req.user._id, req.body);
  res.status(201).json({ success: true, message: 'Support request submitted', data: request });
});

const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await supportService.getStudentSupportRequests(req.user._id);
  res.status(200).json({ success: true, count: requests.length, data: requests });
});

const getRequestById = asyncHandler(async (req, res) => {
  const request = await supportService.getSupportRequestById(req.params.id, req.user);
  res.status(200).json({ success: true, data: request });
});

const updateRequest = asyncHandler(async (req, res) => {
  const request = await supportService.updateSupportRequest(req.params.id, req.user, req.body);
  res.status(200).json({ success: true, message: 'Support request updated', data: request });
});

const cancelRequest = asyncHandler(async (req, res) => {
  const result = await supportService.cancelSupportRequest(req.params.id, req.user._id);
  res.status(200).json({ success: true, message: result.message });
});

module.exports = {
  createRequest,
  getMyRequests,
  getRequestById,
  updateRequest,
  cancelRequest
};
