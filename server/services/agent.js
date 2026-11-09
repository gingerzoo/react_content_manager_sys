const agentModel = require('../models/agent');
const deepseekService = require('./deepseek');

// 当前单 Node 进程内，同一会话一次只处理一条消息。
const processingConversations = new Set();

async function createConversation(userId, title) {
    if (typeof title !== 'string') {
        return {
            status: 400,
            error: '对话标题必须是字符串'
        };
    }

    const normalizedTitle = title.trim();

    if (
        normalizedTitle.length === 0 ||
        normalizedTitle.length > 100
    ) {
        return {
            status: 400,
            error: '对话标题需要为 1–100 个字符'
        };
    }

    const conversation =
        await agentModel.createConversation(
            userId,
            normalizedTitle
        );

    return { data: conversation };
}

async function sendMessage(userId, conversationId, content) {
    if (
        typeof content !== 'string' ||
        !content.trim() ||
        content.length > 2000
    ) {
        return {
            status: 400,
            error: '消息需要为 1–2000 个字符'
        };
    }

    const conversation =
        await agentModel.findConversationByUser(
            conversationId,
            userId
        );

    if (!conversation) {
        return {
            status: 404,
            error: '会话不存在或无权访问'
        };
    }

    if (processingConversations.has(conversationId)) {
        return {
            status: 409,
            error: '当前会话正在回复，请稍后再发送'
        };
    }

    processingConversations.add(conversationId);

    try {
        const history =
            await agentModel.findRecentMessages(conversationId);

        const userMessage = {
            role: 'user',
            content: content.trim()
        };

        const result = await deepseekService.generateReply([
            {
                role: 'system',
                content:
                    '你是内容运营助手，请用中文回复。' +
                    '目前尚未接入文章查询和保存工具，' +
                    '不要声称已经查询数据库或保存文章。'
            },
            ...history,
            userMessage
        ]);

        if (result.error) {
            return result;
        }

        await agentModel.saveExchange(
            conversationId,
            userMessage,
            result.data
        );

        return {
            data: {
                conversationId,
                message: result.data
            }
        };
    } finally {
        processingConversations.delete(conversationId);
    }
}

async function getLatestConversation(userId) {
    const conversation =
        await agentModel.findLatestConversationByUser(userId);

    if (!conversation) {
        return { data: null };
    }

    const messages =
        await agentModel.findConversationMessages(
            conversation.id
        );

    return {
        data: {
            conversationId: conversation.id,
            title: conversation.title,
            messages
        }
    };
}



module.exports = {
    createConversation,
    sendMessage,
    getLatestConversation
};