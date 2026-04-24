const pool = require('../config/db');

exports.createExam = async (req, res) => {
    try {
        const { id, class_id, title, details, duration_minutes } = req.body;
        let exam_content = req.body.exam_content_text || null; 
        
        // If a physical file was uploaded, use the server path
        if (req.file) {
            exam_content = '/uploads/' + req.file.filename;
        }

        // Verify class ownership
        const [classes] = await pool.query('SELECT teacher_id FROM classes WHERE id = ?', [class_id]);
        if (classes.length === 0 || classes[0].teacher_id !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized or class not found' });
        }

        await pool.query(
            'INSERT INTO exams (id, class_id, title, details, exam_content, duration_minutes) VALUES (?, ?, ?, ?, ?, ?)',
            [id, class_id, title, details, exam_content, duration_minutes]
        );

        res.status(201).json({ message: 'Exam created successfully', examId: id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getExamsByClass = async (req, res) => {
    try {
        const { class_id } = req.params;
        const [exams] = await pool.query('SELECT * FROM exams WHERE class_id = ?', [class_id]);
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getTeacherData = async (req, res) => {
    try {
        const teacherId = req.user.id;
        
        // Get all exams for this teacher's classes
        const [exams] = await pool.query(`
            SELECT e.id, e.title, c.name as class_name
            FROM exams e
            JOIN classes c ON e.class_id = c.id
            WHERE c.teacher_id = ?
        `, [teacherId]);

        // Get all students enrolled in this teacher's classes
        const [students] = await pool.query(`
            SELECT DISTINCT u.id, u.name
            FROM users u
            JOIN enrollments en ON u.id = en.student_id
            JOIN classes c ON en.class_id = c.id
            WHERE c.teacher_id = ?
        `, [teacherId]);

        res.json({ exams, students });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.assignResult = async (req, res) => {
    try {
        const { exam_id, student_id, score } = req.body;
        
        // Strict exam constraint: Check if result already exists
        const [existing] = await pool.query('SELECT id FROM results WHERE exam_id = ? AND student_id = ?', [exam_id, student_id]);
        
        if (existing.length > 0) {
            // Prevent duplicate attempts/overwrites from the student side 
            // Note: If teacher needs to edit, they would use a separate teacher-only endpoint.
            // Since this endpoint is used globally right now, we will enforce strictness.
            if (req.user.role === 'STUDENT') {
                return res.status(403).json({ message: 'Exam attempt already recorded. Duplicate attempts are strictly prohibited.' });
            } else {
                // Let Teachers override
                await pool.query('UPDATE results SET score = ? WHERE id = ?', [score, existing[0].id]);
                return res.json({ message: 'Result updated successfully by Teacher' });
            }
        } else {
            await pool.query('INSERT INTO results (exam_id, student_id, score) VALUES (?, ?, ?)', [exam_id, student_id, score]);
            return res.json({ message: 'Result recorded successfully' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getStudentPerformance = async (req, res) => {
    try {
        const studentId = req.user.id;
        
        // 1. Fetch Exam performance
        const [exams] = await pool.query(`
            SELECT 
                e.id as exam_id,
                e.title as exam_title,
                e.exam_content,
                e.duration_minutes,
                c.name as class_name, 
                r.score 
            FROM exams e
            JOIN classes c ON e.class_id = c.id
            JOIN enrollments en ON c.id = en.class_id
            LEFT JOIN results r ON e.id = r.exam_id AND r.student_id = en.student_id
            WHERE en.student_id = ?
        `, [studentId]);

        // 2. Fetch Attendance biodata
        const [attendanceRaw] = await pool.query(`
            SELECT c.name as class_name, a.status 
            FROM attendance a
            JOIN classes c ON a.class_id = c.id
            WHERE a.student_id = ?
        `, [studentId]);

        // Aggregate attendance % per class
        const attendanceData = {};
        for (let row of attendanceRaw) {
            if(!attendanceData[row.class_name]) attendanceData[row.class_name] = { present: 0, total: 0 };
            attendanceData[row.class_name].total += 1;
            if(row.status === 'PRESENT') attendanceData[row.class_name].present += 1;
        }

        const attendance = [];
        for (let className in attendanceData) {
            const data = attendanceData[className];
            const pct = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
            attendance.push({ class_name: className, percentage: pct });
        }

        res.json({ exams, attendance });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.submitExamScript = async (req, res) => {
    try {
        const { exam_id } = req.body;
        const student_id = req.user.id;
        
        let script_path = null;
        if (req.file) {
            script_path = '/uploads/' + req.file.filename;
        }

        const [existing] = await pool.query('SELECT id FROM results WHERE exam_id = ? AND student_id = ?', [exam_id, student_id]);
        
        if (existing.length > 0) {
            return res.status(403).json({ message: 'Exam attempt already recorded. Duplicate attempts are strictly prohibited.' });
        }
        
        await pool.query(
            'INSERT INTO results (exam_id, student_id, score, script_path) VALUES (?, ?, ?, ?)',
            [exam_id, student_id, 0, script_path]
        );
        
        res.json({ message: 'Exam script submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getSubmissions = async (req, res) => {
    try {
        const teacherId = req.user.id;
        
        const [submissions] = await pool.query(`
            SELECT 
                r.id as result_id,
                r.exam_id,
                e.title as exam_title,
                c.name as class_name,
                r.student_id,
                u.name as student_name,
                r.score,
                r.script_path
            FROM results r
            JOIN exams e ON r.exam_id = e.id
            JOIN classes c ON e.class_id = c.id
            JOIN users u ON r.student_id = u.id
            WHERE c.teacher_id = ?
            ORDER BY r.id DESC
        `, [teacherId]);

        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
