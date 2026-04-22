const pool = require('../config/db');

exports.sendMessage = async (req, res) => {
    try {
        const { receiver_id, message } = req.body;
        const sender_id = req.user.id;
        
        // If receiver_id is null, it's treated as a global announcement for the enrolled classes. 
        // For simplicity, we just store it as NULL.

        await pool.query(
            'INSERT INTO communications (sender_id, receiver_id, message) VALUES (?, ?, ?)',
            [sender_id, receiver_id || null, message]
        );

        res.json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getInbox = async (req, res) => {
    try {
        const userId = req.user.id;
        // Fetch direct messages (receiver_id = me) or global announcements (receiver_id IS NULL)
        const [messages] = await pool.query(`
            SELECT com.*, u.name as sender_name, u.role as sender_role
            FROM communications com
            JOIN users u ON com.sender_id = u.id
            WHERE com.receiver_id = ? OR com.receiver_id IS NULL
            ORDER BY com.timestamp DESC
        `, [userId]);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
