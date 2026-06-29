const prisma = require('../config/database');
const ttsService = require('../services/ttsService');
const notificationService = require('../services/notificationService');
const { NotFoundError } = require('../middleware/errors');

// 1. Get all chapters, main words, roots, and user progress
async function getAllGroups(req, res, next) {
  try {
    const userId = req.user.userId;
    const chapters = await prisma.chapter.findMany({
      orderBy: {
        order: 'asc'
      },
      include: {
        mainWords: {
          orderBy: {
            order: 'asc'
          },
          include: {
            roots: {
              include: {
                derivedWords: true
              }
            },
            progress: {
              where: { userId },
              select: {
                studied: true,
                quizUnlocked: true,
                streak: true,
                reviewBox: true,
                nextReviewDate: true
              }
            }
          }
        }
      }
    });

    res.status(200).json(chapters);
  } catch (err) {
    next(err);
  }
}

// 2. Get a single main word by ID with its roots and progress
async function getGroupById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const mainWord = await prisma.mainWord.findUnique({
      where: { id },
      include: {
        roots: {
          include: {
            derivedWords: true
          }
        },
        progress: {
          where: { userId },
          select: {
            studied: true,
            quizUnlocked: true,
            streak: true,
            reviewBox: true,
            nextReviewDate: true
          }
        }
      }
    });

    if (!mainWord) {
      throw new NotFoundError('Main word not found');
    }

    res.status(200).json(mainWord);
  } catch (err) {
    next(err);
  }
}

// 3. Mark a main word as studied
async function markStudied(req, res, next) {
  try {
    const { mainWordId } = req.body;
    const userId = req.user.userId;

    if (!mainWordId) {
      return res.status(400).json({ error: 'mainWordId is required' });
    }

    const progress = await prisma.userProgress.upsert({
      where: {
        userId_mainWordId: {
          userId,
          mainWordId
        }
      },
      update: {
        studied: true,
        studiedAt: new Date()
      },
      create: {
        userId,
        mainWordId,
        studied: true,
        studiedAt: new Date()
      }
    });

    // Fetch the main word name to schedule review notification (non-blocking)
    try {
      const mw = await prisma.mainWord.findUnique({
        where: { id: mainWordId },
        select: { word: true }
      });
      if (mw) {
        notificationService.scheduleReviewNotification(userId, mainWordId, mw.word)
          .catch(err => console.error('Failed to schedule review notification:', err));
      }
    } catch (nsErr) {
      console.error('Error fetching main word for notification:', nsErr);
    }

    res.status(200).json({
      message: 'Marked as studied',
      progress
    });
  } catch (err) {
    next(err);
  }
}

// 4. Get derived word audio URL
async function getWordAudio(req, res, next) {
  const { wordId } = req.params;

  try {
    const word = await prisma.derivedWord.findUnique({
      where: { id: wordId }
    });

    if (!word) {
      throw new NotFoundError('Derived word not found');
    }

    const audioUrl = await ttsService.getOrGenerateAudio(word.id, word.word);
    return res.status(200).json({ audioUrl });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return next(err);
    }
    console.error(`TTS Generation failed for wordId ${wordId}:`, err);
    try {
      const word = await prisma.derivedWord.findUnique({
        where: { id: wordId }
      });
      if (!word) {
        throw new NotFoundError('Derived word not found');
      }
      return res.status(200).json({
        audioUrl: null,
        phonetic: word.phonetic
      });
    } catch (fallbackErr) {
      return next(fallbackErr);
    }
  }
}

// 5. Get all progress records for the current user
async function getUserProgress(req, res, next) {
  try {
    const userId = req.user.userId;
    const progress = await prisma.userProgress.findMany({
      where: { userId }
    });
    return res.status(200).json(progress);
  } catch (err) {
    return next(err);
  }
}

// 6. Get all main words that are due for review based on Leitner algorithm
async function getDueGroups(req, res, next) {
  try {
    const userId = req.user.userId;
    const now = new Date();

    const dueProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        studied: true,
        nextReviewDate: {
          lte: now
        }
      },
      orderBy: {
        reviewBox: 'asc'
      },
      include: {
        mainWord: {
          select: {
            id: true,
            word: true,
            meaning: true,
            roots: {
              select: {
                derivedWords: {
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    });

    const mappedGroups = dueProgress.map((p) => {
      const wordCount = p.mainWord.roots.flatMap(r => r.derivedWords).length;
      return {
        id: p.mainWord.id,
        root: p.mainWord.word,
        meaning: p.mainWord.meaning,
        _count: { words: wordCount },
        progress: [{
          studied: p.studied,
          streak: p.streak,
          reviewBox: p.reviewBox,
          nextReviewDate: p.nextReviewDate
        }]
      };
    });

    res.status(200).json(mappedGroups);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllGroups,
  getGroupById,
  markStudied,
  getWordAudio,
  getUserProgress,
  getDueGroups
};
