const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/firebase', authController.loginWithFirebase);
router.post('/refresh', authController.refreshToken);

module.exports = router;
