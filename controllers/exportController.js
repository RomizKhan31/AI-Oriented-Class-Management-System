const pool = require('../config/db');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit-table');
const path = require('path');

exports.exportClassReport = async (req, res) => {
    try {
        const { class_id } = req.params;
        const format = req.query.format || 'csv';
        
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

        // Process data into JSON array for easy consumption
        const dataArray = students.map(s => {
            let present = attendance.filter(a => a.student_id === s.id && a.status === 'PRESENT').length;
            let absent = attendance.filter(a => a.student_id === s.id && a.status === 'ABSENT').length;
            
            let row = {
                "Student ID": s.id,
                "Name": s.name,
                "Email": s.email,
                "Total Present": present,
                "Total Absent": absent
            };
            
            exams.forEach(e => {
                const res = results.find(r => r.student_id === s.id && r.exam_id === e.id);
                row[`Exam: ${e.title}`] = res ? res.score : 'N/A';
            });
            
            return row;
        });

        if (format === 'excel') {
            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.json_to_sheet(dataArray);
            xlsx.utils.book_append_sheet(wb, ws, "Class Report");
            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
            
            res.setHeader('Content-Disposition', `attachment; filename="class_${class_id}_report.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(buffer);
        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            res.setHeader('Content-Disposition', `attachment; filename="class_${class_id}_report.pdf"`);
            res.setHeader('Content-Type', 'application/pdf');
            doc.pipe(res);

            const logoPath = path.join(__dirname, '../public/img/logo.png');
            try {
                doc.image(logoPath, (doc.page.width - 80) / 2, doc.y, { width: 80 });
                doc.moveDown(5);
            } catch (e) {
                console.error("Logo not found or could not be loaded:", e);
            }

            // Official Header
            doc.font('Helvetica-Bold').fontSize(18).text('Mawlana Bhashani Science and Technology University', { align: 'center' });
            doc.font('Helvetica').fontSize(14).text('Department of ICT', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Official Class Report - Class ID: ${class_id}`, { align: 'center' });
            doc.moveDown();

            // Prepare table data
            const headers = Object.keys(dataArray[0]);
            const rows = dataArray.map(obj => Object.values(obj).map(String));

            const table = {
                headers,
                rows
            };

            await doc.table(table, { 
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
                prepareRow: (row, i) => doc.font("Helvetica").fontSize(8)
            });

            doc.end();
            return;
        }

        // Fallback to CSV
        let csv = Object.keys(dataArray[0]).join(',') + '\\n';
        dataArray.forEach(row => {
            csv += Object.values(row).join(',') + '\\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="class_${class_id}_report.csv"`);
        res.send(csv);

    } catch (error) {
        console.error("Export Error:", error);
        res.status(500).send('Server Error generating report');
    }
};

exports.exportGlobalReport = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const [users] = await pool.query('SELECT id, name, email, role FROM users WHERE role != "ADMIN" ORDER BY role ASC');
        
        let dataArray = [];
        
        for (let user of users) {
            let actions = 0;
            if (user.role === 'TEACHER') {
                const [c] = await pool.query('SELECT COUNT(*) as cnt FROM classes WHERE teacher_id = ?', [user.id]);
                actions = c[0].cnt;
            } else if (user.role === 'STUDENT') {
                const [e] = await pool.query('SELECT COUNT(*) as cnt FROM enrollments WHERE student_id = ?', [user.id]);
                actions = e[0].cnt;
            }
            
            dataArray.push({
                "User ID": user.id,
                "Name": user.name,
                "Email": user.email,
                "Role": user.role,
                "Total Relevant Actions": actions
            });
        }

        if (format === 'excel') {
            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.json_to_sheet(dataArray);
            xlsx.utils.book_append_sheet(wb, ws, "Global Report");
            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
            
            res.setHeader('Content-Disposition', `attachment; filename="Platform_Global_Report.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(buffer);
        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            res.setHeader('Content-Disposition', `attachment; filename="Platform_Global_Report.pdf"`);
            res.setHeader('Content-Type', 'application/pdf');
            doc.pipe(res);

            const logoPath = path.join(__dirname, '../public/img/logo.png');
            try {
                doc.image(logoPath, (doc.page.width - 80) / 2, doc.y, { width: 80 });
                doc.moveDown(5);
            } catch (e) {
                console.error("Logo not found or could not be loaded:", e);
            }

            // Official Header
            doc.font('Helvetica-Bold').fontSize(18).text('Mawlana Bhashani Science and Technology University', { align: 'center' });
            doc.font('Helvetica').fontSize(14).text('Department of ICT', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Official Platform Global Surveillance Report`, { align: 'center' });
            doc.moveDown();

            // Prepare table data
            if(dataArray.length > 0) {
                const headers = Object.keys(dataArray[0]);
                const rows = dataArray.map(obj => Object.values(obj).map(String));

                const table = {
                    headers,
                    rows
                };

                await doc.table(table, { 
                    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
                    prepareRow: (row, i) => doc.font("Helvetica").fontSize(8)
                });
            } else {
                doc.text("No users found on platform.");
            }

            doc.end();
            return;
        }

        // Fallback to CSV
        let csv = Object.keys(dataArray[0]).join(',') + '\\n';
        dataArray.forEach(row => {
            csv += Object.values(row).join(',') + '\\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="Platform_Global_Report.csv"');
        res.send(csv);

    } catch (error) {
        console.error("Export Error:", error);
        res.status(500).send('Server Error generating global report');
    }
};
