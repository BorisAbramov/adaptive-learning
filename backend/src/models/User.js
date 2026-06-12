const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student'
    },
    profile: {
      firstName:  { type: String, trim: true, default: '' },
      lastName:   { type: String, trim: true, default: '' },
      avatar:     { type: String, default: '' },
      bio:        { type: String, default: '' }
    },
    learningPreferences: {
      preferredFormat:     { type: [String], enum: ['video', 'text', 'quiz', 'code'], default: [] },
      preferredDifficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'any'], default: 'any' },
      targetCategories:    { type: [String], default: [] },
      dailyGoalMinutes:    { type: Number, default: 30 }
    },
    refreshToken: {
      type: String,
      select: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginAt: Date
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, obj) => {
        delete obj.passwordHash;
        delete obj.refreshToken;
        delete obj.__v;
        return obj;
      }
    }
  }
);

// Virtual: full name
userSchema.virtual('profile.fullName').get(function () {
  return `${this.profile.firstName} ${this.profile.lastName}`.trim();
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Indexes
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
