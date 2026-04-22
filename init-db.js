const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        const sql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
        
        console.log('Executing database initialization...');
        await connection.query(sql);
        console.log('Database initialized successfully.');
        
        // Let's also create the demo credentials mentioned in index.html
        await connection.query('USE smart_class_db');
        
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash('password', 10);
        
        await connection.query("INSERT IGNORE INTO users (id, name, email, password_hash, role) VALUES ('A01', 'Admin Super', 'a@demo.com', ?, 'ADMIN')", [hash]);
        await connection.query("INSERT IGNORE INTO users (id, name, email, password_hash, role) VALUES ('T01', 'Demo Teacher', 't@demo.com', ?, 'TEACHER')", [hash]);
        await connection.query("INSERT IGNORE INTO users (id, name, email, password_hash, role) VALUES ('S01', 'Demo Student', 's@demo.com', ?, 'STUDENT')", [hash]);
        
        console.log('Demo users inserted.');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initDB();
