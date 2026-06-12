const express = require('express');
const { body } = require('express-validator');
const { getProgress, completeModule, trackEvent, rateModule } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Progress
router.get('/:courseId', protect, getProgress);
router.post('/:courseId/modules/:moduleId/complete', protect, completeModule);

// Events
router.post('/events', protect, [
  body('moduleId').notEmpty(),
  body('courseId').notEmpty(),
  body('eventType').isIn(['view_start', 'view_end', 'quiz_attempt', 'quiz_complete', 'bookmark', 'skip', 'code_run'])
], trackEvent);

// Ratings
router.post('/ratings', protect, [
  body('moduleId').notEmpty(),
  body('courseId').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 })
], rateModule);

module.exports = router;
