const express = require('express');
const router = express.Router();
const crisisController = require('../controllers/crisisController');

router.get('/alerts', crisisController.getCrisisAlerts);

module.exports = router;
