const axios = require('axios');
const { Progress, Event } = require('../models/index');
const Module = require('../models/Module');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

// GET /api/recommendations
// Calls ML microservice; falls back to simple rule-based recs if ML is unavailable
const getRecommendations = async (req, res, next) => {
  try {
    const userId   = req.user._id.toString();
    const courseId = req.query.courseId;
    const limit    = Number(req.query.limit) || 5;

    // Gather user interaction count (cold-start detection)
    const interactionCount = await Event.countDocuments({ userId: req.user._id });

    let recommendations = [];
    let source = 'ml';

    // Try ML microservice
    try {
      const mlRes = await axios.get(`${process.env.ML_SERVICE_URL}/recommend`, {
        params: { userId, courseId, limit },
        timeout: 3000
      });
      recommendations = mlRes.data.recommendations;
    } catch (mlErr) {
      logger.warn(`ML service unavailable, using fallback: ${mlErr.message}`);
      source = 'fallback';

      // Fallback: recommend next uncompleted modules in enrolled courses
      recommendations = await fallbackRecommendations(req.user._id, courseId, limit);
    }

    return success(res, {
      recommendations,
      source,
      coldStart: interactionCount < 5
    });
  } catch (err) {
    next(err);
  }
};

// Simple fallback: next modules the user hasn't completed yet
const fallbackRecommendations = async (userId, courseId, limit) => {
  const filter = { userId };
  if (courseId) filter.courseId = courseId;

  const progresses = await Progress.find(filter).limit(5);

  const moduleIds = [];
  for (const progress of progresses) {
    const notStarted = progress.moduleProgress
      .filter(m => m.status === 'not_started')
      .slice(0, 2)
      .map(m => m.moduleId);
    moduleIds.push(...notStarted);
    if (moduleIds.length >= limit) break;
  }

  const modules = await Module.find({ _id: { $in: moduleIds.slice(0, limit) } })
    .select('title type difficulty estimatedMinutes courseId');

  return modules.map(m => ({
    moduleId:  m._id,
    title:     m.title,
    type:      m.type,
    difficulty: m.difficulty,
    estimatedMinutes: m.estimatedMinutes,
    score:     null,
    reason:    'Next in your course'
  }));
};

module.exports = { getRecommendations };
