const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');
const { authenticateToken } = require('../utils/authMiddleware');

router.post('/message', authenticateToken, communicationController.sendMessage);
router.get('/inbox', authenticateToken, communicationController.getInbox);

module.exports = router;
