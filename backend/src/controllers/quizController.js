const prisma = require('../config/database');
const quizService = require('../services/quizService');
const schedulerService = require('../services/schedulerService');
const { NotFoundError } = require('../middleware/errors');

// 1. Get quiz questions for a main word
async function getQuiz(req, res, next) {
  try {
    const { mainWordId } = req.params;
    const userId = req.user.userId;

    // Check user progress to ensure they studied the main word first
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_mainWordId: {
          userId,
          mainWordId
        }
      }
    });

    if (!progress || !progress.studied) {
      return res.status(403).json({ error: 'Study this topic first' });
    }

    // Fetch main word with roots and derivedWords
    const mainWord = await prisma.mainWord.findUnique({
      where: { id: mainWordId },
      include: {
        roots: {
          include: {
            derivedWords: true
          }
        }
      }
    });

    if (!mainWord) {
      throw new NotFoundError('Main word not found');
    }

    // Gather all derived words
    let words = mainWord.roots.flatMap(r => r.derivedWords);

    // If there are fewer than 3 derived words under this main word's roots, 
    // fetch random other derived words from the database as fillers
    if (words.length < 3) {
      const allDerived = await prisma.derivedWord.findMany({
        take: 10
      });
      const existingIds = new Set(words.map(w => w.id));
      for (const w of allDerived) {
        if (!existingIds.has(w.id)) {
          words.push(w);
          if (words.length >= 3) break;
        }
      }
    }

    // Generate quiz questions
    const questions = quizService.generateQuiz(words);

    res.status(200).json({
      mainWordId,
      questions
    });
  } catch (err) {
    next(err);
  }
}

// 2. Submit quiz answers and score it with detailed feedback
async function submitQuiz(req, res, next) {
  try {
    const { mainWordId, answers } = req.body;
    const userId = req.user.userId;

    if (!mainWordId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'mainWordId and answers (array) are required' });
    }

    const mainWord = await prisma.mainWord.findUnique({
      where: { id: mainWordId },
      include: {
        roots: {
          include: {
            derivedWords: true
          }
        }
      }
    });

    if (!mainWord) {
      throw new NotFoundError('Main word not found');
    }

    let words = mainWord.roots.flatMap(r => r.derivedWords);

    // Same filler logic as getQuiz to match questions structure
    if (words.length < 3) {
      const allDerived = await prisma.derivedWord.findMany({
        take: 10
      });
      const existingIds = new Set(words.map(w => w.id));
      for (const w of allDerived) {
        if (!existingIds.has(w.id)) {
          words.push(w);
          if (words.length >= 3) break;
        }
      }
    }

    const questions = quizService.generateQuiz(words);

    // Score quiz and build details explanation logs
    const details = [];
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = (answers[i] || '').toString().toLowerCase().trim();
      const correctAnswer = (question.answer || '').toString().toLowerCase().trim();

      let isCorrect = false;
      if (userAnswer && correctAnswer) {
        if (userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer)) {
          isCorrect = true;
        }
      }

      details.push({
        type: question.type,
        question: question.question,
        userAnswer: answers[i] || '',
        correctAnswer: question.answer,
        isCorrect,
        explanation: quizService.getExplanation(question, answers[i], isCorrect)
      });
    }

    const score = details.filter(d => d.isCorrect).length;
    const passed = score >= 2;

    // Save quiz result with JSON details
    await prisma.quizResult.create({
      data: {
        userId,
        mainWordId,
        score,
        passed,
        details: details
      }
    });

    // Fetch current user progress to determine current box
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_mainWordId: {
          userId,
          mainWordId
        }
      }
    });

    const currentBox = progress ? progress.reviewBox : 1;
    const { nextBox, nextReviewDate } = schedulerService.calculateNextLeitner(currentBox, passed);

    const alreadyPassed = progress && progress.quizUnlocked;

    // Update userProgress (box + review dates on every attempt; streak/unlock on pass)
    await prisma.userProgress.update({
      where: {
        userId_mainWordId: {
          userId,
          mainWordId
        }
      },
      data: {
        reviewBox: nextBox,
        nextReviewDate,
        ...(passed ? {
          quizUnlocked: true,
          ...(!alreadyPassed ? {
            streak: {
              increment: 1
            }
          } : {})
        } : {})
      }
    });

    res.status(200).json({
      score,
      passed,
      total: questions.length,
      details
    });
  } catch (err) {
    next(err);
  }
}

// 3. Get past attempts history for a main word
async function getQuizHistory(req, res, next) {
  try {
    const { mainWordId } = req.params;
    const userId = req.user.userId;

    const history = await prisma.quizResult.findMany({
      where: {
        userId,
        mainWordId
      },
      orderBy: {
        takenAt: 'desc'
      }
    });

    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
}

// 4. Get all quiz results history for the current user
async function getAllQuizHistory(req, res, next) {
  try {
    const userId = req.user.userId;
    const history = await prisma.quizResult.findMany({
      where: { userId },
      orderBy: { takenAt: 'desc' }
    });
    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQuiz,
  submitQuiz,
  getQuizHistory,
  getAllQuizHistory
};
