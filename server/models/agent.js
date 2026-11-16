const pool = require('../db');

/**
 * 创建会话记录并返回插入 ID；尚不创建任何消息。
 *
 * @param {number} userId - 当前通过身份认证的用户 ID。
 * @param {string} title - 已校验的初始标题。
 * @returns {Promise<{id: number, title: string}>} 新插入会话的 ID 和标题。
 */
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

/**
 * 通过会话 ID 和用户 ID 同时查询归属；不存在或属于他人时统一返回 null。
 *
 * @param {number} conversationId - 目标会话的数据库 ID。
 * @param {number} userId - 当前通过身份认证的用户 ID。
 * @returns {Promise<{id: number, title: string} | null>} 命中且归属匹配的会话；否则返回 null。
 */
async function findConversationByUser(conversationId, userId) {
    const [rows] = await pool.execute(
        `SELECT id, title
         FROM agent_conversations
         WHERE id = ? AND user_id = ?`,
        [conversationId, userId]
    );

    return rows[0] || null;
}

/**
 * 取最近 20 条模型上下文并恢复时间顺序；独立于 UI 分页，不加载全部历史。
 *
 * @param {number} conversationId - 目标会话的数据库 ID。
 * @returns {Promise<Array<{role: 'user' | 'assistant', content: string}>>} 最近 20 条上下文，按旧到新排序；保留数据库消息对象。
 */
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

/**
 * 用同一数据库连接事务保存一轮用户/助手消息，并更新标题和会话时间。
 * conversationTitle 为首问生成的标题或 null；失败回滚，finally 将连接归还连接池。
 *
 * @param {number} conversationId - 目标会话的数据库 ID。
 * @param {{role: 'user', content: string}} userMessage - 本轮完整用户消息。
 * @param {{role: 'assistant', content: string}} assistantMessage - 模型完整成功回复。
 * @param {string | null} conversationTitle - 首问标题；非第一轮传 null，保留原标题。
 * @returns {Promise<void>} 事务提交完成后兑现；无返回数据。
 * @throws {Error} 获取连接或 SQL 执行失败时向上传播；事务开始后的错误会尝试回滚。
 */
