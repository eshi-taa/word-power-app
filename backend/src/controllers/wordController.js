const prisma = require('../config/database');
const ttsService = require('../services/ttsService');
const notificationService = require('../services/notificationService');
const { NotFoundError } = require('../middleware/errors');



// 1. Get all word groups with word counts
async function getAllGroups(req, res, next) {
  try {
    const userId = req.user.userId;
    const groups = await prisma.wordGroup.findMany({
      orderBy: {
        order: 'asc'
      },
      select: {
        id: true,
        root: true,
        meaning: true,
        order: true,
        _count: {
          select: { words: true }
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

    res.status(200).json(groups);
  } catch (err) {
    next(err);
  }
}

// 2. Get a single group by ID with its words
async function getGroupById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const group = await prisma.wordGroup.findUnique({
      where: { id },
      include: {
        words: true,
        progress: {
          where: { userId },
          select: {
            studied: true,
            quizUnlocked: true,
            streak: true
          }
        }
      }
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    res.status(200).json(group);
  } catch (err) {
    next(err);
  }
}

// 3. Mark a word group as studied for the user
async function markStudied(req, res, next) {
  try {
    const { groupId } = req.body;
    const userId = req.user.userId;

    if (!groupId) {
      return res.status(400).json({ error: 'groupId is required' });
    }

    const progress = await prisma.userProgress.upsert({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      },
      update: {
        studied: true,
        studiedAt: new Date()
      },
      create: {
        userId,
        groupId,
        studied: true,
        studiedAt: new Date()
      }
    });

    // Fetch the group root name to schedule review notification (non-blocking)
    try {
      const group = await prisma.wordGroup.findUnique({
        where: { id: groupId },
        select: { root: true }
      });
      if (group) {
        notificationService.scheduleReviewNotification(userId, groupId, group.root)
          .catch(err => console.error('Failed to schedule review notification:', err));
      }
    } catch (nsErr) {
      console.error('Error fetching group for notification:', nsErr);
    }

    res.status(200).json({
      message: 'Marked as studied',
      progress
    });
  } catch (err) {
    next(err);
  }
}

// 4. Get word audio URL with graceful fallback
async function getWordAudio(req, res, next) {
  const { wordId } = req.params;

  try {
    const word = await prisma.word.findUnique({
      where: { id: wordId }
    });

    if (!word) {
      throw new NotFoundError('Word not found');
    }

    const audioUrl = await ttsService.getOrGenerateAudio(word.id, word.word);
    return res.status(200).json({ audioUrl });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return next(err);
    }
    console.error(`TTS Generation failed for wordId ${wordId}:`, err);
    try {
      const word = await prisma.word.findUnique({
        where: { id: wordId }
      });
      if (!word) {
        throw new NotFoundError('Word not found');
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

// 6. Get all groups that are due for review based on Leitner algorithm
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
        group: {
          select: {
            id: true,
            root: true,
            meaning: true,
            _count: {
              select: { words: true }
            }
          }
        }
      }
    });

    const mappedGroups = dueProgress.map((p) => ({
      id: p.group.id,
      root: p.group.root,
      meaning: p.group.meaning,
      _count: p.group._count,
      progress: [{
        studied: p.studied,
        streak: p.streak,
        reviewBox: p.reviewBox,
        nextReviewDate: p.nextReviewDate
      }]
    }));

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
