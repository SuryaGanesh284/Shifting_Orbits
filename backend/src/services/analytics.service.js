const Student = require('../models/Student');
const User = require('../models/User');
const AcademicRecord = require('../models/AcademicRecord');
const SupportRequest = require('../models/SupportRequest');
const Interaction = require('../models/Interaction');
const FollowUp = require('../models/FollowUp');
const { evaluateStudentSupportPriority } = require('./risk.service');
const { ApiError } = require('../middleware/errorHandler');

const getInstitutionalOverview = async () => {
  const [
    students,
    coordinators,
    academicRecords,
    supportRequests,
    interactions,
    followUps
  ] = await Promise.all([
    Student.find().populate('userId', 'status lastLoginAt'),
    User.find({ role: 'coordinator', status: 'active' }),
    AcademicRecord.find(),
    SupportRequest.find(),
    Interaction.find(),
    FollowUp.find()
  ]);

  // Program & Stage distributions
  const programDistribution = { Sethu: 0, Stambha: 0 };
  const stageDistribution = {};
  const centerDistribution = {};

  students.forEach((s) => {
    if (s.program) programDistribution[s.program] = (programDistribution[s.program] || 0) + 1;
    if (s.stage) stageDistribution[s.stage] = (stageDistribution[s.stage] || 0) + 1;
    const cId = s.centerId || 'Unassigned';
    centerDistribution[cId] = (centerDistribution[cId] || 0) + 1;
  });

  // Academic metrics
  let foundationAvgScore = 0;
  let foundationAvgAttendance = 0;
  if (academicRecords.length > 0) {
    foundationAvgScore = Math.round(
      academicRecords.reduce((sum, r) => sum + r.score, 0) / academicRecords.length
    );
    foundationAvgAttendance = Math.round(
      academicRecords.reduce((sum, r) => sum + (r.attendance || 0), 0) / academicRecords.length
    );
  }

  // Support Requests resolution rate
  const totalRequests = supportRequests.length;
  const resolvedRequests = supportRequests.filter((r) => r.status === 'resolved').length;
  const resolutionRate = totalRequests > 0 ? Math.round((resolvedRequests / totalRequests) * 100) : 100;

  // Follow-up completion rate
  const totalFollowUps = followUps.length;
  const completedFollowUps = followUps.filter((f) => f.status === 'completed').length;
  const followUpCompletionRate = totalFollowUps > 0 ? Math.round((completedFollowUps / totalFollowUps) * 100) : 100;

  // Compute Priority Risk Distribution (across all students)
  const priorityBreakdown = { LOW: 0, MODERATE: 0, HIGH: 0, URGENT: 0 };
  const priorityEvaluations = await Promise.all(
    students.map(async (s) => {
      const evalData = await evaluateStudentSupportPriority(s._id);
      return evalData?.level || 'LOW';
    })
  );

  priorityEvaluations.forEach((lvl) => {
    if (priorityBreakdown[lvl] !== undefined) {
      priorityBreakdown[lvl]++;
    }
  });

  return {
    summary: {
      totalStudents: students.length,
      activeStudents: students.filter((s) => s.userId?.status === 'active').length,
      totalCoordinators: coordinators.length,
      foundationAvgScore,
      foundationAvgAttendance,
      totalInteractionsLogged: interactions.length,
      supportRequestResolutionRate: `${resolutionRate}%`,
      followUpCompletionRate: `${followUpCompletionRate}%`
    },
    supportPriorityDistribution: priorityBreakdown,
    programDistribution,
    stageDistribution,
    centerDistribution
  };
};

