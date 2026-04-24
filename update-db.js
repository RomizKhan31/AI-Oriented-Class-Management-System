const pool = require('./config/db');

async function updateDB() {
    try {
        console.log('Altering results table to add script_path...');
        await pool.query('ALTER TABLE results ADD COLUMN script_path VARCHAR(255) NULL;');
        console.log('Database updated successfully.');
        process.exit(0);
    } catch (error) {
        if(error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists, ignoring.');
            process.exit(0);
        }
        console.error('Error updating database:', error);
        process.exit(1);
    }
}

updateDB();
