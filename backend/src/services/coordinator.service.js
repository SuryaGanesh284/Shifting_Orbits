const Student = require('../models/Student');
const User = require('../models/User');
const AcademicRecord = require('../models/AcademicRecord');
const Skill = require('../models/Skill');
const Goal = require('../models/Goal');
const Interaction = require('../models/Interaction');
const FollowUp = require('../models/FollowUp');
const SupportRequest = require('../models/SupportRequest');
const { evaluateStudentSupportPriority } = require('./risk.service');
const { getCareerReadiness } = require('./student.service');
const { resolveStudent } = require('./interaction.service');
const { ApiError } = require('../middleware/errorHandler');

const getCoordinatorDashboard = async (coordinatorId) => {
  // Query all students or students assigned to this coordinator
  const studentDocs = await Student.find({
    $or: [{ coordinatorId }, { coordinatorId: null }]
  }).populate('userId', 'name email phone status lastLoginAt');

  const studentIds = studentDocs.map((s) => s._id);

  // Compute Support Priority score for all students
  const priorityEvaluations = await Promise.all(
    studentDocs.map(async (st) => {
      const evaluation = await evaluateStudentSupportPriority(st._id);
      return {
        student: st,
        ...evaluation
      };
    })
  );

  const priorityCounts = {
    LOW: priorityEvaluations.filter((p) => p.level === 'LOW').length,
    MODERATE: priorityEvaluations.filter((p) => p.level === 'MODERATE').length,
    HIGH: priorityEvaluations.filter((p) => p.level === 'HIGH').length,
    URGENT: priorityEvaluations.filter((p) => p.level === 'URGENT').length
  };

  const studentsNeedingAttention = priorityEvaluations
    .filter((p) => p.level === 'HIGH' || p.level === 'URGENT')
    .sort((a, b) => b.score - a.score);

  // Overdue follow-ups
  const now = new Date();
  const overdueFollowUps = await FollowUp.find({
    coordinatorId,
    dueDate: { $lt: now },
    status: { $in: ['pending', 'in_progress', 'overdue'] }
  })
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .sort({ dueDate: 1 });

  // Pending support requests
  const pendingRequests = await SupportRequest.find({
    $or: [{ assignedCoordinator: coordinatorId }, { assignedCoordinator: null }],
    status: { $in: ['pending', 'in_progress'] }
  })
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email phone centerId' }
    })
    .sort({ createdAt: -1 });

  return {
    metrics: {
      totalStudents: studentDocs.length,
      activeStudents: studentDocs.filter((s) => s.userId?.status === 'active').length,
      priorityCounts,
      attentionRequiredCount: studentsNeedingAttention.length,
      overdueFollowUpsCount: overdueFollowUps.length,
      pendingSupportRequestsCount: pendingRequests.length
    },
    studentsNeedingAttention: studentsNeedingAttention.slice(0, 5),
    overdueFollowUps: overdueFollowUps.slice(0, 5),
    pendingSupportRequests: pendingRequests.slice(0, 5)
  };
};

const getCoordinatorStudents = async (coordinatorId, filters = {}) => {
  const query = {};

  if (filters.program) query.program = filters.program;
  if (filters.centerId) query.centerId = filters.centerId;
  if (filters.stage) query.stage = filters.stage;

  let students = await Student.find(query)
    .populate('userId', 'name email phone status lastLoginAt')
    .sort({ createdAt: -1 });

  // Search filter by name or email
  if (filters.search) {
    const s = filters.search.toLowerCase();
    students = students.filter(
      (st) =>
        st.userId?.name?.toLowerCase().includes(s) ||
        st.userId?.email?.toLowerCase().includes(s) ||
        st.education?.institution?.toLowerCase().includes(s)
    );
  }

  // Attach real-time Support Priority score to every student
  const studentListWithPriority = await Promise.all(
    students.map(async (st) => {
      const priority = await evaluateStudentSupportPriority(st._id);
      return {
        _id: st._id,
        userId: st.userId,
        centerId: st.centerId,
        program: st.program,
        stage: st.stage,
        education: st.education,
        aspirations: st.aspirations,
        profileCompletion: st.profileCompletion,
        coordinatorId: st.coordinatorId,
        supportPriority: {
          score: priority.score,
          level: priority.level,
          levelLabel: priority.levelLabel,
          reasons: priority.reasons
        }
      };
    })
  );

  // Filter by priority level if requested
  let filtered = studentListWithPriority;
  if (filters.priorityLevel) {
    filtered = filtered.filter((s) => s.supportPriority.level === filters.priorityLevel.toUpperCase());
  }

  // Sort by priority score descending by default
  filtered.sort((a, b) => b.supportPriority.score - a.supportPriority.score);

  // Pagination
  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return {
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
    data: paginated
  };
};

