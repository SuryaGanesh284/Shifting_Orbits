const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
});

const goalSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    category: {
      type: String,
      enum: ['academic', 'skill', 'career', 'personal'],
      default: 'academic',
      required: true
    },
    targetDate: {
      type: Date,
      required: [true, 'Target date is required']
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'deferred', 'cancelled'],
      default: 'in_progress'
    },
    milestones: [milestoneSchema]
  },
  {
    timestamps: true
  }
);

// Method to re-calculate goal progress from milestones
goalSchema.methods.recalculateProgress = function () {
  if (this.milestones && this.milestones.length > 0) {
    const completed = this.milestones.filter((m) => m.isCompleted).length;
    this.progress = Math.round((completed / this.milestones.length) * 100);
    if (this.progress === 100) {
      this.status = 'completed';
    } else if (this.progress > 0) {
      this.status = 'in_progress';
    }
  }
  return this.progress;
};

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
