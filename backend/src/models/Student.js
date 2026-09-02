const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    centerId: {
      type: String,
      required: true,
      default: 'SOF-BLR-01',
      index: true
    },
    coordinatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    program: {
      type: String,
      enum: ['Sethu', 'Stambha'],
      default: 'Sethu',
      required: true
    },
    stage: {
      type: String,
      enum: [
        'Grade 11',
        'Grade 12',
        'Higher Education',
        'Skill Development',
        'Internship',
        'Employment'
      ],
      default: 'Grade 11'
    },
    education: {
      currentGrade: { type: String, default: 'Grade 11' },
      institution: { type: String, default: '' },
      stream: { type: String, default: '' },
      graduationYear: { type: Number, default: null },
      board: { type: String, default: 'State Board' }
    },
    interests: {
      type: [String],
      default: []
    },
    aspirations: {
      targetCareer: { type: String, default: '' },
      higherEducationGoal: { type: String, default: '' },
      dreamCompanies: { type: [String], default: [] },
      notes: { type: String, default: '' }
    },
    contact: {
      parentName: { type: String, default: '' },
      parentPhone: { type: String, default: '' },
      address: { type: String, default: '' },
      emergencyContact: { type: String, default: '' }
    },
    profileCompletion: {
      type: Number,
      min: 0,
      max: 100,
      default: 20
    }
  },
  {
    timestamps: true
  }
);

// Method to calculate profile completion percentage
studentSchema.methods.calculateProfileCompletion = function () {
  let score = 20; // base registered account

  if (this.education?.institution && this.education?.stream) score += 20;
  if (this.interests && this.interests.length > 0) score += 15;
  if (this.aspirations?.targetCareer) score += 25;
  if (this.contact?.parentPhone || this.contact?.parentName) score += 20;

  this.profileCompletion = Math.min(score, 100);
  return this.profileCompletion;
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
