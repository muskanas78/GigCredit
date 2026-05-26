/**
 * app.js — GigCredit Express App
 * Freelance Receivable Factoring Platform
 * FAST University Islamabad | FinTech Semester 6
 */

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS
const corsOrigins = (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (corsOrigins.includes('*') || corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// 3. Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 4. Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 5. Health check (public)
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'GigCredit API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// 6. Routes
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/wallet',        require('./routes/walletRoutes'));
app.use('/api/transactions',  require('./routes/transactionRoutes'));
app.use('/api/expenses',      require('./routes/expenseRoutes'));
app.use('/api/budgets',       require('./routes/budgetRoutes'));
app.use('/api/categories',    require('./routes/categoryRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reports',       require('./routes/reportRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));

app.get('/', (_req, res) => {
  res.json({ name: 'GigCredit API', docs: '/api/health', version: '1.0.0' });
});

// 7. 404 handler (after routes)
app.use(require('./middlewares/notFound'));

// 8. Centralized error handler (LAST)
app.use(require('./middlewares/errorHandler'));

module.exports = app;