async function saveExchange(
    conversationId,
    userMessage,
    assistantMessage,
    conversationTitle
) {
    // 事务内的 SQL 必须使用这一条连接，不能改回 pool.execute，否则可能落到不同连接。
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

        // 只有默认标题且传入首问标题时才改名；标题更新与消息插入同成同败。
        await connection.execute(
            `UPDATE agent_conversations
            SET
                title = CASE
                    WHEN title = '新对话'
                        AND ? IS NOT NULL
                    THEN ?
                    ELSE title
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                conversationTitle,
                conversationTitle,
                conversationId
            ]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        // 归还连接池，不是关闭整个 pool；异常路径也必须释放，避免耗尽连接。
        connection.release();
    }
}

/**
 * 查询当前用户最近活动的会话；更新时间相同时按 ID 倒序保证稳定排序。
 *
 * @param {number} userId - 当前通过身份认证的用户 ID。
 * @returns {Promise<{id: number, title: string} | null>} 最近活动会话，没有会话返回 null。
 */
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

/**
 * 完整历史查询，保留兼容用途；界面分页应使用 findConversationMessagesPage。
 * 调用方必须先验证会话归属；只返回当前 UI 支持的 user/assistant 文本消息。
 *
 * @param {number} conversationId - 目标会话的数据库 ID。
 * @returns {Promise<Array<{id: string, role: string, content: string}>>} 旧到新排列的全部可展示消息；调用前需验证会话归属。
 */
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

/**
 * 仅查询当前用户会话摘要，按最近活动排序，用于历史下拉列表。
 *
 * @param {number} userId - 当前通过身份认证的用户 ID。
 * @returns {Promise<Array<{id: number, title: string, createdAt: Date, updatedAt: Date}>>} 按最近活动排序的摘要；Date 经 HTTP JSON 序列化后变为字符串。
 */
async function findConversationsByUser(userId) {
    const [rows] = await pool.execute(
        `SELECT
            id,
            title,
            created_at AS createdAt,
            updated_at AS updatedAt
         FROM agent_conversations
         WHERE user_id = ?
         ORDER BY updated_at DESC, id DESC`,
        [userId]
    );

    return rows;
}

/**
 * 归属条件直接写入 DELETE，避免删除他人数据；affectedRows 判断是否命中。
 * agent_messages 的 ON DELETE CASCADE 会在删除会话时级联删除消息。
 *
 * @param {number} conversationId - 目标会话的数据库 ID。
 * @param {number} userId - 当前通过身份认证的用户 ID。
 * @returns {Promise<boolean>} 删除至少一条记录返回 true；未命中返回 false。
 */
async function deleteConversationByUser(
    conversationId,
    userId
) {
    const [result] = await pool.execute(
        `DELETE FROM agent_conversations
         WHERE id = ? AND user_id = ?`,
        [conversationId, userId]
    );

    return result.affectedRows > 0;
}

/**
 * 以 beforeId 为排他游标查询更早消息；null 表示最新页。
 * 多取一条判断 hasMore，再将实际返回页反转为旧到新；无需 OFFSET 或 COUNT。
 *
 * @param {number} conversationId - 目标会话的数据库 ID。
 * @param {number | null} beforeId - 排他游标；null 查询最新页。
 * @param {number} pageSize - 每页条数，整数范围 1 到 100；实际多查询一条。
 * @returns {Promise<{messages: Array<{id: string, role: 'user' | 'assistant', content: string}>, hasMore: boolean, nextCursor: number | null}>} 按旧到新排列的消息页；无下一页时 nextCursor=null。
 * @throws {TypeError} 分页数量不是允许范围内的整数时抛出。
 */
async function findConversationMessagesPage(
    conversationId,
    beforeId,
    pageSize
) {
    // 只拼接服务端预定义的 SQL 片段；实际会话 ID、游标始终通过占位符绑定。
    const cursorSql =
        beforeId === null
            ? ''
            : 'AND id < ?';

    const params = [conversationId];

    if (beforeId !== null) {
        params.push(beforeId);
    }

    // 多查一条，用来判断是否还有下一页。
    const queryLimit = pageSize + 1;

    // 当前环境 LIMIT ? 的 execute 绑定出现过 ER_WRONG_ARGUMENTS，故插入校验后的整数。
    // 绝不能将未经校验的请求字符串直接拼入 LIMIT。
    if (
        !Number.isSafeInteger(queryLimit) ||
        queryLimit <= 1 ||
        queryLimit > 101
    ) {
        throw new TypeError('消息分页大小不正确');
    }

    const [rows] = await pool.execute(
        `SELECT id, message
         FROM agent_messages
         WHERE conversation_id = ?
         ${cursorSql}
         ORDER BY id DESC
         LIMIT ${queryLimit}`,
        params
    );

    const hasMore = rows.length > pageSize;

    // 真正返回的消息仍然只有 pageSize 条。
    const pageRows = hasMore
        ? rows.slice(0, pageSize)
        : rows;

    // 此时 pageRows 还是倒序，最后一项是本页最小 ID。
    const nextCursor =
        hasMore && pageRows.length > 0
            ? Number(
                pageRows[pageRows.length - 1].id
            )
            : null;

    // 数据库为了获取最新消息使用倒序查询，
    // 返回前端前再恢复成旧消息在上、新消息在下。
    const messages = pageRows
        .reverse()
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
            (
                item.role === 'user' ||
                item.role === 'assistant'
            ) &&
            typeof item.content === 'string'
        );

    return {
        messages,
        hasMore,
        nextCursor
    };
}


module.exports = {
    createConversation,
    findConversationByUser,
    findRecentMessages,
    saveExchange,
    findLatestConversationByUser,
    findConversationMessages,
    findConversationsByUser,
    deleteConversationByUser,
    findConversationMessagesPage,
};
