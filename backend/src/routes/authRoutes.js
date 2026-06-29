const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/firebase', authController.loginWithFirebase);
router.post('/refresh', authController.refreshToken);

// Custom Secure Database Auth Endpoints
router.post('/signup', authController.signUp);
router.post('/verify-signup', authController.verifySignUp);
router.post('/login', authController.login);
router.post('/verify-login', authController.verifyLoginOtp);
router.post('/phone-login', authController.phoneLogin);
router.post('/resend-otp', authController.resendOtp);

module.exports = router;
