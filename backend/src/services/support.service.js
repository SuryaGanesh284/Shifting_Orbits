const SupportRequest = require('../models/SupportRequest');
const Student = require('../models/Student');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');
const { emitToRole, emitToUser } = require('../config/socket');

const createSupportRequest = async (userId, data) => {
  const student = await Student.findOne({ userId });
  if (!student) {
    throw ApiError.badRequest('Student profile not found. Complete profile first.');
  }

  const supportRequest = new SupportRequest({
    studentId: student._id,
    category: data.category,
    title: data.title,
    description: data.description,
    priority: data.priority || 'medium',
    assignedCoordinator: student.coordinatorId || null
  });

  await supportRequest.save();

  const populated = await SupportRequest.findById(supportRequest._id)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .populate('assignedCoordinator', 'name email');

  // Real-time notification broadcast
  emitToRole('coordinator', 'support_request.created', {
    message: `New support request: ${supportRequest.title}`,
    supportRequest: populated
  });

  if (student.coordinatorId) {
    emitToUser(student.coordinatorId.toString(), 'support_request.created', {
      message: `Support request assigned from student`,
      supportRequest: populated
    });
  }

  return populated;
};

const getStudentSupportRequests = async (userId) => {
  const student = await Student.findOne({ userId });
  if (!student) return [];

  return SupportRequest.find({ studentId: student._id })
    .populate('assignedCoordinator', 'name email')
    .sort({ createdAt: -1 });
};

const getSupportRequestById = async (requestId, user) => {
  const request = await SupportRequest.findById(requestId)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .populate('assignedCoordinator', 'name email');

  if (!request) throw ApiError.notFound('Support request not found');

  // Security check: Student can only view their own request
  if (user.role === 'student') {
    const student = await Student.findOne({ userId: user._id });
    if (!student || request.studentId._id.toString() !== student._id.toString()) {
      throw ApiError.forbidden('Access denied: You cannot view this support request');
    }
  }

  return request;
};

const updateSupportRequest = async (requestId, user, data) => {
  const request = await SupportRequest.findById(requestId);
  if (!request) throw ApiError.notFound('Support request not found');

  if (user.role === 'student') {
    const student = await Student.findOne({ userId: user._id });
    if (!student || request.studentId.toString() !== student._id.toString()) {
      throw ApiError.forbidden('Access denied');
    }
    if (request.status !== 'pending') {
      throw ApiError.badRequest('Cannot edit a support request that is already in progress or resolved');
    }
    if (data.title) request.title = data.title;
    if (data.description) request.description = data.description;
    if (data.category) request.category = data.category;
    if (data.priority) request.priority = data.priority;
  } else {
    // Coordinator or admin updates
    if (data.status) {
      request.status = data.status;
      if (data.status === 'resolved') {
        request.resolvedAt = new Date();
      }
    }
    if (data.assignedCoordinator) request.assignedCoordinator = data.assignedCoordinator;
    if (data.resolutionNotes !== undefined) request.resolutionNotes = data.resolutionNotes;
    if (data.priority) request.priority = data.priority;
  }

  await request.save();

  const populated = await SupportRequest.findById(request._id)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .populate('assignedCoordinator', 'name email');

  // Real-time notification to student
  const student = await Student.findById(request.studentId);
  if (student) {
    emitToUser(student.userId.toString(), 'support_request.updated', {
      message: `Your support request '${request.title}' status was updated to ${request.status}`,
      supportRequest: populated
    });
  }

  return populated;
};

const cancelSupportRequest = async (requestId, userId) => {
  const student = await Student.findOne({ userId });
  if (!student) throw ApiError.badRequest('Student not found');

  const request = await SupportRequest.findOne({ _id: requestId, studentId: student._id });
  if (!request) throw ApiError.notFound('Support request not found');

  if (request.status === 'resolved') {
    throw ApiError.badRequest('Cannot cancel a resolved request');
  }

  request.status = 'cancelled';
  await request.save();

  return { message: 'Support request cancelled successfully' };
};

module.exports = {
  createSupportRequest,
  getStudentSupportRequests,
  getSupportRequestById,
  updateSupportRequest,
  cancelSupportRequest
};
