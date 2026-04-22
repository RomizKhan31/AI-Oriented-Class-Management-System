const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, requireRole } = require('../utils/authMiddleware');

router.post('/', authenticateToken, requireRole('TEACHER'), attendanceController.markAttendance);
router.get('/:class_id', authenticateToken, attendanceController.getAttendance);

module.exports = router;
