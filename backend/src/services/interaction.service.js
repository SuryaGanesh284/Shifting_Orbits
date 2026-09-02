const Interaction = require('../models/Interaction');
const FollowUp = require('../models/FollowUp');
const Student = require('../models/Student');
const User = require('../models/User');
const { getOrCreateStudent } = require('./student.service');
const notificationService = require('./notification.service');
const { ApiError } = require('../middleware/errorHandler');
const { emitToUser } = require('../config/socket');

const resolveStudent = async (identifier) => {
  if (!identifier) return null;
  let student = null;

  // Try by Student ID
  try {
    student = await Student.findById(identifier);
  } catch (err) {}

  // Try by User ID
  if (!student) {
    try {
      student = await Student.findOne({ userId: identifier });
    } catch (err) {}
  }

  // Check User collection and auto-initialize if needed
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

const createInteraction = async (coordinatorId, data) => {
  const student = await resolveStudent(data.studentId);
  if (!student) {
    throw ApiError.notFound(`Student with ID '${data.studentId}' not found. Please provide a valid student or user ID.`);
  }

  // Assign coordinator to student if unassigned
  if (!student.coordinatorId) {
    student.coordinatorId = coordinatorId;
    await student.save();
  }

  const interaction = new Interaction({
    studentId: student._id,
    coordinatorId,
    type: data.type || 'in_person',
    notes: data.notes,
    summary: data.summary || '',
    concerns: data.concerns || [],
    actionItems: data.actionItems || [],
    interactionDate: data.interactionDate ? new Date(data.interactionDate) : new Date(),
    nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null
  });

  await interaction.save();

  // If next follow-up date was set, automatically create a FollowUp item
  let followUpTask = null;
  if (data.nextFollowUpDate) {
    followUpTask = new FollowUp({
      studentId: student._id,
      coordinatorId,
      interactionId: interaction._id,
      title: data.followUpTitle || `Follow-up regarding interaction on ${new Date().toLocaleDateString()}`,
      description: data.followUpDescription || data.summary || 'Follow-up on agreed action items',
      dueDate: new Date(data.nextFollowUpDate),
      priority: data.followUpPriority || 'medium'
    });
    await followUpTask.save();
  }

  const populated = await Interaction.findById(interaction._id)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .populate('coordinatorId', 'name email');

  // In-App Notification to student
  const studentUser = await User.findById(student.userId);
  if (studentUser) {
    await notificationService.createNotification({
      userId: studentUser._id,
      title: 'New Interaction Logged by Coordinator',
      message: `Your coordinator recorded discussion notes and ${data.actionItems?.length || 0} action item(s).`,
      type: 'interaction',
      priority: 'medium',
      link: `/interactions/${interaction._id}`,
      metadata: { interactionId: interaction._id }
    });

    emitToUser(studentUser._id.toString(), 'interaction.created', {
      message: `New interaction recorded by your coordinator`,
      interaction: populated
    });
  }

  return {
    interaction: populated,
    createdFollowUp: followUpTask
  };
};

const getInteractionById = async (interactionId, user) => {
  const interaction = await Interaction.findById(interactionId)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .populate('coordinatorId', 'name email');

  if (!interaction) throw ApiError.notFound('Interaction not found');

  // Security check: student can only view their own interactions
  if (user.role === 'student') {
    const student = await Student.findOne({ userId: user._id });
    if (!student || interaction.studentId._id.toString() !== student._id.toString()) {
      throw ApiError.forbidden('Access denied');
    }
  }

  return interaction;
};

const getStudentInteractions = async (studentId, user) => {
  const student = await resolveStudent(studentId);
  if (!student) throw ApiError.notFound('Student not found');

  if (user.role === 'student') {
    if (student.userId.toString() !== user._id.toString()) {
      throw ApiError.forbidden('Access denied');
    }
  }

  return Interaction.find({ studentId: student._id })
    .populate('coordinatorId', 'name email')
    .sort({ interactionDate: -1 });
};

const getAllInteractions = async (user, filters = {}) => {
  let query = {};
  if (user.role === 'coordinator') {
    query.coordinatorId = user._id;
  } else if (user.role === 'student') {
    const student = await Student.findOne({ userId: user._id });
    if (!student) return [];
    query.studentId = student._id;
  }

  if (filters.studentId) {
    const resolved = await resolveStudent(filters.studentId);
    if (resolved) query.studentId = resolved._id;
  }

  return Interaction.find(query)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .populate('coordinatorId', 'name email')
    .sort({ interactionDate: -1 });
};

const updateInteraction = async (interactionId, coordinatorId, data) => {
  const interaction = await Interaction.findOne({ _id: interactionId, coordinatorId });
  if (!interaction) throw ApiError.notFound('Interaction not found');

  if (data.type) interaction.type = data.type;
  if (data.notes) interaction.notes = data.notes;
  if (data.summary !== undefined) interaction.summary = data.summary;
  if (data.concerns) interaction.concerns = data.concerns;
  if (data.actionItems) interaction.actionItems = data.actionItems;
  if (data.nextFollowUpDate) interaction.nextFollowUpDate = new Date(data.nextFollowUpDate);

  await interaction.save();

  return Interaction.findById(interaction._id)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .populate('coordinatorId', 'name email');
};

const deleteInteraction = async (interactionId, coordinatorId) => {
  const interaction = await Interaction.findOneAndDelete({ _id: interactionId, coordinatorId });
  if (!interaction) throw ApiError.notFound('Interaction not found');

  // Also clean up linked follow-ups if pending
  await FollowUp.deleteMany({ interactionId, status: 'pending' });

  return { message: 'Interaction deleted successfully' };
};

module.exports = {
  createInteraction,
  getInteractionById,
  getStudentInteractions,
  getAllInteractions,
  updateInteraction,
  deleteInteraction,
  resolveStudent
};
