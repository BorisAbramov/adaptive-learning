const express = require('express');
const { body } = require('express-validator');
const {
  getCourses, getCourse, createCourse, updateCourse, enrollCourse, getMyCourses
} = require('../controllers/courseController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

const courseRules = [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('category').notEmpty().withMessage('Category required'),
  body('level').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level')
];

router.get('/',    protect, getCourses);
router.get('/my',  protect, getMyCourses);
router.get('/:id', protect, getCourse);

router.post('/',         protect, restrictTo('instructor', 'admin'), courseRules, createCourse);
router.put('/:id',       protect, restrictTo('instructor', 'admin'), updateCourse);
router.post('/:id/enroll', protect, enrollCourse);

module.exports = router;
