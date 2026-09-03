const Student = require('../models/Student');
const AcademicRecord = require('../models/AcademicRecord');
const Skill = require('../models/Skill');
const Goal = require('../models/Goal');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');

const getOrCreateStudent = async (userId) => {
  let student = await Student.findOne({ userId }).populate('userId', 'name email phone centerId role');
  if (!student) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    student = new Student({
      userId,
      centerId: user.centerId || 'SOF-BLR-01',
      program: 'Sethu',
      stage: 'Grade 11'
    });
    student.calculateProfileCompletion();
    await student.save();
    student = await Student.findById(student._id).populate('userId', 'name email phone centerId role');
  }
  return student;
};

const getStudentProfile = async (userId) => {
  const student = await getOrCreateStudent(userId);
  return student;
};

const updateStudentProfile = async (userId, data) => {
  const student = await getOrCreateStudent(userId);

  if (data.program) student.program = data.program;
  if (data.stage) student.stage = data.stage;
  if (data.centerId) student.centerId = data.centerId;
  if (data.education) {
    student.education = { ...student.education.toObject(), ...data.education };
  }
  if (data.interests) student.interests = data.interests;
  if (data.aspirations) {
    student.aspirations = { ...student.aspirations.toObject(), ...data.aspirations };
  }
  if (data.contact) {
    student.contact = { ...student.contact.toObject(), ...data.contact };
  }

  student.calculateProfileCompletion();
  await student.save();

  return student;
};

const getStudentDashboard = async (userId) => {
  const student = await getOrCreateStudent(userId);
  const studentId = student._id;

  const [academicRecords, skills, goals] = await Promise.all([
    AcademicRecord.find({ studentId }).sort({ assessmentDate: -1 }).limit(10),
    Skill.find({ studentId }).sort({ level: -1 }),
    Goal.find({ studentId }).sort({ targetDate: 1 })
  ]);

  // Compute academic average and attendance
  let avgScore = 0;
  let avgAttendance = 0;
  if (academicRecords.length > 0) {
    const totalScore = academicRecords.reduce((sum, r) => sum + r.score, 0);
    const totalAtt = academicRecords.reduce((sum, r) => sum + (r.attendance || 0), 0);
    avgScore = Math.round(totalScore / academicRecords.length);
    avgAttendance = Math.round(totalAtt / academicRecords.length);
  }

  const activeGoals = goals.filter((g) => g.status === 'in_progress' || g.status === 'pending');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  // Overall journey progress (0 - 100%)
  const stageWeights = {
    'Grade 11': 20,
    'Grade 12': 40,
    'Higher Education': 60,
    'Skill Development': 75,
    'Internship': 90,
    'Employment': 100
  };
  const journeyProgress = stageWeights[student.stage] || 20;

  return {
    student,
    summary: {
      profileCompletion: student.profileCompletion,
      journeyProgress,
      currentStage: student.stage,
      program: student.program,
      academicAverage: avgScore,
      attendanceAverage: avgAttendance,
      totalSkills: skills.length,
      activeGoalsCount: activeGoals.length,
      completedGoalsCount: completedGoals.length
    },
    recentAcademicRecords: academicRecords.slice(0, 5),
    topSkills: skills.slice(0, 5),
    upcomingGoals: activeGoals.slice(0, 3)
  };
};

const getStudentJourney = async (userId) => {
  const student = await getOrCreateStudent(userId);

  const stages = [
    {
      id: 'grade_11',
      title: 'Grade 11 (Higher Secondary - Sethu)',
      description: 'Foundational secondary curriculum, core science/commerce/arts stream selection.',
      isCompleted: ['Grade 12', 'Higher Education', 'Skill Development', 'Internship', 'Employment'].includes(student.stage),
      isCurrent: student.stage === 'Grade 11'
    },
    {
      id: 'grade_12',
      title: 'Grade 12 (Board & Entrance Prep - Sethu)',
      description: 'Senior secondary examinations, entrance exams, college applications and mentorship.',
      isCompleted: ['Higher Education', 'Skill Development', 'Internship', 'Employment'].includes(student.stage),
      isCurrent: student.stage === 'Grade 12'
    },
    {
      id: 'higher_education',
      title: 'Higher Education (Stambha Program)',
      description: 'Degree / Diploma pursuit, college academic tracking, financial scholarship support.',
      isCompleted: ['Skill Development', 'Internship', 'Employment'].includes(student.stage),
      isCurrent: student.stage === 'Higher Education'
    },
    {
      id: 'skill_development',
      title: 'Skill Development & Certifications',
      description: 'Technical proficiencies, soft skills, resume building, and industry readiness.',
      isCompleted: ['Internship', 'Employment'].includes(student.stage),
      isCurrent: student.stage === 'Skill Development'
    },
    {
      id: 'internship',
      title: 'Internship & Real-World Projects',
      description: 'Practical industry exposure, mentorship feedback, and professional networking.',
      isCompleted: ['Employment'].includes(student.stage),
      isCurrent: student.stage === 'Internship'
    },
    {
      id: 'employment',
      title: 'Employment & Career Launch',
      description: 'Full-time placement, sustainable career trajectory, breaking the cycle of poverty.',
      isCompleted: false,
      isCurrent: student.stage === 'Employment'
    }
  ];

  return {
    currentStage: student.stage,
    program: student.program,
    stages
  };
};

