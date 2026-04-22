const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticateToken, requireRole } = require('../utils/authMiddleware');

router.get('/class/:class_id', authenticateToken, requireRole('TEACHER'), exportController.exportClassReport);
router.get('/global', authenticateToken, requireRole('ADMIN'), exportController.exportGlobalReport);

module.exports = router;
