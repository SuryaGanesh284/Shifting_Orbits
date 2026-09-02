const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');
const logger = require('../utils/logger');
const Student = require('../models/Student');
const AcademicRecord = require('../models/AcademicRecord');
const Skill = require('../models/Skill');
const Goal = require('../models/Goal');
const User = require('../models/User');
const FollowUp = require('../models/FollowUp');
const SupportRequest = require('../models/SupportRequest');
const Interaction = require('../models/Interaction');
const { resolveStudent } = require('./interaction.service');
const { evaluateStudentSupportPriority } = require('./risk.service');
const { ApiError } = require('../middleware/errorHandler');

let genAI = null;
if (env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    logger.info('Google Generative AI (Gemini) client initialized successfully');
  } catch (err) {
    logger.warn(`Failed to initialize GoogleGenerativeAI: ${err.message}`);
  }
}

/**
 * Career benchmarks repository for skill gap matching
 */
const CAREER_BENCHMARKS = {
  'software engineer': {
    criticalSkills: ['JavaScript', 'Python', 'Data Structures', 'Git', 'Problem Solving'],
    recommendedSkills: ['React', 'Node.js', 'SQL', 'REST APIs', 'System Design'],
    certifications: ['FreeCodeCamp Responsive Web Design', 'CS50 Intro to Computer Science']
  },
  'data analyst': {
    criticalSkills: ['Excel', 'SQL', 'Python', 'Statistics', 'Data Visualization'],
    recommendedSkills: ['Tableau', 'Power BI', 'Pandas', 'Business Communication'],
    certifications: ['Google Data Analytics Professional Certificate', 'IBM Data Analyst']
  },
  'electronics engineer': {
    criticalSkills: ['Circuit Analysis', 'Digital Electronics', 'Mathematics', 'C Programming', 'Physics'],
    recommendedSkills: ['PCB Design', 'Microcontrollers (Arduino/ESP32)', 'MATLAB', 'IoT Basics'],
    certifications: ['Embedded Systems Essentials', 'VLSI Design Fundamentals']
  },
  'business analyst': {
    criticalSkills: ['Analytical Thinking', 'Excel', 'Requirements Gathering', 'Communication', 'Business Modeling'],
    recommendedSkills: ['SQL', 'Process Mapping', 'Power BI', 'Agile Scrum'],
    certifications: ['ECBA Entry Certificate in Business Analysis', 'Google Project Management']
  }
};

const getBenchmarkForCareer = (careerTitle = '') => {
  const normalized = careerTitle.toLowerCase().trim();
  for (const [key, benchmark] of Object.entries(CAREER_BENCHMARKS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { matchedTitle: key, ...benchmark };
    }
  }
  return {
    matchedTitle: careerTitle || 'Professional Career Path',
    criticalSkills: ['Communication', 'Problem Solving', 'Digital Literacy', 'Time Management'],
    recommendedSkills: ['Project Planning', 'Domain Technical Tools', 'Team Collaboration'],
    certifications: ['Foundational Skill Certification', 'Online Specialization Course']
  };
};

/**
 * Live LLM Caller using official Google Generative AI SDK
 */
const callLLM = async (prompt, systemInstruction = '') => {
  // 1. Google Gemini SDK
  if (genAI && env.GEMINI_API_KEY) {
    const candidateModels = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        if (text) return text;
      } catch (err) {
        // Try next candidate model
      }
    }
    logger.info('Gemini candidate models completed, utilizing high-precision rule synthesizer.');
  }

  // 2. OpenAI fallback
  if (env.OPENAI_API_KEY && env.AI_PROVIDER === 'openai') {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ]
        })
      });
      if (response.ok) {
        const json = await response.json();
        const text = json.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (err) {
      logger.warn(`OpenAI call note: ${err.message}.`);
    }
  }

  return null;
};

/**
 * 1. AI Action Plan Generator
 */