const getStudentProgress = async (userId) => {
  const student = await getOrCreateStudent(userId);
  const records = await AcademicRecord.find({ studentId: student._id }).sort({ assessmentDate: 1 });

  // Group by subject
  const subjectMap = {};
  const strengthsSet = new Set();
  const improvementsSet = new Set();

  records.forEach((r) => {
    if (!subjectMap[r.subject]) {
      subjectMap[r.subject] = {
        subject: r.subject,
        records: [],
        averageScore: 0,
        averageAttendance: 0
      };
    }
    subjectMap[r.subject].records.push({
      term: r.term,
      score: r.score,
      attendance: r.attendance,
      assessmentDate: r.assessmentDate
    });

    if (r.strengths) r.strengths.forEach((s) => strengthsSet.add(s));
    if (r.areasForImprovement) r.areasForImprovement.forEach((a) => improvementsSet.add(a));
  });

  const subjectBreakdown = Object.values(subjectMap).map((item) => {
    const totalScore = item.records.reduce((sum, rec) => sum + rec.score, 0);
    const totalAtt = item.records.reduce((sum, rec) => sum + (rec.attendance || 0), 0);
    item.averageScore = Math.round(totalScore / item.records.length);
    item.averageAttendance = Math.round(totalAtt / item.records.length);
    return item;
  });

  return {
    totalAssessments: records.length,
    subjectBreakdown,
    identifiedStrengths: Array.from(strengthsSet),
    areasRequiringImprovement: Array.from(improvementsSet),
    trend: records.map((r) => ({
      date: r.assessmentDate,
      subject: r.subject,
      term: r.term,
      score: r.score,
      attendance: r.attendance
    }))
  };
};

// Academic Records
const getAcademicRecords = async (userId) => {
  const student = await getOrCreateStudent(userId);
  return AcademicRecord.find({ studentId: student._id }).sort({ assessmentDate: -1 });
};

const addAcademicRecord = async (userId, data) => {
  const student = await getOrCreateStudent(userId);
  const record = new AcademicRecord({
    studentId: student._id,
    ...data
  });
  await record.save();
  return record;
};

// Skills
const getSkills = async (userId) => {
  const student = await getOrCreateStudent(userId);
  return Skill.find({ studentId: student._id }).sort({ level: -1 });
};

const addSkill = async (userId, data) => {
  const student = await getOrCreateStudent(userId);
  const existing = await Skill.findOne({ studentId: student._id, name: data.name });
  if (existing) {
    throw ApiError.conflict(`Skill '${data.name}' is already added. Use update to edit.`);
  }

  const skill = new Skill({
    studentId: student._id,
    ...data
  });
  await skill.save();
  return skill;
};

const updateSkill = async (userId, skillId, data) => {
  const student = await getOrCreateStudent(userId);
  const skill = await Skill.findOne({ _id: skillId, studentId: student._id });
  if (!skill) throw ApiError.notFound('Skill not found');

  if (data.name) skill.name = data.name;
  if (data.category) skill.category = data.category;
  if (data.level) skill.level = data.level;
  if (data.evidence) skill.evidence = data.evidence;
  skill.lastUpdated = new Date();

  await skill.save();
  return skill;
};

const deleteSkill = async (userId, skillId) => {
  const student = await getOrCreateStudent(userId);
  const skill = await Skill.findOneAndDelete({ _id: skillId, studentId: student._id });
  if (!skill) throw ApiError.notFound('Skill not found');
  return { message: 'Skill removed successfully' };
};

// Goals
const getGoals = async (userId) => {
  const student = await getOrCreateStudent(userId);
  return Goal.find({ studentId: student._id }).sort({ targetDate: 1 });
};

const createGoal = async (userId, data) => {
  const student = await getOrCreateStudent(userId);
  const goal = new Goal({
    studentId: student._id,
    ...data
  });
  goal.recalculateProgress();
  await goal.save();
  return goal;
};

const updateGoal = async (userId, goalId, data) => {
  const student = await getOrCreateStudent(userId);
  const goal = await Goal.findOne({ _id: goalId, studentId: student._id });
  if (!goal) throw ApiError.notFound('Goal not found');

  if (data.title) goal.title = data.title;
  if (data.description !== undefined) goal.description = data.description;
  if (data.category) goal.category = data.category;
  if (data.targetDate) goal.targetDate = data.targetDate;
  if (data.progress !== undefined) goal.progress = data.progress;
  if (data.status) goal.status = data.status;
  if (data.milestones) {
    goal.milestones = data.milestones;
    goal.recalculateProgress();
  }

  await goal.save();
  return goal;
};

