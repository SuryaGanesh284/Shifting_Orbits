const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['technical', 'soft', 'domain', 'language'],
      default: 'technical',
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    evidence: [
      {
        title: { type: String, required: true },
        type: { type: String, enum: ['project', 'certificate', 'competition', 'course', 'other'], default: 'course' },
        url: { type: String, default: '' },
        issuedBy: { type: String, default: '' },
        date: { type: Date, default: Date.now }
      }
    ],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate skill per student
skillSchema.index({ studentId: 1, name: 1 }, { unique: true });

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;
