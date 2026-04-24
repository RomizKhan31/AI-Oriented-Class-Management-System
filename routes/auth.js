const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { authenticateToken, requireRole } = require('../utils/authMiddleware');

const passport = require('passport');
const jwt = require('jsonwebtoken');

router.post('/register/student', authController.registerStudent);
router.post('/register/teacher', authenticateToken, requireRole('ADMIN'), authController.registerTeacher);
router.post('/login', authController.login);

// Helper to handle OAuth callback
const handleOAuthCallback = (req, res) => {
    const user = req.user;
    if (!user) {
        return res.redirect('/?error=oauth_failed');
    }
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
    // Redirect to frontend with token
    res.redirect(`/?token=${token}`);
};

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), handleOAuthCallback);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/' }), handleOAuthCallback);

module.exports = router;
