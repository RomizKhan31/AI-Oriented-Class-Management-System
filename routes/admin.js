const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../utils/authMiddleware');

router.get('/users', authenticateToken, requireRole('ADMIN'), adminController.getSystemUsers);
router.delete('/users/:id', authenticateToken, requireRole('ADMIN'), adminController.deleteUser);
router.get('/export/pdf', authenticateToken, requireRole('ADMIN'), adminController.exportUsersPDF);
router.get('/export/excel', authenticateToken, requireRole('ADMIN'), adminController.exportUsersExcel);

module.exports = router;
