const coordinatorService = require('../services/coordinator.service');
const studentService = require('../services/student.service');
const interactionService = require('../services/interaction.service');
const { resolveStudent } = require('../services/interaction.service');
const { asyncHandler } = require('../middleware/errorHandler');

const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await coordinatorService.getCoordinatorDashboard(req.user._id);
  res.status(200).json({ success: true, data: dashboard });
});

const getStudents = asyncHandler(async (req, res) => {
  const result = await coordinatorService.getCoordinatorStudents(req.user._id, req.query);
  res.status(200).json({ success: true, ...result });
});

const getStudent360 = asyncHandler(async (req, res) => {
  const profile360 = await coordinatorService.getStudent360(req.params.studentId, req.user._id);
  res.status(200).json({ success: true, data: profile360 });
});

const getAttentionList = asyncHandler(async (req, res) => {
  const attentionList = await coordinatorService.getAttentionList(req.user._id);
  res.status(200).json({ success: true, count: attentionList.length, data: attentionList });
});

const getStudentAttention = asyncHandler(async (req, res) => {
  const student = await resolveStudent(req.params.studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  const attention = await coordinatorService.getStudentAttentionDetails(student._id);
  res.status(200).json({ success: true, data: attention });
});

const getStudentProgress = asyncHandler(async (req, res) => {
  const student = await resolveStudent(req.params.studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  const progress = await studentService.getStudentProgress(student.userId);
  res.status(200).json({ success: true, data: progress });
});

const getStudentAcademic = asyncHandler(async (req, res) => {
  const student = await resolveStudent(req.params.studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  const records = await studentService.getAcademicRecords(student.userId);
  res.status(200).json({ success: true, count: records.length, data: records });
});

const getStudentSkills = asyncHandler(async (req, res) => {
  const student = await resolveStudent(req.params.studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  const skills = await studentService.getSkills(student.userId);
  res.status(200).json({ success: true, count: skills.length, data: skills });
});

const getStudentCareer = asyncHandler(async (req, res) => {
  const student = await resolveStudent(req.params.studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  const career = await studentService.getCareerProfile(student.userId);
  res.status(200).json({ success: true, data: career });
});

const getStudentInteractions = asyncHandler(async (req, res) => {
  const student = await resolveStudent(req.params.studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  const interactions = await interactionService.getStudentInteractions(student._id, req.user);
  res.status(200).json({ success: true, count: interactions.length, data: interactions });
});

module.exports = {
  getDashboard,
  getStudents,
  getStudent360,
  getAttentionList,
  getStudentAttention,
  getStudentProgress,
  getStudentAcademic,
  getStudentSkills,
  getStudentCareer,
  getStudentInteractions
};
