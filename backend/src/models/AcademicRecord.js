const mongoose = require('mongoose');

const academicRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required (e.g. 2025-2026)'],
      trim: true
    },
    grade: {
      type: String,
      required: [true, 'Grade/Class is required (e.g. Grade 11)'],
      trim: true
    },
    term: {
      type: String,
      default: 'Term 1',
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100']
    },
    maxScore: {
      type: Number,
      default: 100
    },
    attendance: {
      type: Number,
      min: [0, 'Attendance cannot be negative'],
      max: [100, 'Attendance cannot exceed 100'],
      default: 90
    },
    assessmentDate: {
      type: Date,
      default: Date.now
    },
    strengths: {
      type: [String],
      default: []
    },
    areasForImprovement: {
      type: [String],
      default: []
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const AcademicRecord = mongoose.model('AcademicRecord', academicRecordSchema);

module.exports = AcademicRecord;
