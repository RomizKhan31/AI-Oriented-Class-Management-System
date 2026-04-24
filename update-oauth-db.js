const pool = require('./config/db');

async function updateDB() {
    try {
        console.log('Altering users table to support OAuth...');
        await pool.query('ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;');
        
        try {
            await pool.query('ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT \'LOCAL\';');
        } catch (e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
        
        try {
            await pool.query('ALTER TABLE users ADD COLUMN provider_id VARCHAR(255) NULL;');
        } catch (e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
        
        console.log('Database updated successfully for OAuth support.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating database:', error);
        process.exit(1);
    }
}

updateDB();
