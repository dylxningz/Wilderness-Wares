const express = require('express');
const router = express.Router();
const userController = require('../controllers/user-controller');
const { isLoggedIn, isGuest } = require('../middleware/auth');

// Accessible only by guests
router.get('/signup', isGuest, userController.getSignupForm);
router.post('/register', isGuest, userController.signup);  
router.get('/login', isGuest, userController.getLoginForm);
router.post('/login', isGuest, userController.login);

// Accessible only by logged-in users
router.get('/profile', isLoggedIn, userController.getProfile);
router.get('/logout', isLoggedIn, userController.logout);

module.exports = router;