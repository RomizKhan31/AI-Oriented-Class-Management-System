const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initRemoteDB() {
    console.log('Connecting to remote database at:', process.env.DB_HOST);
    try {
        // Connect directly to the specific database provisioned by Aiven
        const pool = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            ssl: { rejectUnauthorized: false } // Required for Aiven managed databases
        });

        // The tables to create
        const tablesSql = `
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('ADMIN', 'STUDENT', 'TEACHER') NOT NULL
            );

            CREATE TABLE IF NOT EXISTS classes (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                schedule_time DATETIME NOT NULL,
                teacher_id VARCHAR(50) NOT NULL,
                meeting_link VARCHAR(255),
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS enrollments (
                class_id VARCHAR(50) NOT NULL,
                student_id VARCHAR(50) NOT NULL,
                PRIMARY KEY (class_id, student_id),
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id VARCHAR(50) NOT NULL,
                student_id VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                status ENUM('PRESENT', 'ABSENT') NOT NULL,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS exams (
                id VARCHAR(50) PRIMARY KEY,
                class_id VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                details TEXT,
                exam_content VARCHAR(500),
                duration_minutes INT DEFAULT 60,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                exam_id VARCHAR(50) NOT NULL,
                student_id VARCHAR(50) NOT NULL,
                score DECIMAL(5,2) NOT NULL,
                FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS communications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id VARCHAR(50) NOT NULL,
                receiver_id VARCHAR(50) NULL,
                message TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;

        console.log('Creating tables...');
        // Split and execute statements
        const statements = tablesSql.split(';').filter(stmt => stmt.trim() !== '');
        for (let stmt of statements) {
            await pool.query(stmt);
        }
        
        console.log('Tables created. Inserting Demo users...');
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash('password', 10);
        
        await pool.query("INSERT IGNORE INTO users (id, name, email, password_hash, role) VALUES ('A01', 'Admin Super', 'a@demo.com', ?, 'ADMIN')", [hash]);
        await pool.query("INSERT IGNORE INTO users (id, name, email, password_hash, role) VALUES ('T01', 'Demo Teacher', 't@demo.com', ?, 'TEACHER')", [hash]);
        await pool.query("INSERT IGNORE INTO users (id, name, email, password_hash, role) VALUES ('S01', 'Demo Student', 's@demo.com', ?, 'STUDENT')", [hash]);
        
        console.log('Remote Database completely initialized!');
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Error initializing remote database. Ensure your credentials are correct in the .env file:', error.message);
        process.exit(1);
    }
}

initRemoteDB();