const getStudent360 = async (studentIdentifier, coordinatorId) => {
  const student = await resolveStudent(studentIdentifier);
  if (!student) throw ApiError.notFound('Student profile not found');

  const studentId = student._id;

  const [
    user,
    academicRecords,
    skills,
    goals,
    interactions,
    followUps,
    supportRequests,
    supportPriority,
    careerReadiness
  ] = await Promise.all([
    User.findById(student.userId),
    AcademicRecord.find({ studentId }).sort({ assessmentDate: -1 }),
    Skill.find({ studentId }).sort({ level: -1 }),
    Goal.find({ studentId }).sort({ targetDate: 1 }),
    Interaction.find({ studentId }).populate('coordinatorId', 'name email').sort({ interactionDate: -1 }),
    FollowUp.find({ studentId }).populate('coordinatorId', 'name email').sort({ dueDate: 1 }),
    SupportRequest.find({ studentId }).populate('assignedCoordinator', 'name email').sort({ createdAt: -1 }),
    evaluateStudentSupportPriority(studentId),
    getCareerReadiness(student.userId)
  ]);

  // Academic summary calculations
  let avgScore = 0;
  let avgAttendance = 0;
  if (academicRecords.length > 0) {
    avgScore = Math.round(academicRecords.reduce((sum, r) => sum + r.score, 0) / academicRecords.length);
    avgAttendance = Math.round(
      academicRecords.reduce((sum, r) => sum + (r.attendance || 0), 0) / academicRecords.length
    );
  }

  return {
    student: {
      _id: student._id,
      user: {
        _id: user?._id,
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        status: user?.status,
        lastLoginAt: user?.lastLoginAt
      },
      centerId: student.centerId,
      coordinatorId: student.coordinatorId,
      program: student.program,
      stage: student.stage,
      education: student.education,
      interests: student.interests,
      aspirations: student.aspirations,
      contact: student.contact,
      profileCompletion: student.profileCompletion,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt
    },
    supportPriority,
    academicOverview: {
      averageScore: avgScore,
      averageAttendance: avgAttendance,
      totalAssessments: academicRecords.length,
      records: academicRecords
    },
    skillsOverview: {
      totalSkills: skills.length,
      skills
    },
    careerReadiness,
    goalsOverview: {
      totalGoals: goals.length,
      activeGoalsCount: goals.filter((g) => g.status === 'in_progress' || g.status === 'pending').length,
      completedGoalsCount: goals.filter((g) => g.status === 'completed').length,
      goals
    },
    interactions,
    followUps,
    supportRequests
  };
};

const getAttentionList = async (coordinatorId) => {
  const result = await getCoordinatorStudents(coordinatorId, { limit: 100 });
  const attentionRequired = result.data.filter(
    (s) => s.supportPriority.level === 'HIGH' || s.supportPriority.level === 'URGENT'
  );
  return attentionRequired;
};

const getStudentAttentionDetails = async (studentId) => {
  const priority = await evaluateStudentSupportPriority(studentId);
  return priority;
};

module.exports = {
  getCoordinatorDashboard,
  getCoordinatorStudents,
  getStudent360,
  getAttentionList,
  getStudentAttentionDetails
};
