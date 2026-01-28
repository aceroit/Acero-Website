const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { 
    register, 
    login, 
    logout, 
    getMe, 
    refreshToken,
    updateProfile,
    changePassword
} = require('../controllers/authController');
const {
    validateRegister,
    validateLogin,
    validateUpdateUser,
    validateChangePassword
} = require('../utils/validators');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes (require authentication)
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/refresh-token', authenticate, refreshToken);
router.put('/profile', authenticate, validateUpdateUser, updateProfile);
router.put('/change-password', authenticate, validateChangePassword, changePassword);

module.exports = router;