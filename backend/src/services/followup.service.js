const FollowUp = require('../models/FollowUp');
const Student = require('../models/Student');
const User = require('../models/User');
const { getOrCreateStudent } = require('./student.service');
const { ApiError } = require('../middleware/errorHandler');
const { emitToUser } = require('../config/socket');

const resolveStudent = async (identifier) => {
  if (!identifier) return null;
  let student = null;

  try {
    student = await Student.findById(identifier);
  } catch (err) {}

  if (!student) {
    try {
      student = await Student.findOne({ userId: identifier });
    } catch (err) {}
  }

  if (!student) {
    try {
      const user = await User.findById(identifier);
      if (user && user.role === 'student') {
        student = await getOrCreateStudent(user._id);
      }
    } catch (err) {}
  }

  return student;
};

const createFollowUp = async (coordinatorId, data) => {
  const student = await resolveStudent(data.studentId);
  if (!student) {
    throw ApiError.notFound(`Student with ID '${data.studentId}' not found`);
  }

  const followUp = new FollowUp({
    studentId: student._id,
    coordinatorId,
    interactionId: data.interactionId || null,
    supportRequestId: data.supportRequestId || null,
    title: data.title,
    description: data.description || '',
    dueDate: new Date(data.dueDate),
    priority: data.priority || 'medium'
  });

  await followUp.save();

  return FollowUp.findById(followUp._id)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .populate('coordinatorId', 'name email');
};

const getCoordinatorFollowUps = async (coordinatorId, filters = {}) => {
  const query = { coordinatorId };

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.studentId) {
    const student = await resolveStudent(filters.studentId);
    if (student) query.studentId = student._id;
  }

  const followups = await FollowUp.find(query)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .sort({ dueDate: 1 });

  // Update any that have naturally become overdue
  for (const f of followups) {
    if (f.status === 'pending' && new Date() > f.dueDate) {
      f.status = 'overdue';
      await f.save();
    }
  }

  return followups;
};

const getTodayFollowUps = async (coordinatorId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return FollowUp.find({
    coordinatorId,
    dueDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'cancelled' }
  })
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .sort({ dueDate: 1 });
};

const getOverdueFollowUps = async (coordinatorId) => {
  const now = new Date();

  return FollowUp.find({
    coordinatorId,
    dueDate: { $lt: now },
    status: { $in: ['pending', 'in_progress', 'overdue'] }
  })
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .sort({ dueDate: 1 });
};

const updateFollowUp = async (followUpId, coordinatorId, data) => {
  const followUp = await FollowUp.findOne({ _id: followUpId, coordinatorId });
  if (!followUp) throw ApiError.notFound('Follow-up task not found');

  if (data.title) followUp.title = data.title;
  if (data.description !== undefined) followUp.description = data.description;
  if (data.dueDate) followUp.dueDate = new Date(data.dueDate);
  if (data.priority) followUp.priority = data.priority;
  if (data.status) {
    followUp.status = data.status;
    if (data.status === 'completed') {
      followUp.completedAt = new Date();
    }
  }
  if (data.completionNotes !== undefined) followUp.completionNotes = data.completionNotes;

  await followUp.save();

  return FollowUp.findById(followUp._id)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .populate('coordinatorId', 'name email');
};

const completeFollowUp = async (followUpId, coordinatorId, completionNotes = '') => {
  const followUp = await FollowUp.findOne({ _id: followUpId, coordinatorId });
  if (!followUp) throw ApiError.notFound('Follow-up task not found');

  followUp.status = 'completed';
  followUp.completedAt = new Date();
  if (completionNotes) followUp.completionNotes = completionNotes;

  await followUp.save();

  return FollowUp.findById(followUp._id)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .populate('coordinatorId', 'name email');
};

module.exports = {
  createFollowUp,
  getCoordinatorFollowUps,
  getTodayFollowUps,
  getOverdueFollowUps,
  updateFollowUp,
  completeFollowUp
};
