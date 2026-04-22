const pool = require('../config/db');

exports.getSystemUsers = async (req, res) => {
    try {
        // Fetch all users except Admin itself to monitor activity
        const [users] = await pool.query(`
            SELECT id, name, email, role 
            FROM users 
            WHERE role != 'ADMIN'
            ORDER BY role, name ASC
        `);

        // We will fetch aggregated data for each user
        for (let user of users) {
            if (user.role === 'TEACHER') {
                const [classes] = await pool.query('SELECT COUNT(*) as count FROM classes WHERE teacher_id = ?', [user.id]);
                user.activity_metric = `${classes[0].count} Classes Taught`;
            } else if (user.role === 'STUDENT') {
                const [enrollments] = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?', [user.id]);
                user.activity_metric = `${enrollments[0].count} Enrollments`;
            }
        }

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // The foreign keys have ON DELETE CASCADE, so deleting the user deletes all their child records
        await pool.query('DELETE FROM users WHERE id = ? AND role != "ADMIN"', [id]);
        res.json({ message: 'User Terminated Successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
