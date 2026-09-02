/**
 * Support Priority Scoring Algorithm
 * Transparent, rule-based 5-factor evaluation:
 * - Academic Trend (25% weight)
 * - Engagement Index (25% weight)
 * - Attendance Index (20% weight)
 * - Pending Follow-ups / Requests (15% weight)
 * - Career Activity (15% weight)
 */

const calculateSupportPriority = ({
  academicRecords = [],
  user = null,
  goals = [],
  skills = [],
  followUps = [],
  supportRequests = [],
  student = null
}) => {
  const reasons = [];
  const signals = {
    academicTrend: 0,
    engagement: 0,
    attendance: 0,
    pendingFollowUps: 0,
    careerActivity: 0
  };

  // 1. Academic Trend (Max 25 points)
  if (academicRecords && academicRecords.length > 0) {
    const scores = academicRecords.map((r) => r.score);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    if (avgScore < 50) {
      signals.academicTrend += 20;
      reasons.push(`Low academic average (${Math.round(avgScore)}%)`);
    } else if (avgScore < 70) {
      signals.academicTrend += 12;
      reasons.push(`Moderate academic average (${Math.round(avgScore)}%)`);
    } else if (avgScore < 85) {
      signals.academicTrend += 5;
    }

    // Trajectory decline check (compare latest assessment to previous avg)
    if (academicRecords.length >= 2) {
      const latestScore = academicRecords[0].score;
      const prevScores = academicRecords.slice(1).map((r) => r.score);
      const prevAvg = prevScores.reduce((sum, s) => sum + s, 0) / prevScores.length;

      if (latestScore < prevAvg - 10) {
        signals.academicTrend += 5;
        reasons.push(`Recent score decline in latest assessment (${latestScore}% vs prev ${Math.round(prevAvg)}%)`);
      }
    }
  } else {
    signals.academicTrend += 8;
    reasons.push('No academic assessment records logged yet');
  }
  signals.academicTrend = Math.min(25, signals.academicTrend);

  // 2. Engagement Index (Max 25 points)
  let daysSinceLogin = 0;
  if (user && user.lastLoginAt) {
    const diffTime = Math.abs(new Date() - new Date(user.lastLoginAt));
    daysSinceLogin = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } else {
    daysSinceLogin = 30; // Unrecorded login
  }

  if (daysSinceLogin > 21) {
    signals.engagement += 15;
    reasons.push(`Inactive on platform for ${daysSinceLogin} days`);
  } else if (daysSinceLogin > 14) {
    signals.engagement += 10;
    reasons.push(`No platform activity in over 2 weeks (${daysSinceLogin} days)`);
  } else if (daysSinceLogin > 7) {
    signals.engagement += 5;
  }

  // Active Goals check
  const activeGoals = goals.filter((g) => g.status === 'in_progress' || g.status === 'pending');
  if (goals.length === 0) {
    signals.engagement += 10;
    reasons.push('No active goals or action plans defined');
  } else if (activeGoals.length === 0) {
    signals.engagement += 5;
    reasons.push('All previous goals completed, no upcoming goals set');
  }
  signals.engagement = Math.min(25, signals.engagement);

  // 3. Attendance Index (Max 20 points)
  if (academicRecords && academicRecords.length > 0) {
    const attendances = academicRecords.map((r) => r.attendance || 90);
    const avgAttendance = attendances.reduce((sum, a) => sum + a, 0) / attendances.length;

    if (avgAttendance < 75) {
      signals.attendance += 20;
      reasons.push(`Attendance below target threshold (${Math.round(avgAttendance)}%)`);
    } else if (avgAttendance < 85) {
      signals.attendance += 10;
      reasons.push(`Moderate attendance (${Math.round(avgAttendance)}%)`);
    }
  } else {
    signals.attendance += 5;
  }
  signals.attendance = Math.min(20, signals.attendance);

  // 4. Pending Follow-Ups & Support Requests (Max 15 points)
  const overdueFollowUps = followUps.filter(
    (f) => f.status === 'overdue' || (f.status === 'pending' && new Date() > new Date(f.dueDate))
  );
  const urgentRequests = supportRequests.filter(
    (r) => (r.status === 'pending' || r.status === 'in_progress') && (r.priority === 'urgent' || r.priority === 'high')
  );

  if (overdueFollowUps.length > 0) {
    signals.pendingFollowUps += Math.min(10, overdueFollowUps.length * 5);
    reasons.push(`${overdueFollowUps.length} overdue coordinator follow-up task(s)`);
  }

  if (urgentRequests.length > 0) {
    signals.pendingFollowUps += 5;
    reasons.push(`${urgentRequests.length} high-priority support request(s) awaiting resolution`);
  }
  signals.pendingFollowUps = Math.min(15, signals.pendingFollowUps);

  // 5. Career Activity (Max 15 points)
  const hasTargetCareer = student?.aspirations?.targetCareer && student.aspirations.targetCareer.trim() !== '';
  if (!hasTargetCareer) {
    signals.careerActivity += 8;
    reasons.push('Target career path and higher education aspirations not yet defined');
  }

  if (!skills || skills.length === 0) {
    signals.careerActivity += 7;
    reasons.push('No technical or soft skills logged in skills inventory');
  } else if (skills.length <= 2) {
    signals.careerActivity += 3;
  }
  signals.careerActivity = Math.min(15, signals.careerActivity);

  // Total Score (0 - 100)
  const totalScore = Math.min(
    100,
    signals.academicTrend + signals.engagement + signals.attendance + signals.pendingFollowUps + signals.careerActivity
  );

  // Determine Level Category
  let level = 'LOW';
  let levelLabel = 'On Track (Low Support Need)';

  if (totalScore >= 81) {
    level = 'URGENT';
    levelLabel = 'Urgent Support Required';
  } else if (totalScore >= 61) {
    level = 'HIGH';
    levelLabel = 'High Support Priority';
  } else if (totalScore >= 31) {
    level = 'MODERATE';
    levelLabel = 'Moderate / Routine Check-In';
  }

  if (reasons.length === 0) {
    reasons.push('Student is progressing consistently across academics, skills, and engagement.');
  }

  return {
    score: totalScore,
    level,
    levelLabel,
    signals,
    reasons,
    calculatedAt: new Date()
  };
};

module.exports = { calculateSupportPriority };
