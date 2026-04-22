const pool = require('../config/db');

exports.createClass = async (req, res) => {
    try {
        const { id, name, schedule_time, meeting_link } = req.body;
        const teacher_id = req.user.id;

        await pool.query(
            'INSERT INTO classes (id, name, schedule_time, teacher_id, meeting_link) VALUES (?, ?, ?, ?, ?)',
            [id, name, schedule_time, teacher_id, meeting_link]
        );

        res.status(201).json({ message: 'Class created', classId: id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getClasses = async (req, res) => {
    try {
        if (req.user.role === 'TEACHER') {
            const [classes] = await pool.query(`
                SELECT c.*, COUNT(e.student_id) as student_count 
                FROM classes c 
                LEFT JOIN enrollments e ON c.id = e.class_id 
                WHERE c.teacher_id = ? 
                GROUP BY c.id 
                ORDER BY c.schedule_time ASC
            `, [req.user.id]);
            return res.json(classes);
        } else {
            // Student
            const [classes] = await pool.query(
                `SELECT c.*, u.name as teacher_name FROM classes c 
                 JOIN enrollments e ON c.id = e.class_id 
                 JOIN users u ON c.teacher_id = u.id
                 WHERE e.student_id = ? ORDER BY c.schedule_time ASC`,
                [req.user.id]
            );
            return res.json(classes);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllClasses = async (req, res) => {
    try {
        // Only accessible by students essentially, retrieve all classes with teacher name
        const [classes] = await pool.query(`
            SELECT c.*, u.name as teacher_name 
            FROM classes c
            JOIN users u ON c.teacher_id = u.id
            ORDER BY c.schedule_time ASC
        `);
        return res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.enroll = async (req, res) => {
    try {
        const { class_id } = req.body;
        const student_id = req.user.id;

        await pool.query(
            'INSERT IGNORE INTO enrollments (class_id, student_id) VALUES (?, ?)',
            [class_id, student_id]
        );
        res.json({ message: 'Enrolled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
