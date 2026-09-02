const Interaction = require('../models/Interaction');
const FollowUp = require('../models/FollowUp');
const Student = require('../models/Student');
const { ApiError } = require('../middleware/errorHandler');
const { emitToUser } = require('../config/socket');

const createInteraction = async (coordinatorId, data) => {
  const student = await Student.findById(data.studentId);
  if (!student) throw ApiError.notFound('Student not found');

  // Assign coordinator to student if unassigned
  if (!student.coordinatorId) {
    student.coordinatorId = coordinatorId;
    await student.save();
  }

  const interaction = new Interaction({
    studentId: data.studentId,
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
      studentId: data.studentId,
      coordinatorId,
      interactionId: interaction._id,
      title: data.followUpTitle || `Follow-up with student regarding interaction on ${new Date().toLocaleDateString()}`,
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

  // Emit event to student
  emitToUser(student.userId.toString(), 'interaction.created', {
    message: `New interaction recorded by your coordinator`,
    interaction: populated
  });

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
  if (user.role === 'student') {
    const student = await Student.findOne({ userId: user._id });
    if (!student || student._id.toString() !== studentId.toString()) {
      throw ApiError.forbidden('Access denied');
    }
  }

  return Interaction.find({ studentId })
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
  updateInteraction,
  deleteInteraction
};
