const agentModel = require('../models/agent');
const deepseekService = require('./deepseek');
const MAX_CONVERSATION_TITLE_LENGTH = 50;

// UI 每页消息数量（不是问答轮数）；独立于模型上下文的最近 20 条。
const MESSAGE_PAGE_SIZE = 10;

// 当前单 Node 进程内，同一会话一次只处理一条消息。
const processingConversations = new Set();

/**
 * 校验空会话标题并创建会话；用户身份由已认证的 Controller 传入。
 *
 * @param {number} userId - 当前通过身份认证的用户 ID。
 * @param {unknown} title - 待校验的请求标题，只接受非空字符串。
 * @returns {Promise<{data: {id: number, title: string}} | {status: number, error: string}>} 创建成功数据，或带 HTTP 状态码的业务错误。
 */
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

/**
 * 校验消息与会话归属，复用同一业务流程处理普通回复和流式回复。
 * options.signal 控制取消，onStart 开始 SSE，onDelta 转发片段；完整生成后才事务保存。
 * 进程内 Set 防止同一会话的生成和删除重叠，不覆盖多进程部署。
 *
 * @param {number} userId - 当前通过身份认证的用户 ID。
 * @param {number} conversationId - 目标会话的数据库 ID。
 * @param {unknown} content - 待校验的问题文本，只接受 1 到 2000 字符的非空字符串。
 * @param {Object} [options={}] - 可选流式配置；无 onDelta 时使用非流式接口。
 * @param {AbortSignal} [options.signal] - 上游取消信号，在生成和入库前检查。
 * @param {() => (void | Promise<void>)} [options.onStart] - 前置校验完成后、生成前调用，供 Controller 开启 SSE。
 * @param {(text: string) => (void | Promise<void>)} [options.onDelta] - 转发片段的回调，可等待下游背压。
 * @returns {Promise<{data: {conversationId: number, message: {role: 'user' | 'assistant', content: string}}} | {status: number, error: string}>} 完整保存后的回复结果，或校验/非流式模型返回的业务错误。
 * @throws {Error} 流式生成、取消或数据库保存异常向上传播，finally 释放进程内锁。
 */
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

    // 检查与占用之间没有 await；当前单进程事件循环内同步取得会话锁。
    processingConversations.add(conversationId);

    try {
        const history =
            await agentModel.findRecentMessages(conversationId);

        // 只有无已保存历史时才从本次问题生成标题；模型失败不保存问答，也不更新标题。
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
            // 取消是协作式的：开始生成前主动检查；signal 缺省时兼容普通非流式调用。
            // 入库前再检查取消；不能撤销已经开始或已提交的数据库事务。
            signal?.throwIfAborted();

            // 参数、归属和历史读取成功后才开启 SSE，业务校验错误仍能返回普通 HTTP JSON。
            await onStart?.();

            let fullContent = '';

            // 异步生成器逐段产出文字；既累计完整回复供入库，也将片段及时转发给客户端。
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

/**
 * 恢复最近会话的最新一页及游标；无会话返回 data:null，属于正常空状态。
 *
 * @param {number} userId - 当前通过身份认证的用户 ID。
 * @returns {Promise<{data: ({conversationId: number, title: string} & {messages: Array<{id: string, role: 'user' | 'assistant', content: string}>, hasMore: boolean, nextCursor: number | null}) | null}>} 最近会话最新页；没有会话时 data=null。
 */
async function getLatestConversation(userId) {
    const conversation =
        await agentModel.findLatestConversationByUser(userId);

    if (!conversation) {
        return { data: null };
    }

    const page =
        await agentModel.findConversationMessagesPage(
            conversation.id,
            null,
            MESSAGE_PAGE_SIZE
        );

    return {
        data: {
            conversationId: conversation.id,
            title: conversation.title,
            messages: page.messages,
            hasMore: page.hasMore,
            nextCursor: page.nextCursor
        }
    };
}

/**
 * 返回当前用户的所有会话摘要，供历史面板展示。
 *
 * @param {number} userId - 当前通过身份认证的用户 ID。
 * @returns {Promise<{data: Array<{id: number, title: string, createdAt: Date, updatedAt: Date}>}>} 当前用户的会话摘要列表。
 */
async function getConversations(userId) {
    const conversations =
        await agentModel.findConversationsByUser(userId);

    return {
        data: conversations
    };
}

/**
 * 先确认会话归属，再按 beforeId 查询一页；不能直接信任客户端传来的会话 ID。
 *
 * @param {number} userId - 当前通过身份认证的用户 ID。
 * @param {number} conversationId - 目标会话的数据库 ID。
 * @param {number | null} [beforeId=null] - 排他游标，只查询 ID 小于该值的消息；null 取最新页。
 * @returns {Promise<{data: {conversationId: number, title: string} & {messages: Array<{id: string, role: 'user' | 'assistant', content: string}>, hasMore: boolean, nextCursor: number | null}} | {status: number, error: string}>} 归属验证后的历史消息页，或 404 业务错误。
 */
async function getConversationMessages(
    userId,
    conversationId,
    beforeId = null
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



        const page =
        await agentModel.findConversationMessagesPage(
            conversationId,
            beforeId,
            MESSAGE_PAGE_SIZE
        );

    return {
        data: {
            conversationId: conversation.id,
            title: conversation.title,
            messages: page.messages,
            hasMore: page.hasMore,
            nextCursor: page.nextCursor
        }
    };
}

/**
 * 取首问生成最多 50 个 Unicode 码点的标题，折叠空白并截断追加省略号。
 * Array.from 能保留代理对字符，但不等同于按完整 emoji 字形簇截断。
 *
 * @param {string} content - 已校验的首个用户问题。
 * @returns {string} 折叠空白后最多 50 个码点的标题，超长以省略号结尾。
 */
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

/**
 * 与生成操作共用进程内会话锁，删除属于当前用户的会话，最终释放锁。
 * 未命中统一返回 404，不区分不存在和无权限。
 *
 * @param {number} userId - 当前通过身份认证的用户 ID。
 * @param {number} conversationId - 目标会话的数据库 ID。
 * @returns {Promise<{data: {conversationId: number}} | {status: number, error: string}>} 成功返回目标 ID；繁忙返回 409，未命中返回 404。
 */
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

    // 检查与占用之间没有 await；当前单进程事件循环内同步取得会话锁。
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
