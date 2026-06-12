const Course = require('../models/Course');
const Module = require('../models/Module');
const { Progress } = require('../models/index');
const { success, error } = require('../utils/response');
const { validationResult } = require('express-validator');

// GET /api/courses
const getCourses = async (req, res, next) => {
  try {
    const { category, level, search, page = 1, limit = 12 } = req.query;

    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (level)    filter.level = level;
    if (search)   filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('instructorId', 'profile.firstName profile.lastName profile.avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Course.countDocuments(filter)
    ]);

    return success(res, {
      courses,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/courses/:id
const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructorId', 'profile.firstName profile.lastName profile.avatar profile.bio')
      .populate('modules.moduleId', 'title type difficulty estimatedMinutes learningObjectives');

    if (!course) return error(res, 'Course not found', 404);

    // Check if current user is enrolled
    let progress = null;
    if (req.user) {
      progress = await Progress.findOne({ userId: req.user._id, courseId: course._id });
    }

    return success(res, { course, progress });
  } catch (err) {
    next(err);
  }
};

// POST /api/courses  (instructor/admin only)
const createCourse = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return error(res, 'Validation failed', 400, errors.array());

    const course = await Course.create({ ...req.body, instructorId: req.user._id });
    return success(res, { course }, 'Course created', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/courses/:id  (owner or admin)
const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return error(res, 'Course not found', 404);

    const isOwner = course.instructorId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return error(res, 'Not authorized', 403);
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    return success(res, { course: updated }, 'Course updated');
  } catch (err) {
    next(err);
  }
};

// POST /api/courses/:id/enroll
const enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || !course.isPublished) return error(res, 'Course not found', 404);

    const existing = await Progress.findOne({ userId: req.user._id, courseId: course._id });
    if (existing) return error(res, 'Already enrolled', 409);

    // Init module progress array
    const moduleProgress = course.modules.map(m => ({
      moduleId: m.moduleId,
      status: 'not_started'
    }));

    const progress = await Progress.create({
      userId: req.user._id,
      courseId: course._id,
      moduleProgress,
      currentModuleId: course.modules[0]?.moduleId || null
    });

    // Increment enrollment count
    await Course.findByIdAndUpdate(course._id, { $inc: { enrollmentCount: 1 } });

    return success(res, { progress }, 'Enrolled successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/courses/my  — courses where user is enrolled
const getMyCourses = async (req, res, next) => {
  try {
    const progresses = await Progress.find({ userId: req.user._id })
      .populate({ path: 'courseId', select: 'title thumbnail category level averageRating' });

    return success(res, { courses: progresses });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCourses, getCourse, createCourse, updateCourse, enrollCourse, getMyCourses };
