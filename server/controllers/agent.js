const agentService = require('../services/agent');
const { once } = require('node:events');

/**
 * 处理 POST 创建请求；规范请求体，将认证用户 ID 传给 Service，成功返回 201。
 *
 * @param {import("express").Request & {user: {id: number}}} req - 请求对象；认证中间件已设置 req.user，路径/查询/请求体按接口读取。
 * @param {import("express").Response} res - Express 响应对象，写入 JSON 或 SSE 响应。
 * @param {import("express").NextFunction} next - 异常时交给统一错误处理中间件。
 * @returns {Promise<import("express").Response | undefined>} 已写入的 JSON Response；异常调用 next 后返回 undefined。
 */
async function createConversation(req, res, next) {
    try {
        const body = req.body ?? {};

        if (
            typeof body !== 'object' ||
            Array.isArray(body)
        ) {
            return res.status(400).json({
                code: 400,
                message: '请求参数格式不正确'
            });
        }

        const { title = '新对话' } = body;

        const result =
            await agentService.createConversation(
                req.user.id,
                title
            );

        if (result.error) {
            return res.status(result.status).json({
                code: result.status,
                message: result.error
            });
        }

        return res.status(201).json({
            code: 201,
            message: '创建会话成功',
            data: result.data
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 处理非流式发送：验证路径 ID，将完整业务结果转换为 JSON，异常交给统一错误中间件。
 *
 * @param {import("express").Request & {user: {id: number}}} req - 请求对象；认证中间件已设置 req.user，路径/查询/请求体按接口读取。
 * @param {import("express").Response} res - Express 响应对象，写入 JSON 或 SSE 响应。
 * @param {import("express").NextFunction} next - 异常时交给统一错误处理中间件。
 * @returns {Promise<import("express").Response | undefined>} 已写入的 JSON Response；异常调用 next 后返回 undefined。
 */
async function sendMessage(req, res, next) {
    try {
        const conversationId = Number(req.params.id);

        if (
            !Number.isSafeInteger(conversationId) ||
            conversationId <= 0 ||
            conversationId > 2147483647
        ) {
            return res.status(400).json({
                code: 400,
                message: '会话 ID 不正确'
            });
        }

        const result = await agentService.sendMessage(
            req.user.id,
            conversationId,
            req.body?.content
        );

        if (result.error) {
            return res.status(result.status).json({
                code: result.status,
                message: result.error
            });
        }

        return res.json({
            code: 200,
            message: '回复成功',
            data: result.data
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 处理认证后的 POST SSE 请求；连接关闭或总超时后尝试取消上游生成。
 * 发出响应头前可以返回 HTTP 错误，发头后只能通过 SSE error 通知客户端。
 *
 * @param {import("express").Request & {user: {id: number}}} req - 请求对象；认证中间件已设置 req.user，路径/查询/请求体按接口读取。
 * @param {import("express").Response} res - Express 响应对象，写入 JSON 或 SSE 响应。
 * @param {import("express").NextFunction} next - 异常时交给统一错误处理中间件。
 * @returns {Promise<import("express").Response | undefined>} 前置校验错误返回 JSON Response；流式成功或已断开时无返回值。
 */
async function sendMessageStream(req, res, next) {
    const conversationId = Number(req.params.id);

    if (
        !Number.isSafeInteger(conversationId) ||
        conversationId <= 0 ||
        conversationId > 2147483647
    ) {
        return res.status(400).json({
            code: 400,
            message: '会话 ID 不正确'
        });
    }

    // 这是服务端独立控制器：浏览器断连或超时通过它中断 SDK，不是浏览器对象本身。
    const controller = new AbortController();
    let timedOut = false;

    // 限制这一轮流式处理的总时间。
    const timer = setTimeout(() => {
        // 总时限覆盖整轮处理；abort 不能撤销已经提交的数据库事务。
        timedOut = true;
        controller.abort();
    }, 60000);

    /**
     * 响应在正常 end 前关闭时取消生成；正常完成的连接关闭不作为用户中断。
     *
     * 无入参；所需上下文从闭包或模块作用域读取。
     * @returns {void} 未正常结束时取消上游任务，不向关闭的连接写入数据。
     */
    const handleClose = () => {
        if (!res.writableEnded) {
            controller.abort();
        }
    };

    res.on('close', handleClose);

    /**
     * 将事件名和 JSON 数据编码成 SSE 帧；每帧以空行结束。
     * 响应缓冲区满时等待 drain，配合取消信号实现背压，避免无限堆积片段。
     *
     * @param {string} event - SSE 事件名，例如 start、delta 或 done。
     * @param {unknown} data - 可 JSON 序列化的事件载荷。
     * @returns {Promise<void>} 帧写入缓冲区且必要的 drain 等待结束后兑现；不表示客户端已收到。
     * @throws {Error} 已取消、连接关闭或等待背压失败时抛出。
     */
    const writeEvent = async (event, data) => {
        controller.signal.throwIfAborted();

        if (res.destroyed || res.writableEnded) {
            throw new Error('客户端连接已关闭');
        }

        const canContinue = res.write(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        );

        if (!canContinue) {
            await once(res, 'drain', {
                signal: controller.signal
            });
        }
    };

    try {
        const result = await agentService.sendMessage(
            req.user.id,
            conversationId,
            req.body?.content,
            {
                signal: controller.signal,

                /**
                 * Service 完成前置校验后调用；flushHeaders 让浏览器立即进入流式读取。
                 *
                 * 无入参；所需上下文从闭包或模块作用域读取。
                 * @returns {Promise<void>} SSE 响应头发出且 start 事件写入后兑现。
                 */
                onStart: async () => {
                    res.status(200);
                    res.setHeader(
                        'Content-Type',
                        'text/event-stream; charset=utf-8'
                    );
                    res.setHeader(
                        'Cache-Control',
                        'no-cache, no-transform'
                    );
                    // 提示支持该响应头的反向代理不要缓冲；代理最终行为仍取决于部署配置。
                    res.setHeader('X-Accel-Buffering', 'no');

                    res.flushHeaders();

                    await writeEvent('start', {
                        conversationId
                    });
                },

                /**
                 * 处理 onDelta 对应的操作。
                 *
                 * @param {string} text - 上游生成器产出的增量文字。
                 * @returns {Promise<void>} delta 事件完成写入和背压等待后兑现。
                 */
                onDelta: text =>
                    writeEvent('delta', { text })
            }
        );

        // 参数、会话归属等错误发生在开始流之前。
        if (result.error) {
            return res.status(result.status).json({
                code: result.status,
                message: result.error
            });
        }

        // Service 已完成问答事务保存后才发送 done；客户端可据此确认本轮完整成功。
        await writeEvent('done', result.data);
        res.end();
    } catch (error) {
        if (res.destroyed || res.writableEnded) return;

        const isTimeout =
            timedOut ||
            error.name === 'APIConnectionTimeoutError';

        const errorMessage = isTimeout
            ? '回复超时，请刷新历史记录后检查'
            : '本次回复未确认完成，请刷新历史记录后检查';

        if (!res.headersSent) {
            if (isTimeout) {
                return res.status(504).json({
                    code: 504,
                    message: errorMessage
                });
            }

            return next(error);
        }

        console.error('流式回复失败：', {
            errorType: error.name,
            errorCode: error.code,
            upstreamStatus: error.status
        });

        // 此处可能已经 abort，不能使用会 throwIfAborted 的 writeEvent；直接发送错误并结束。
        // 若提交已成功但 done 丢失，客户端应查询历史确认，不应盲目自动重发。
        res.write(
            `event: error\ndata: ${JSON.stringify({
                message: errorMessage
            })}\n\n`
        );

        res.end();
    } finally {
        clearTimeout(timer);
        res.off('close', handleClose);
        controller.abort();
    }
}

/**
 * 返回当前认证用户最近会话的最新消息页；data:null 表示没有会话。
 *
 * @param {import("express").Request & {user: {id: number}}} req - 请求对象；认证中间件已设置 req.user，路径/查询/请求体按接口读取。
 * @param {import("express").Response} res - Express 响应对象，写入 JSON 或 SSE 响应。
 * @param {import("express").NextFunction} next - 异常时交给统一错误处理中间件。
 * @returns {Promise<import("express").Response | undefined>} 已写入的 JSON Response；异常调用 next 后返回 undefined。
 */
async function getLatestConversation(req, res, next) {
    try {
        const result =
            await agentService.getLatestConversation(
                req.user.id
            );

        return res.json({
            code: 200,
            message: '获取最近会话成功',
            data: result.data
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 查询当前认证用户的会话摘要；不能从请求参数接收任意 userId。
 *
 * @param {import("express").Request & {user: {id: number}}} req - 请求对象；认证中间件已设置 req.user，路径/查询/请求体按接口读取。
 * @param {import("express").Response} res - Express 响应对象，写入 JSON 或 SSE 响应。
 * @param {import("express").NextFunction} next - 异常时交给统一错误处理中间件。
 * @returns {Promise<import("express").Response | undefined>} 已写入的 JSON Response；异常调用 next 后返回 undefined。
 */
async function getConversations(req, res, next) {
    try {
        const result =
            await agentService.getConversations(
                req.user.id
            );

        return res.json({
            code: 200,
            message: '获取会话列表成功',
            data: result.data
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 校验路径 ID 和可选 beforeId 游标，再由 Service 检查归属并查询消息页。
 *
 * @param {import("express").Request & {user: {id: number}}} req - 请求对象；认证中间件已设置 req.user，路径/查询/请求体按接口读取。
 * @param {import("express").Response} res - Express 响应对象，写入 JSON 或 SSE 响应。
 * @param {import("express").NextFunction} next - 异常时交给统一错误处理中间件。
 * @returns {Promise<import("express").Response | undefined>} 已写入的 JSON Response；异常调用 next 后返回 undefined。
 */
async function getConversationMessages(req, res, next) {
    try {
        const conversationId = Number(req.params.id);
        // 缺省游标取最新页；存在时必须是单个非空字符串，数组或嵌套对象均拒绝。
        const rawBeforeId = req.query.beforeId;
        let beforeId = null;

        if (
            !Number.isSafeInteger(conversationId) ||
            conversationId <= 0 ||
            conversationId > 2147483647
        ) {
            return res.status(400).json({
                code: 400,
                message: '会话 ID 不正确'
            });
        }

        if (rawBeforeId !== undefined) {
            if (
                typeof rawBeforeId !== 'string' ||
                rawBeforeId.trim() === ''
            ) {
                return res.status(400).json({
                    code: 400,
                    message: '消息游标不正确'
                });
            }

            beforeId = Number(rawBeforeId);

            if (
                !Number.isSafeInteger(beforeId) ||
                beforeId <= 0 ||
                beforeId > 2147483647
            ) {
                return res.status(400).json({
                    code: 400,
                    message: '消息游标不正确'
                });
            }
        }

        const result =
            await agentService.getConversationMessages(
                req.user.id,
                conversationId,
                beforeId
            );

        if (result.error) {
            return res.status(result.status).json({
                code: result.status,
                message: result.error
            });
        }

        return res.json({
            code: 200,
            message: '获取会话消息成功',
            data: result.data
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 验证删除目标 ID，使用 req.user.id 限制归属，返回业务错误或删除成功 ID。
 *
 * @param {import("express").Request & {user: {id: number}}} req - 请求对象；认证中间件已设置 req.user，路径/查询/请求体按接口读取。
 * @param {import("express").Response} res - Express 响应对象，写入 JSON 或 SSE 响应。
 * @param {import("express").NextFunction} next - 异常时交给统一错误处理中间件。
 * @returns {Promise<import("express").Response | undefined>} 已写入的 JSON Response；异常调用 next 后返回 undefined。
 */
async function deleteConversation(req, res, next) {
    try {
        const conversationId = Number(req.params.id);

        if (
            !Number.isSafeInteger(conversationId) ||
            conversationId <= 0 ||
            conversationId > 2147483647
        ) {
            return res.status(400).json({
                code: 400,
                message: '会话 ID 不正确'
            });
        }

        const result =
            await agentService.deleteConversation(
                req.user.id,
                conversationId
            );

        if (result.error) {
            return res.status(result.status).json({
                code: result.status,
                message: result.error
            });
        }

        return res.json({
            code: 200,
            message: '删除会话成功',
            data: result.data
        });
    } catch (error) {
        next(error);
    }
}


module.exports = {
    createConversation,
    sendMessage,
    sendMessageStream,
    getLatestConversation,
    getConversations,
    getConversationMessages,
    deleteConversation
};
