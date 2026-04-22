const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken, requireRole } = require('../utils/authMiddleware');

router.get('/', authenticateToken, classController.getClasses);
router.get('/all', authenticateToken, classController.getAllClasses);
router.post('/', authenticateToken, requireRole('TEACHER'), classController.createClass);
router.post('/enroll', authenticateToken, requireRole('STUDENT'), classController.enroll);

module.exports = router;
