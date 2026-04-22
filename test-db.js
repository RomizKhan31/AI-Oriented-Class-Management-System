require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const uri = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?ssl-mode=REQUIRED`;
        console.log("Connecting with URI:", uri.replace(process.env.DB_PASSWORD, '****'));
        const pool = mysql.createPool({
            uri: uri,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const [rows] = await pool.query('SHOW TABLES;');
        console.log("Tables in database:", rows);
        
        process.exit(0);
    } catch (error) {
        console.error("Database connection error:", error.message);
        process.exit(1);
    }
}

testConnection();