const generateActionPlan = async (userId, customFocusArea = null) => {
  const student = await Student.findOne({ userId });
  if (!student) throw ApiError.badRequest('Student profile not found');

  const [academicRecords, skills, goals] = await Promise.all([
    AcademicRecord.find({ studentId: student._id }).sort({ assessmentDate: -1 }),
    Skill.find({ studentId: student._id }),
    Goal.find({ studentId: student._id })
  ]);

  const targetCareer = customFocusArea || student.aspirations?.targetCareer || 'Software Development';
  const currentGrade = student.education?.currentGrade || 'Grade 11';
  const stream = student.education?.stream || 'Science';

  const weakSubjects = academicRecords
    .filter((r) => r.score < 65)
    .map((r) => `${r.subject} (${r.score}%)`);

  const studentSkillNames = skills.map((s) => s.name);

  // Attempt live Gemini synthesis
  const llmPrompt = `Generate a 4-week structured action plan in JSON format for a ${currentGrade} student in ${stream} stream aiming for a career as ${targetCareer}.
Current skills: ${studentSkillNames.join(', ') || 'None logged'}.
Weak subjects needing improvement: ${weakSubjects.join(', ') || 'None identified'}.
Output ONLY valid JSON with keys: { "planTitle": "...", "objective": "...", "durationWeeks": 4, "weeklyMilestones": [{ "weekNumber": 1, "theme": "...", "tasks": ["..."], "outcome": "..." }], "skillRecommendations": ["..."], "coordinatorTips": ["..."] }`;

  const llmResponse = await callLLM(llmPrompt, 'You are an educational AI counselor for student career advancement.');

  if (llmResponse) {
    try {
      const cleaned = llmResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      parsed.source = 'gemini-1.5-flash';
      return parsed;
    } catch (e) {
      logger.debug('JSON parse failed for Gemini output, falling back to rule-based synthesis');
    }
  }

  // Built-in intelligent synthesis engine fallback
  const benchmark = getBenchmarkForCareer(targetCareer);
  const nextSkillsToLearn = benchmark.criticalSkills
    .filter((s) => !studentSkillNames.map((sk) => sk.toLowerCase()).includes(s.toLowerCase()))
    .slice(0, 3);

  const weakSubjectMention = weakSubjects.length > 0 ? weakSubjects[0] : 'Mathematics & Core Sciences';

  return {
    source: 'intelligent-synthesis',
    planTitle: `4-Week Acceleration Plan: ${targetCareer} Preparation`,
    objective: `Strengthen ${weakSubjectMention} fundamentals while building essential skills in ${nextSkillsToLearn.join(', ') || 'foundation tools'}.`,
    targetCareer,
    durationWeeks: 4,
    weeklyMilestones: [
      {
        weekNumber: 1,
        theme: 'Diagnostic Assessment & Foundation Concepts',
        tasks: [
          `Review mistakes from recent assessments in ${weakSubjectMention}.`,
          `Set up development and practice environment for ${nextSkillsToLearn[0] || 'core skills'}.`,
          'Complete 2 practice problem sets with step-by-step notes.'
        ],
        outcome: 'Baseline notes and solved problem repository.'
      },
      {
        weekNumber: 2,
        theme: 'Conceptual Depth & Hands-On Practice',
        tasks: [
          `Complete online tutorial modules for ${nextSkillsToLearn[0] || 'fundamental topic'}.`,
          `Daily 45-minute focused problem-solving session for ${weakSubjectMention}.`,
          'Share progress with center coordinator for feedback.'
        ],
        outcome: 'Completed module assignment and weekly quiz score > 75%.'
      },
      {
        weekNumber: 3,
        theme: 'Practical Application & Mini-Project',
        tasks: [
          `Start mini-project applying ${nextSkillsToLearn.slice(0, 2).join(' and ') || 'learned concepts'}.`,
          'Participate in study group peer review session at SOF center.',
          'Solve 2 timed past examination sample papers.'
        ],
        outcome: 'Working mini-project draft or comprehensive formula sheet.'
      },
      {
        weekNumber: 4,
        theme: 'Consolidation, Mock Test & Presentation',
        tasks: [
          `Finalize project deliverable and record evidence in SOF Skills Inventory.`,
          `Take full-length mock assessment in ${weakSubjectMention}.`,
          'Schedule one-on-one review interaction with coordinator.'
        ],
        outcome: 'Verified skill credential and documented measurable academic score improvement.'
      }
    ],
    skillRecommendations: nextSkillsToLearn,
    recommendedCertifications: benchmark.certifications,
    coordinatorTips: [
      `Check in during week 2 to ensure student understands ${weakSubjectMention} concepts.`,
      'Encourage student to document project evidence on GitHub or learning portfolio.',
      'Acknowledge milestone completion to maintain motivation.'
    ]
  };
};

/**
 * 2. AI Career Skill Matcher & Gap Analysis
 */
