const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.registerStudent = async (req, res) => {
    try {
        const { id, name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const [existing] = await pool.query('SELECT * FROM users WHERE email = ? OR id = ?', [email, id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email or ID already exists.' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Generate ID if not provided manually
        const studentId = id || `S${Date.now()}`;

        await pool.query(
            'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [studentId, name, email, passwordHash, 'STUDENT']
        );

        res.status(201).json({ message: 'Student registered successfully', userId: studentId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.registerTeacher = async (req, res) => {
    try {
        // Only an Admin can call this
        const { id, name, email, password } = req.body;
        
        if (!id || !name || !email || !password) {
            return res.status(400).json({ message: 'Custom Teacher ID, Name, Email and Password are required.' });
        }

        const [existing] = await pool.query('SELECT * FROM users WHERE email = ? OR id = ?', [email, id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email or Custom ID already exists.' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        await pool.query(
            'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [id, name, email, passwordHash, 'TEACHER']
        );

        res.status(201).json({ message: 'Teacher created successfully', teacherId: id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        
        if (!match) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
