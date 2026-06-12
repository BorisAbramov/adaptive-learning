const express = require('express');
const { getModule, createModule } = require('../controllers/moduleController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/:id', protect, getModule);
router.post('/',   protect, restrictTo('instructor', 'admin'), createModule);

module.exports = router;