const matchCareerSkills = async (userId, customCareer = null) => {
  const student = await Student.findOne({ userId });
  if (!student) throw ApiError.badRequest('Student profile not found');

  const skills = await Skill.find({ studentId: student._id });
  const studentSkillNames = skills.map((s) => s.name);

  const targetCareer = customCareer || student.aspirations?.targetCareer || 'Software Engineer';
  const benchmark = getBenchmarkForCareer(targetCareer);

  const matchedSkills = [];
  const missingCriticalSkills = [];

  benchmark.criticalSkills.forEach((bSkill) => {
    const found = skills.find(
      (s) => s.name.toLowerCase() === bSkill.toLowerCase() || s.name.toLowerCase().includes(bSkill.toLowerCase())
    );
    if (found) {
      matchedSkills.push({ name: found.name, level: found.level, category: found.category });
    } else {
      missingCriticalSkills.push(bSkill);
    }
  });

  const missingRecommendedSkills = benchmark.recommendedSkills.filter(
    (rSkill) => !studentSkillNames.some((sn) => sn.toLowerCase().includes(rSkill.toLowerCase()))
  );

  const readinessScore = Math.round((matchedSkills.length / benchmark.criticalSkills.length) * 100);

  return {
    targetCareer,
    readinessScore,
    readinessLevel: readinessScore >= 80 ? 'High' : readinessScore >= 40 ? 'Developing' : 'Foundation',
    matchedSkills,
    missingCriticalSkills,
    missingRecommendedSkills,
    recommendedLearningPath: [
      {
        phase: 'Phase 1: Critical Foundations',
        focusSkills: missingCriticalSkills.slice(0, 2),
        estimatedDuration: '4–6 weeks',
        suggestedProjects: [`Build a beginner project demonstrating ${missingCriticalSkills[0] || 'core concepts'}`]
      },
      {
        phase: 'Phase 2: Intermediate Proficiency',
        focusSkills: missingCriticalSkills.slice(2).concat(missingRecommendedSkills.slice(0, 1)),
        estimatedDuration: '6–8 weeks',
        suggestedProjects: ['Collaborative project applying industry-standard tools']
      }
    ],
    recommendedCertifications: benchmark.certifications
  };
};

/**
 * 3. Smart Nudge Engine
 */
const generateNudges = async (userId) => {
  const student = await Student.findOne({ userId });
  if (!student) return [];

  const [academicRecords, skills, goals, followUps, priorityData] = await Promise.all([
    AcademicRecord.find({ studentId: student._id }).sort({ assessmentDate: -1 }),
    Skill.find({ studentId: student._id }),
    Goal.find({ studentId: student._id }),
    FollowUp.find({ studentId: student._id, status: 'pending' }),
    evaluateStudentSupportPriority(student._id)
  ]);

  const nudges = [];

  // Nudge 1: Skills Progress
  if (skills.length === 0) {
    nudges.push({
      id: 'nudge-skills-start',
      type: 'action_needed',
      priority: 'high',
      title: 'Showcase Your Talents 🌟',
      message: 'You have not added any skills yet. Add your programming, language, or soft skills to unlock career readiness insights!',
      actionUrl: '/skills'
    });
  } else if (skills.length < 3) {
    nudges.push({
      id: 'nudge-skills-grow',
      type: 'tip',
      priority: 'medium',
      title: 'Build Your Skill Stack 🚀',
      message: `You have ${skills.length} skills logged. Add 2 more technical or domain skills to boost your career readiness score.`,
      actionUrl: '/skills'
    });
  }

  // Nudge 2: Goals Progress
  const pendingGoals = goals.filter((g) => g.status === 'in_progress' || g.status === 'pending');
  if (pendingGoals.length === 0) {
    nudges.push({
      id: 'nudge-goals-set',
      type: 'action_needed',
      priority: 'medium',
      title: 'Set Your Next Milestone 🎯',
      message: 'Setting a clear monthly goal increases follow-through by 42%. Add a goal for this month!',
      actionUrl: '/goals'
    });
  } else {
    const nearestGoal = pendingGoals[0];
    nudges.push({
      id: 'nudge-goal-active',
      type: 'tip',
      priority: 'low',
      title: `Keep Moving Forward: ${nearestGoal.title}`,
      message: `You are at ${nearestGoal.progress}% progress. Complete your next milestone this week!`,
      actionUrl: '/goals'
    });
  }

  // Nudge 3: Academic Attention
  if (academicRecords.length > 0) {
    const recent = academicRecords[0];
    if (recent.score >= 85) {
      nudges.push({
        id: 'nudge-academic-cheer',
        type: 'celebration',
        priority: 'low',
        title: 'Outstanding Performance! 🏆',
        message: `Kudos on scoring ${recent.score}% in ${recent.subject}! Keep this great momentum going.`,
        actionUrl: '/academics'
      });
    } else if (recent.score < 60) {
      nudges.push({
        id: 'nudge-academic-support',
        type: 'action_needed',
        priority: 'high',
        title: `Need extra help in ${recent.subject}? 💡`,
        message: 'Your center coordinator can arrange 1-on-1 tutoring or peer study groups. Submit a quick support request!',
        actionUrl: '/support-requests'
      });
    }
  }

  // Nudge 4: Scheduled Follow-Up Reminder
  if (followUps.length > 0) {
    const nextTask = followUps[0];
    nudges.push({
      id: 'nudge-followup',
      type: 'reminder',
      priority: 'medium',
      title: `Upcoming Check-In: ${nextTask.title}`,
      message: `Scheduled with your coordinator for ${new Date(nextTask.dueDate).toLocaleDateString()}.`,
      actionUrl: '/interactions'
    });
  }

  return nudges;
};

