const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { authenticateToken, requireRole } = require('../utils/authMiddleware');

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

router.post('/exams', authenticateToken, requireRole('TEACHER'), upload.single('exam_file'), academicController.createExam);
router.get('/exams/:class_id', authenticateToken, academicController.getExamsByClass);
router.get('/teacher-data', authenticateToken, requireRole('TEACHER'), academicController.getTeacherData);
router.post('/results', authenticateToken, requireRole('TEACHER'), academicController.assignResult);
router.post('/results/submit', authenticateToken, requireRole('STUDENT'), upload.single('exam_script'), academicController.submitExamScript);
router.get('/submissions', authenticateToken, requireRole('TEACHER'), academicController.getSubmissions);
router.get('/performance', authenticateToken, requireRole('STUDENT'), academicController.getStudentPerformance);

module.exports = router;
