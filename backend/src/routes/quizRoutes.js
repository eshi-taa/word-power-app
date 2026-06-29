const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const authenticate = require('../middleware/authenticate');

// All routes are protected by the authenticate middleware
router.use(authenticate);

router.get('/history/all', quizController.getAllQuizHistory);
router.get('/:mainWordId', quizController.getQuiz);
router.post('/submit', quizController.submitQuiz);
router.get('/:mainWordId/history', quizController.getQuizHistory);

module.exports = router;
