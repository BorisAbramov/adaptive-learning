require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const connectDB      = require('./config/database');
const logger         = require('./utils/logger');
const errorHandler   = require('./middleware/errorHandler');

// Routes
const authRoutes            = require('./routes/auth');
const courseRoutes          = require('./routes/courses');
const progressRoutes        = require('./routes/progress');
const recommendationRoutes  = require('./routes/recommendations');
const moduleRoutes = require('./routes/modules');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Connect DB ───────────────────────────────────────────────────────────────
connectDB();

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts' }
});

app.use('/api/', limiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Body parsing & logging ───────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev', { stream: { write: msg => logger.info(msg.trim()) } }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/courses',         courseRoutes);
app.use('/api/progress',        progressRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/modules', moduleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', env: process.env.NODE_ENV });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
