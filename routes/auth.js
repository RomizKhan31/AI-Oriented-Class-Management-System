const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { authenticateToken, requireRole } = require('../utils/authMiddleware');

router.post('/register/student', authController.registerStudent);
router.post('/register/teacher', authenticateToken, requireRole('ADMIN'), authController.registerTeacher);
router.post('/login', authController.login);

module.exports = router;
