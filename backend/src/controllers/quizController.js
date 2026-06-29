const prisma = require('../config/database');
const quizService = require('../services/quizService');
const schedulerService = require('../services/schedulerService');
const { NotFoundError } = require('../middleware/errors');


// 1. Get quiz questions for a word group
async function getQuiz(req, res, next) {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    // Check user progress to ensure they studied the group first
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    if (!progress || !progress.studied) {
      return res.status(403).json({ error: 'Study this group first' });
    }

    // Fetch group with words
    const group = await prisma.wordGroup.findUnique({
      where: { id: groupId },
      include: { words: true }
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Generate quiz questions
    const questions = quizService.generateQuiz(group.words);

    res.status(200).json({
      groupId,
      questions
    });
  } catch (err) {
    next(err);
  }
}

// 2. Submit quiz answers and score it
async function submitQuiz(req, res, next) {
  try {
    const { groupId, answers } = req.body;
    const userId = req.user.userId;

    if (!groupId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'groupId and answers (array) are required' });
    }

    // Fetch the group and its words
    const group = await prisma.wordGroup.findUnique({
      where: { id: groupId },
      include: { words: true }
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Generate same questions to grade answers against
    const questions = quizService.generateQuiz(group.words);

    // Calculate score
    const score = quizService.scoreQuiz(questions, answers);
    const passed = score >= 2;

    // Save quiz result to DB
    await prisma.quizResult.create({
      data: {
        userId,
        groupId,
        score,
        passed
      }
    });

    // Fetch current user progress to determine current box
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    const currentBox = progress ? progress.reviewBox : 1;
    const { nextBox, nextReviewDate } = schedulerService.calculateNextLeitner(currentBox, passed);

    // Update userProgress (box + review dates on every attempt; streak/unlock on pass)
    await prisma.userProgress.update({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      },
      data: {
        reviewBox: nextBox,
        nextReviewDate,
        ...(passed ? {
          quizUnlocked: true,
          streak: {
            increment: 1
          }
        } : {})
      }
    });

    res.status(200).json({
      score,
      passed,
      total: 3
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQuiz,
  submitQuiz
};
