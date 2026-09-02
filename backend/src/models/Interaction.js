const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  targetDate: {
    type: Date,
    default: null
  }
});

const interactionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    coordinatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['in_person', 'call', 'online_meeting', 'center_visit', 'home_visit', 'other'],
      default: 'in_person'
    },
    notes: {
      type: String,
      required: [true, 'Interaction discussion notes are required'],
      trim: true
    },
    summary: {
      type: String,
      default: '',
      trim: true
    },
    concerns: {
      type: [String],
      default: []
    },
    actionItems: [actionItemSchema],
    interactionDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    nextFollowUpDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Interaction = mongoose.model('Interaction', interactionSchema);

module.exports = Interaction;
