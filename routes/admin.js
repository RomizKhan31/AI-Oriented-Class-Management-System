const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../utils/authMiddleware');

router.get('/users', authenticateToken, requireRole('ADMIN'), adminController.getSystemUsers);
router.delete('/users/:id', authenticateToken, requireRole('ADMIN'), adminController.deleteUser);

module.exports = router;