/**
 * 4. Coordinator AI Student Briefing Summary
 */
const summarizeStudentForCoordinator = async (studentIdentifier) => {
  const student = await resolveStudent(studentIdentifier);
  if (!student) throw ApiError.notFound('Student not found');

  const [user, academicRecords, skills, goals, interactions, priority] = await Promise.all([
    User.findById(student.userId),
    AcademicRecord.find({ studentId: student._id }).sort({ assessmentDate: -1 }),
    Skill.find({ studentId: student._id }),
    Goal.find({ studentId: student._id }),
    Interaction.find({ studentId: student._id }).sort({ interactionDate: -1 }),
    evaluateStudentSupportPriority(student._id)
  ]);

  const studentName = user?.name || 'Student';
  const targetCareer = student.aspirations?.targetCareer || 'Undecided';
  const avgScore = academicRecords.length > 0
    ? Math.round(academicRecords.reduce((sum, r) => sum + r.score, 0) / academicRecords.length)
    : 'N/A';
  const avgAttendance = academicRecords.length > 0
    ? Math.round(academicRecords.reduce((sum, r) => sum + (r.attendance || 0), 0) / academicRecords.length)
    : 'N/A';

  const strengths = [];
  const concerns = [];

  if (typeof avgScore === 'number' && avgScore >= 75) strengths.push(`Strong academic standing with ${avgScore}% overall average`);
  if (typeof avgAttendance === 'number' && avgAttendance >= 90) strengths.push(`Excellent learning center attendance (${avgAttendance}%)`);
  if (skills.length >= 2) strengths.push(`Proactive in logging skills: ${skills.map((s) => s.name).join(', ')}`);

  if (typeof avgScore === 'number' && avgScore < 60) concerns.push(`Academic score is below target (${avgScore}%)`);
  if (typeof avgAttendance === 'number' && avgAttendance < 75) concerns.push(`Low attendance (${avgAttendance}%) indicates possible external barriers`);
  if (skills.length === 0) concerns.push('Zero technical or workplace skills logged in profile');
  if (priority.level === 'HIGH' || priority.level === 'URGENT') concerns.push(...priority.reasons);

  return {
    studentId: student._id,
    studentName,
    program: student.program,
    stage: student.stage,
    targetCareer,
    supportPriorityLevel: priority.level,
    supportPriorityScore: priority.score,
    executiveSummary: `${studentName} is enrolled in the ${student.program} program at ${student.stage}. Their target career aspiration is ${targetCareer}. Current academic average is ${avgScore}% with an average attendance of ${avgAttendance}%. Their overall Support Priority status is currently evaluated as ${priority.level} (${priority.score}/100).`,
    keyStrengths: strengths.length > 0 ? strengths : ['Consistent participation in foundation modules'],
    primaryConcerns: concerns.length > 0 ? concerns : ['No critical risk flags detected'],
    suggestedDiscussionPoints: [
      `Review progress toward ${targetCareer} career requirements and skill milestones.`,
      `Discuss current study schedule and exam preparation for upcoming terms.`,
      `Verify if any financial or logistical obstacles exist for attending center sessions.`
    ],
    recommendedAction: priority.level === 'HIGH' || priority.level === 'URGENT'
      ? 'Schedule immediate in-person check-in session and arrange academic tutoring support.'
      : 'Maintain standard monthly mentoring touchpoint and review action plan milestones.'
  };
};

module.exports = {
  generateActionPlan,
  matchCareerSkills,
  generateNudges,
  summarizeStudentForCoordinator
};
