const agentModel = require('../models/agent');
const deepseekService = require('./deepseek');
const DEFAULT_CONVERSATION_TITLE = '新对话';
const MAX_CONVERSATION_TITLE_LENGTH = 50;

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

async function sendMessage(userId, conversationId, content, options = {}) {
    const { signal, onStart, onDelta } = options;
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

        const conversationTitle =
        history.length === 0
            ? buildConversationTitle(content)
            : null;

        const userMessage = {
            role: 'user',
            content: content.trim()
        };

        const modelMessages = [
            {
                role: 'system',
                content:
                    '你是内容运营助手，请用中文回复。' +
                    '默认简洁回答，用户明确要求详细说明时再展开。' +
                    '目前尚未接入文章查询和保存工具，' +
                    '不要声称已经查询数据库或保存文章。'
            },
            ...history,
            userMessage
        ];

        let result;

        if (typeof onDelta === 'function') {
            signal?.throwIfAborted();

            await onStart?.();

            let fullContent = '';

            for await (
                const text of deepseekService.generateReplyStream(
                    modelMessages,
                    { signal }
                )
            ) {
                fullContent += text;
                await onDelta(text);
            }

            result = {
                data: {
                    role: 'assistant',
                    content: fullContent
                }
            };
        } else {
            result = await deepseekService.generateReply(modelMessages);
        }
        if (result.error) {
            return result;
        }

        signal?.throwIfAborted();

        await agentModel.saveExchange(
            conversationId,
            userMessage,
            result.data,
            conversationTitle
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

async function getConversations(userId) {
    const conversations =
        await agentModel.findConversationsByUser(userId);

    return {
        data: conversations
    };
}

async function getConversationMessages(
    userId,
    conversationId
) {
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

    const messages =
        await agentModel.findConversationMessages(
            conversationId
        );

    return {
        data: {
            conversationId: conversation.id,
            title: conversation.title,
            messages
        }
    };
}

function buildConversationTitle(content) {
    const normalizedContent =
        content.replace(/\s+/g, ' ').trim();

    const characters = Array.from(
        normalizedContent
    );

    if (
        characters.length <=
        MAX_CONVERSATION_TITLE_LENGTH
    ) {
        return normalizedContent;
    }

    return (
        characters
            .slice(
                0,
                MAX_CONVERSATION_TITLE_LENGTH - 1
            )
            .join('') + '…'
    );
}

async function deleteConversation(
    userId,
    conversationId
) {
    if (
        processingConversations.has(conversationId)
    ) {
        return {
            status: 409,
            error: '当前会话正在回复，暂时无法删除'
        };
    }

    processingConversations.add(conversationId);

    try {
        const deleted =
            await agentModel.deleteConversationByUser(
                conversationId,
                userId
            );

        if (!deleted) {
            return {
                status: 404,
                error: '会话不存在或无权删除'
            };
        }

        return {
            data: {
                conversationId
            }
        };
    } finally {
        processingConversations.delete(
            conversationId
        );
    }
}

module.exports = {
    createConversation,
    sendMessage,
    getLatestConversation,
    getConversations,
    getConversationMessages,
    deleteConversation
};