const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateSignup, validateLogin, validatePasswordChange } = require('../middleware/validation');

// Rutas públicas
router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);

// Rutas protegidas (requieren autenticación)
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, validatePasswordChange, authController.changePassword);
router.delete('/account', authenticateToken, authController.deleteAccount);
router.get('/verify-token', authenticateToken, authController.verifyToken);

module.exports = router;
