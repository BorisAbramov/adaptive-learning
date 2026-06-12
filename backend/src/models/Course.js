const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [200, 'Title too long']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description too long']
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['programming', 'design', 'marketing', 'data-science', 'business', 'other']
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    tags: {
      type: [String],
      default: []
    },
    thumbnail: {
      type: String,
      default: ''
    },
    // Ordered list of module references
    modules: [
      {
        moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
        order:    { type: Number, required: true }
      }
    ],
    isPublished: {
      type: Boolean,
      default: false
    },
    enrollmentCount: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_, obj) => { delete obj.__v; return obj; } }
  }
);

courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Course', courseSchema);
