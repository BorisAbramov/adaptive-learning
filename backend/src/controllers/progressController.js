const { Progress, Event, Rating } = require('../models/index');
const Course = require('../models/Course');
const { success, error } = require('../utils/response');

// GET /api/progress/:courseId
const getProgress = async (req, res, next) => {
  try {
    const progress = await Progress.findOne({
      userId: req.user._id,
      courseId: req.params.courseId
    }).populate('moduleProgress.moduleId', 'title type estimatedMinutes');

    if (!progress) return error(res, 'Not enrolled in this course', 404);
    return success(res, { progress });
  } catch (err) {
    next(err);
  }
};

// POST /api/progress/:courseId/modules/:moduleId/complete
const completeModule = async (req, res, next) => {
  try {
    const { courseId, moduleId } = req.params;
    const { score, timeSpent } = req.body;

    const progress = await Progress.findOne({ userId: req.user._id, courseId });
    if (!progress) return error(res, 'Not enrolled', 404);

    const mp = progress.moduleProgress.find(m => m.moduleId.toString() === moduleId);
    if (!mp) return error(res, 'Module not found in course', 404);

    mp.status      = 'completed';
    mp.completedAt = new Date();
    mp.attempts    += 1;
    if (score !== undefined) mp.score = score;
    if (timeSpent !== undefined) mp.timeSpent = timeSpent;

    // Recalculate completion percentage
    const completed = progress.moduleProgress.filter(m => m.status === 'completed').length;
    progress.completionPercentage = Math.round((completed / progress.moduleProgress.length) * 100);
    progress.lastAccessedAt = new Date();

    // Advance to next uncompleted module
    const nextModule = progress.moduleProgress.find(m => m.status === 'not_started');
    if (nextModule) progress.currentModuleId = nextModule.moduleId;

    await progress.save();
    return success(res, { progress }, 'Module completed');
  } catch (err) {
    next(err);
  }
};

// POST /api/events
const trackEvent = async (req, res, next) => {
  try {
    const { moduleId, courseId, eventType, payload } = req.body;

    const event = await Event.create({
      userId: req.user._id,
      moduleId,
      courseId,
      eventType,
      payload: payload || {}
    });

    return success(res, { event }, 'Event tracked', 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/ratings
const rateModule = async (req, res, next) => {
  try {
    const { moduleId, courseId, rating, comment } = req.body;

    const existing = await Rating.findOne({ userId: req.user._id, moduleId });

    let ratingDoc;
    if (existing) {
      ratingDoc = await Rating.findByIdAndUpdate(
        existing._id,
        { rating, comment },
        { new: true }
      );
    } else {
      ratingDoc = await Rating.create({ userId: req.user._id, moduleId, courseId, rating, comment });
    }

    // Update average rating on course
    const ratings = await Rating.find({ courseId });
    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    await Course.findByIdAndUpdate(courseId, { averageRating: Math.round(avg * 10) / 10 });

    return success(res, { rating: ratingDoc }, existing ? 'Rating updated' : 'Rating saved', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProgress, completeModule, trackEvent, rateModule };
