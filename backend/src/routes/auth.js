const express = require('express');
const { body } = require('express-validator');
const { register, login, refresh, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required')
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password required')
];

router.post('/register', registerRules, register);
router.post('/login',    loginRules,    login);
router.post('/refresh',  refresh);
router.post('/logout',   protect, logout);
router.get('/me',        protect, getMe);

module.exports = router;
