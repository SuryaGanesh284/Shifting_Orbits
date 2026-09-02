const studentService = require('../services/student.service');
const { asyncHandler } = require('../middleware/errorHandler');

// Profile & Summary
const getProfile = asyncHandler(async (req, res) => {
  const profile = await studentService.getStudentProfile(req.user._id);
  res.status(200).json({ success: true, data: profile });
});

const updateProfile = asyncHandler(async (req, res) => {
  const updated = await studentService.updateStudentProfile(req.user._id, req.body);
  res.status(200).json({ success: true, message: 'Profile updated successfully', data: updated });
});

const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await studentService.getStudentDashboard(req.user._id);
  res.status(200).json({ success: true, data: dashboard });
});

const getJourney = asyncHandler(async (req, res) => {
  const journey = await studentService.getStudentJourney(req.user._id);
  res.status(200).json({ success: true, data: journey });
});

const getProgress = asyncHandler(async (req, res) => {
  const progress = await studentService.getStudentProgress(req.user._id);
  res.status(200).json({ success: true, data: progress });
});

// Academic Records
const getAcademicRecords = asyncHandler(async (req, res) => {
  const records = await studentService.getAcademicRecords(req.user._id);
  res.status(200).json({ success: true, count: records.length, data: records });
});

const addAcademicRecord = asyncHandler(async (req, res) => {
  const record = await studentService.addAcademicRecord(req.user._id, req.body);
  res.status(201).json({ success: true, message: 'Academic record added', data: record });
});

// Skills
const getSkills = asyncHandler(async (req, res) => {
  const skills = await studentService.getSkills(req.user._id);
  res.status(200).json({ success: true, count: skills.length, data: skills });
});

const addSkill = asyncHandler(async (req, res) => {
  const skill = await studentService.addSkill(req.user._id, req.body);
  res.status(201).json({ success: true, message: 'Skill added successfully', data: skill });
});

const updateSkill = asyncHandler(async (req, res) => {
  const skill = await studentService.updateSkill(req.user._id, req.params.skillId, req.body);
  res.status(200).json({ success: true, message: 'Skill updated successfully', data: skill });
});

const deleteSkill = asyncHandler(async (req, res) => {
  const result = await studentService.deleteSkill(req.user._id, req.params.skillId);
  res.status(200).json({ success: true, message: result.message });
});

// Goals
const getGoals = asyncHandler(async (req, res) => {
  const goals = await studentService.getGoals(req.user._id);
  res.status(200).json({ success: true, count: goals.length, data: goals });
});

const createGoal = asyncHandler(async (req, res) => {
  const goal = await studentService.createGoal(req.user._id, req.body);
  res.status(201).json({ success: true, message: 'Goal created successfully', data: goal });
});

const updateGoal = asyncHandler(async (req, res) => {
  const goal = await studentService.updateGoal(req.user._id, req.params.goalId, req.body);
  res.status(200).json({ success: true, message: 'Goal updated successfully', data: goal });
});

const deleteGoal = asyncHandler(async (req, res) => {
  const result = await studentService.deleteGoal(req.user._id, req.params.goalId);
  res.status(200).json({ success: true, message: result.message });
});

// Career
const getCareerProfile = asyncHandler(async (req, res) => {
  const career = await studentService.getCareerProfile(req.user._id);
  res.status(200).json({ success: true, data: career });
});

const updateCareerProfile = asyncHandler(async (req, res) => {
  const career = await studentService.updateCareerProfile(req.user._id, req.body);
  res.status(200).json({ success: true, message: 'Career profile updated', data: career });
});

const getCareerReadiness = asyncHandler(async (req, res) => {
  const readiness = await studentService.getCareerReadiness(req.user._id);
  res.status(200).json({ success: true, data: readiness });
});

module.exports = {
  getProfile,
  updateProfile,
  getDashboard,
  getJourney,
  getProgress,
  getAcademicRecords,
  addAcademicRecord,
  getSkills,
  addSkill,
  updateSkill,
  deleteSkill,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getCareerProfile,
  updateCareerProfile,
  getCareerReadiness
};
