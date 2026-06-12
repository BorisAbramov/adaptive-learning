const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    type: {
      type: String,
      enum: ['video', 'text', 'quiz', 'code'],
      required: true
    },
    // Content shape depends on type
    content: {
      // video
      videoUrl:     String,
      videoDuration: Number, // seconds
      // text
      body:         String,
      // quiz
      questions: [
        {
          question: String,
          options:  [String],
          correct:  Number, // index of correct option
          explanation: String
        }
      ],
      // code
      language:    String,
      starterCode: String,
      solution:    String,
      tests:       [{ input: String, expected: String }]
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    // Modules that must be completed before this one
    prerequisites: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Module' }
    ],
    learningObjectives: {
      type: [String],
      default: []
    },
    estimatedMinutes: {
      type: Number,
      default: 10
    }
  },
  {
    timestamps: true,
    toJSON: { transform: (_, obj) => { delete obj.__v; return obj; } }
  }
);

moduleSchema.index({ courseId: 1 });
moduleSchema.index({ type: 1, difficulty: 1 });

module.exports = mongoose.model('Module', moduleSchema);
