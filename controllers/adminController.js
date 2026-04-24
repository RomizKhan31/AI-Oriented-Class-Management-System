const pool = require('../config/db');
const PDFDocument = require('pdfkit-table');
const xlsx = require('xlsx');
const path = require('path');

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

exports.exportUsersPDF = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT id, name, email, role 
            FROM users 
            WHERE role != 'ADMIN'
            ORDER BY role, name ASC
        `);

        // Fetch aggregated data for each user
        for (let user of users) {
            if (user.role === 'TEACHER') {
                const [classes] = await pool.query('SELECT COUNT(*) as count FROM classes WHERE teacher_id = ?', [user.id]);
                user.activity_metric = `${classes[0].count} Classes Taught`;
            } else if (user.role === 'STUDENT') {
                const [enrollments] = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?', [user.id]);
                user.activity_metric = `${enrollments[0].count} Enrollments`;
            } else {
                user.activity_metric = 'N/A';
            }
        }

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        
        res.setHeader('Content-disposition', 'attachment; filename="system_users.pdf"');
        res.setHeader('Content-type', 'application/pdf');
        
        doc.pipe(res);

        const logoPath = path.join(__dirname, '../public/img/logo.png');
        try {
            doc.image(logoPath, (doc.page.width - 80) / 2, doc.y, { width: 80 });
            doc.moveDown(5);
        } catch (e) {
            console.error("Logo not found or could not be loaded:", e);
        }

        doc.font('Helvetica-Bold').fontSize(18).text('Mawlana Bhashani Science and Technology University', { align: 'center' });
        doc.font('Helvetica').fontSize(14).text('Department of ICT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(20).text('System Users Report', { align: 'center' });
        doc.moveDown();

        const table = {
            title: "Registered Users (Excluding Admins)",
            headers: ["ID", "Name", "Email", "Role", "Activity Metric"],
            rows: users.map(u => [u.id.toString(), u.name, u.email, u.role, u.activity_metric])
        };

        await doc.table(table, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: (row, i) => doc.font("Helvetica").fontSize(10)
        });

        doc.end();
    } catch (error) {
        res.status(500).json({ message: 'Server error during PDF export', error: error.message });
    }
};

exports.exportUsersExcel = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT id, name, email, role 
            FROM users 
            WHERE role != 'ADMIN'
            ORDER BY role, name ASC
        `);

        // Fetch aggregated data for each user
        for (let user of users) {
            if (user.role === 'TEACHER') {
                const [classes] = await pool.query('SELECT COUNT(*) as count FROM classes WHERE teacher_id = ?', [user.id]);
                user.activity_metric = `${classes[0].count} Classes Taught`;
            } else if (user.role === 'STUDENT') {
                const [enrollments] = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?', [user.id]);
                user.activity_metric = `${enrollments[0].count} Enrollments`;
            } else {
                user.activity_metric = 'N/A';
            }
        }

        const worksheet = xlsx.utils.json_to_sheet(users);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "System Users");

        const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-disposition', 'attachment; filename="system_users.xlsx"');
        res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);

    } catch (error) {
        res.status(500).json({ message: 'Server error during Excel export', error: error.message });
    }
};
