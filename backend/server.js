const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const wordRoutes = require('./src/routes/wordRoutes');
const quizRoutes = require('./src/routes/quizRoutes');
const authenticate = require('./src/middleware/authenticate');
const { AppError } = require('./src/middleware/errors');

const app = express();

// 1. Middlewares in order
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/quiz', quizRoutes);

// Temporary test route for authenticated requests
app.get('/api/test-auth', authenticate, (req, res) => {
  res.status(200).json({
    message: 'authenticated',
    user: req.user
  });
});

// 2. Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date()
  });
});

// 3. 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// 4. Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = (err instanceof AppError || err.status || err.statusCode)
    ? err.message
    : 'Internal server error';

  res.status(statusCode).json({
    error: message
  });
});

// 5 & 6. Server listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
