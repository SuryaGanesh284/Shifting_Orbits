const AcademicRecord = require('../models/AcademicRecord');
const User = require('../models/User');
const Goal = require('../models/Goal');
const Skill = require('../models/Skill');
const FollowUp = require('../models/FollowUp');
const SupportRequest = require('../models/SupportRequest');
const Student = require('../models/Student');
const { calculateSupportPriority } = require('../utils/scoring');

const evaluateStudentSupportPriority = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student) return null;

  const [user, academicRecords, goals, skills, followUps, supportRequests] = await Promise.all([
    User.findById(student.userId),
    AcademicRecord.find({ studentId }).sort({ assessmentDate: -1 }),
    Goal.find({ studentId }),
    Skill.find({ studentId }),
    FollowUp.find({ studentId }),
    SupportRequest.find({ studentId })
  ]);

  const evaluation = calculateSupportPriority({
    academicRecords,
    user,
    goals,
    skills,
    followUps,
    supportRequests,
    student
  });

  return {
    studentId,
    studentName: user?.name || 'Student',
    program: student.program,
    stage: student.stage,
    centerId: student.centerId,
    ...evaluation
  };
};

module.exports = { evaluateStudentSupportPriority };
