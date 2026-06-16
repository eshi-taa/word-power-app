const express = require('express');
const router = express.Router();
const wordController = require('../controllers/wordController');
const authenticate = require('../middleware/authenticate');

// All routes are protected by the authenticate middleware
router.use(authenticate);

router.get('/groups', wordController.getAllGroups);
router.get('/groups/:id', wordController.getGroupById);
router.post('/groups/studied', wordController.markStudied);
router.get('/audio/:wordId', wordController.getWordAudio);
router.get('/progress', wordController.getUserProgress);

module.exports = router;
