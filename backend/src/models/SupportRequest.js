const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ['academic', 'career', 'skill', 'college', 'financial', 'general'],
      required: [true, 'Support category is required']
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'cancelled'],
      default: 'pending',
      index: true
    },
    assignedCoordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    resolutionNotes: {
      type: String,
      default: ''
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const SupportRequest = mongoose.model('SupportRequest', supportRequestSchema);

module.exports = SupportRequest;
