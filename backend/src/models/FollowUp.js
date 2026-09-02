const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
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
    interactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interaction',
      default: null
    },
    supportRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportRequest',
      default: null
    },
    title: {
      type: String,
      required: [true, 'Follow-up title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue', 'cancelled'],
      default: 'pending',
      index: true
    },
    completedAt: {
      type: Date,
      default: null
    },
    completionNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Method to check if follow-up is overdue
followUpSchema.methods.checkOverdue = function () {
  if (this.status !== 'completed' && this.status !== 'cancelled' && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  return this.status;
};

const FollowUp = mongoose.model('FollowUp', followUpSchema);

module.exports = FollowUp;