const deleteGoal = async (userId, goalId) => {
  const student = await getOrCreateStudent(userId);
  const goal = await Goal.findOneAndDelete({ _id: goalId, studentId: student._id });
  if (!goal) throw ApiError.notFound('Goal not found');
  return { message: 'Goal removed successfully' };
};

// Career Profile & Gap Analysis
const getCareerProfile = async (userId) => {
  const student = await getOrCreateStudent(userId);
  const skills = await Skill.find({ studentId: student._id });

  const aspirations = {
    targetCareer: student.aspirations?.targetCareer || 'Not specified',
    higherEducationGoal: student.aspirations?.higherEducationGoal || '',
    dreamCompanies: student.aspirations?.dreamCompanies || [],
    notes: student.aspirations?.notes || ''
  };

  return {
    ...aspirations,
    aspirations,
    interests: student.interests || [],
    currentSkills: skills
  };
};

const updateCareerProfile = async (userId, data) => {
  const student = await getOrCreateStudent(userId);
  if (!student.aspirations) student.aspirations = {};

  const source = data.aspirations || data;

  if (source.targetCareer !== undefined) student.aspirations.targetCareer = source.targetCareer;
  if (source.higherEducationGoal !== undefined) student.aspirations.higherEducationGoal = source.higherEducationGoal;
  if (source.dreamCompanies !== undefined) {
    if (typeof source.dreamCompanies === 'string') {
      student.aspirations.dreamCompanies = source.dreamCompanies.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (Array.isArray(source.dreamCompanies)) {
      student.aspirations.dreamCompanies = source.dreamCompanies;
    }
  }
  if (source.notes !== undefined) student.aspirations.notes = source.notes;
  if (source.interests !== undefined) {
    if (typeof source.interests === 'string') {
      student.interests = source.interests.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (Array.isArray(source.interests)) {
      student.interests = source.interests;
    }
  }

  student.calculateProfileCompletion();
  await student.save();

  return getCareerProfile(userId);
};

const getCareerReadiness = async (userId) => {
  const student = await getOrCreateStudent(userId);
  const skills = await Skill.find({ studentId: student._id });
  const goals = await Goal.find({ studentId: student._id });

  const targetCareer = student.aspirations?.targetCareer || 'General Professional';

  // Standard career benchmark skills taxonomy
  const careerBenchmarks = {
    'Software Engineer': ['JavaScript', 'Data Structures', 'Git', 'Problem Solving', 'Communication'],
    'Data Analyst': ['SQL', 'Python', 'Excel', 'Statistics', 'Critical Thinking'],
    'Web Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Git'],
    'Accountant / Finance': ['Accounting Principles', 'Excel', 'Tally', 'Mathematics', 'Attention to Detail'],
    'General Professional': ['Communication', 'Computer Basics', 'Problem Solving', 'Time Management', 'English']
  };

  const requiredSkills = careerBenchmarks[targetCareer] || careerBenchmarks['General Professional'];
  const acquiredSkillNames = skills.map((s) => s.name.toLowerCase());

  const matchedSkills = requiredSkills.filter((s) => acquiredSkillNames.includes(s.toLowerCase()));
  const missingSkills = requiredSkills.filter((s) => !acquiredSkillNames.includes(s.toLowerCase()));

  const skillMatchPercentage = Math.round((matchedSkills.length / requiredSkills.length) * 100);
  const careerGoals = goals.filter((g) => g.category === 'career');
  const careerGoalCompletion = careerGoals.length > 0
    ? Math.round(careerGoals.reduce((sum, g) => sum + g.progress, 0) / careerGoals.length)
    : 0;

  const readinessScore = Math.round(skillMatchPercentage * 0.7 + careerGoalCompletion * 0.3);

  let readinessLevel = 'Emerging';
  if (readinessScore >= 75) readinessLevel = 'Ready';
  else if (readinessScore >= 50) readinessLevel = 'Developing';

  return {
    targetCareer,
    readinessScore,
    overallScore: readinessScore,
    score: readinessScore,
    readinessLevel,
    skillMatchPercentage,
    careerGoalCompletion,
    breakdown: {
      'Skill Match': skillMatchPercentage,
      'Goal Completion': careerGoalCompletion,
      'Readiness Index': readinessScore
    },
    matchedSkills,
    missingSkills,
    recommendations: missingSkills.map((s) => `Enroll in or log practice projects for ${s}`)
  };
};

module.exports = {
  getOrCreateStudent,
  getStudentProfile,
  updateStudentProfile,
  getStudentDashboard,
  getStudentJourney,
  getStudentProgress,
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
