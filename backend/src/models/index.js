const mongoose = require('mongoose');

// ─── Progress ────────────────────────────────────────────────────────────────
const moduleProgressSchema = new mongoose.Schema({
  moduleId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  status:      { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
  score:       { type: Number, default: null },   // quiz score 0-100
  attempts:    { type: Number, default: 0 },
  timeSpent:   { type: Number, default: 0 },      // seconds
  completedAt: Date
}, { _id: false });

const progressSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    enrolledAt: { type: Date, default: Date.now },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    moduleProgress: [moduleProgressSchema],
    currentModuleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    lastAccessedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    toJSON: { transform: (_, obj) => { delete obj.__v; return obj; } }
  }
);

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
progressSchema.index({ userId: 1 });

const Progress = mongoose.model('Progress', progressSchema);

// ─── Event ───────────────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    moduleId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    courseId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    eventType: {
      type: String,
      required: true,
      enum: ['view_start', 'view_end', 'quiz_attempt', 'quiz_complete', 'bookmark', 'skip', 'code_run']
    },
    payload: {
      // view_end
      watchedSeconds: Number,
      // quiz_attempt / quiz_complete
      attemptNumber:  Number,
      score:          Number,
      timeSpentSec:   Number,
      // code_run
      passed:         Boolean
    },
    timestamp: { type: Date, default: Date.now }
  },
  {
    toJSON: { transform: (_, obj) => { delete obj.__v; return obj; } }
  }
);

// Critical index for ML aggregation queries
eventSchema.index({ userId: 1, timestamp: -1 });
eventSchema.index({ moduleId: 1, eventType: 1 });
eventSchema.index({ userId: 1, moduleId: 1 });

const Event = mongoose.model('Event', eventSchema);

// ─── Rating ──────────────────────────────────────────────────────────────────
const ratingSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    rating:   { type: Number, required: true, min: 1, max: 5 },
    comment:  { type: String, maxlength: 500, default: '' }
  },
  {
    timestamps: true,
    toJSON: { transform: (_, obj) => { delete obj.__v; return obj; } }
  }
);

ratingSchema.index({ userId: 1, moduleId: 1 }, { unique: true });
ratingSchema.index({ moduleId: 1 });

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = { Progress, Event, Rating };