const getCenterComparison = async () => {
  const [students, coordinators, records, requests, followUps] = await Promise.all([
    Student.find(),
    User.find({ role: 'coordinator' }),
    AcademicRecord.find(),
    SupportRequest.find(),
    FollowUp.find()
  ]);

  // Group unique centers
  const centers = [...new Set(students.map((s) => s.centerId || 'SOF-BLR-01'))];

  const comparison = await Promise.all(
    centers.map(async (centerId) => {
      const centerStudents = students.filter((s) => (s.centerId || 'SOF-BLR-01') === centerId);
      const centerStudentIds = centerStudents.map((s) => s._id.toString());
      const centerCoordinators = coordinators.filter((c) => (c.centerId || 'SOF-BLR-01') === centerId);

      const centerRecords = records.filter((r) => centerStudentIds.includes(r.studentId.toString()));
      const centerRequests = requests.filter((req) => centerStudentIds.includes(req.studentId.toString()));
      const centerFollowUps = followUps.filter((f) => centerStudentIds.includes(f.studentId.toString()));

      let avgScore = 0;
      let avgAttendance = 0;
      if (centerRecords.length > 0) {
        avgScore = Math.round(centerRecords.reduce((sum, r) => sum + r.score, 0) / centerRecords.length);
        avgAttendance = Math.round(centerRecords.reduce((sum, r) => sum + (r.attendance || 0), 0) / centerRecords.length);
      }

      // High risk students count
      let highRiskCount = 0;
      for (const st of centerStudents) {
        const priority = await evaluateStudentSupportPriority(st._id);
        if (priority?.level === 'HIGH' || priority?.level === 'URGENT') {
          highRiskCount++;
        }
      }

      return {
        centerId,
        studentCount: centerStudents.length,
        coordinatorCount: centerCoordinators.length,
        averageScore: avgScore,
        averageAttendance: avgAttendance,
        highRiskCount,
        totalRequests: centerRequests.length,
        pendingRequests: centerRequests.filter((r) => r.status === 'pending').length,
        totalFollowUps: centerFollowUps.length,
        overdueFollowUps: centerFollowUps.filter((f) => f.status === 'overdue' || (f.status === 'pending' && new Date() > f.dueDate)).length
      };
    })
  );

  return comparison;
};

const getCenterDetails = async (centerId) => {
  const comparison = await getCenterComparison();
  const centerData = comparison.find((c) => c.centerId === centerId);
  if (!centerData) throw ApiError.notFound(`Center '${centerId}' not found`);

  const students = await Student.find({ centerId })
    .populate('userId', 'name email phone status')
    .sort({ createdAt: -1 });

  return {
    ...centerData,
    students
  };
};

const exportReport = async (reportType, format = 'json') => {
  let data = [];

  if (reportType === 'center_summary') {
    data = await getCenterComparison();
  } else if (reportType === 'at_risk_students') {
    const students = await Student.find().populate('userId', 'name email phone centerId');
    for (const st of students) {
      const priority = await evaluateStudentSupportPriority(st._id);
      if (priority?.level === 'HIGH' || priority?.level === 'URGENT') {
        data.push({
          studentName: st.userId?.name || 'N/A',
          email: st.userId?.email || 'N/A',
          centerId: st.centerId || 'SOF-BLR-01',
          program: st.program,
          stage: st.stage,
          targetCareer: st.aspirations?.targetCareer || 'N/A',
          priorityLevel: priority.level,
          priorityScore: priority.score,
          primaryReasons: priority.reasons?.join('; ') || ''
        });
      }
    }
  } else if (reportType === 'support_requests') {
    const requests = await SupportRequest.find()
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .populate('assignedCoordinator', 'name email');

    data = requests.map((r) => ({
      requestId: r._id.toString(),
      studentName: r.studentId?.userId?.name || 'N/A',
      category: r.category,
      title: r.title,
      priority: r.priority,
      status: r.status,
      assignedTo: r.assignedCoordinator?.name || 'Unassigned',
      createdAt: r.createdAt.toISOString()
    }));
  } else {
    // Default: student roster
    const students = await Student.find().populate('userId', 'name email centerId');
    data = students.map((s) => ({
      studentId: s._id.toString(),
      name: s.userId?.name || 'N/A',
      email: s.userId?.email || 'N/A',
      centerId: s.centerId || 'SOF-BLR-01',
      program: s.program,
      stage: s.stage,
      targetCareer: s.aspirations?.targetCareer || 'N/A',
      profileCompletion: `${s.profileCompletion}%`
    }));
  }

  if (format.toLowerCase() === 'csv') {
    if (data.length === 0) return 'No records found';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header] === undefined || row[header] === null ? '' : String(row[header]);
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  }

  return data;
};

module.exports = {
  getInstitutionalOverview,
  getCenterComparison,
  getCenterDetails,
  exportReport
};
