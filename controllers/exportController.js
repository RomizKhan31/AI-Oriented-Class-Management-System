const pool = require('../config/db');

exports.exportClassReport = async (req, res) => {
    try {
        const { class_id } = req.params;
        
        // Fetch students enrolled
        const [students] = await pool.query(`
            SELECT u.id, u.name, u.email 
            FROM enrollments e 
            JOIN users u ON e.student_id = u.id 
            WHERE e.class_id = ?
        `, [class_id]);

        if (students.length === 0) {
            return res.status(404).send('No students found for this class.');
        }

        // Fetch attendance
        const [attendance] = await pool.query('SELECT * FROM attendance WHERE class_id = ?', [class_id]);
        
        // Fetch exams and results
        const [exams] = await pool.query('SELECT * FROM exams WHERE class_id = ?', [class_id]);
        const [results] = await pool.query(`
            SELECT r.* FROM results r 
            JOIN exams e ON r.exam_id = e.id 
            WHERE e.class_id = ?
        `, [class_id]);

        // Generate CSV Header
        let csv = 'Student ID,Name,Email,Total Present,Total Absent';
        exams.forEach(e => {
            csv += `,Exam: ${e.title}`;
        });
        csv += '\\n';

        // Process rows
        students.forEach(s => {
            let present = attendance.filter(a => a.student_id === s.id && a.status === 'PRESENT').length;
            let absent = attendance.filter(a => a.student_id === s.id && a.status === 'ABSENT').length;
            
            let row = `${s.id},${s.name},${s.email},${present},${absent}`;
            
            exams.forEach(e => {
                const res = results.find(r => r.student_id === s.id && r.exam_id === e.id);
                row += `,${res ? res.score : 'N/A'}`;
            });
            
            csv += row + '\\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="class_${class_id}_report.csv"`);
        res.send(csv);

    } catch (error) {
        res.status(500).send('Server Error generating report');
    }
};

exports.exportGlobalReport = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, name, email, role FROM users WHERE role != "ADMIN" ORDER BY role ASC');
        let csv = 'User ID,Name,Email,Role,Total Relevant Actions\\n';

        for (let user of users) {
            let actions = 0;
            if (user.role === 'TEACHER') {
                const [c] = await pool.query('SELECT COUNT(*) as cnt FROM classes WHERE teacher_id = ?', [user.id]);
                actions = c[0].cnt;
            } else if (user.role === 'STUDENT') {
                const [e] = await pool.query('SELECT COUNT(*) as cnt FROM enrollments WHERE student_id = ?', [user.id]);
                actions = e[0].cnt;
            }
            csv += `${user.id},${user.name},${user.email},${user.role},${actions}\\n`;
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="Platform_Global_Report.csv"');
        res.send(csv);
    } catch (error) {
        res.status(500).send('Server Error generating global report');
    }
};
