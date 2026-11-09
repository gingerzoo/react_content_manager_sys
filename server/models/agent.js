const pool = require('../db');

async function createConversation(userId, title) {
    const [result] = await pool.execute(
        `INSERT INTO agent_conversations (user_id, title)
         VALUES (?, ?)`,
        [userId, title]
    );

    return {
        id: result.insertId,
        title
    };
}

async function findConversationByUser(conversationId, userId) {
    const [rows] = await pool.execute(
        `SELECT id, title
         FROM agent_conversations
         WHERE id = ? AND user_id = ?`,
        [conversationId, userId]
    );

    return rows[0] || null;
}

async function findRecentMessages(conversationId) {
    const [rows] = await pool.execute(
        `SELECT message
         FROM agent_messages
         WHERE conversation_id = ?
         ORDER BY id DESC
         LIMIT 20`,
        [conversationId]
    );

    return rows.reverse().map(row =>
        typeof row.message === 'string'
            ? JSON.parse(row.message)
            : row.message
    );
}

async function saveExchange(
    conversationId,
    userMessage,
    assistantMessage
) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.execute(
            `INSERT INTO agent_messages (conversation_id, message)
             VALUES (?, ?), (?, ?)`,
            [
                conversationId,
                JSON.stringify(userMessage),
                conversationId,
                JSON.stringify(assistantMessage)
            ]
        );

        await connection.execute(
            `UPDATE agent_conversations
             SET updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [conversationId]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function findLatestConversationByUser(userId) {
    const [rows] = await pool.execute(
        `SELECT id, title
         FROM agent_conversations
         WHERE user_id = ?
         ORDER BY updated_at DESC, id DESC
         LIMIT 1`,
        [userId]
    );

    return rows[0] || null;
}

async function findConversationMessages(conversationId) {
    const [rows] = await pool.execute(
        `SELECT id, message
         FROM agent_messages
         WHERE conversation_id = ?
         ORDER BY id ASC`,
        [conversationId]
    );

    return rows
        .map(row => {
            const storedMessage =
                typeof row.message === 'string'
                    ? JSON.parse(row.message)
                    : row.message;

            return {
                id: String(row.id),
                role: storedMessage.role,
                content: storedMessage.content
            };
        })
        .filter(item =>
            (item.role === 'user' || item.role === 'assistant') &&
            typeof item.content === 'string'
        );
}


module.exports = {
    createConversation,
    findConversationByUser,
    findRecentMessages,
    saveExchange,
    findLatestConversationByUser,
    findConversationMessages
};