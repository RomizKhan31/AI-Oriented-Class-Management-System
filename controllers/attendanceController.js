const pool = require('../config/db');

exports.markAttendance = async (req, res) => {
    try {
        const { class_id, student_id, status } = req.body;
        const date = new Date().toISOString().split('T')[0];

        const [existing] = await pool.query(
            'SELECT * FROM attendance WHERE class_id = ? AND student_id = ? AND date = ?',
            [class_id, student_id, date]
        );

        if (existing.length > 0) {
            await pool.query(
                'UPDATE attendance SET status = ? WHERE id = ?',
                [status, existing[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO attendance (class_id, student_id, date, status) VALUES (?, ?, ?, ?)',
                [class_id, student_id, date, status]
            );
        }

        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAttendance = async (req, res) => {
    try {
        const { class_id } = req.params;
        
        if (req.user.role === 'TEACHER') {
            const [records] = await pool.query(
                `SELECT e.student_id, u.name as student_name, COALESCE(a.status, 'NOT_MARKED') as status
                 FROM enrollments e
                 JOIN users u ON e.student_id = u.id
                 LEFT JOIN attendance a ON e.student_id = a.student_id AND e.class_id = a.class_id AND a.date = CURDATE()
                 WHERE e.class_id = ?`,
                [class_id]
            );
            return res.json(records);
        } else {
            const [records] = await pool.query(
                'SELECT * FROM attendance WHERE class_id = ? AND student_id = ?',
                [class_id, req.user.id]
            );
            return res.json(records);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
