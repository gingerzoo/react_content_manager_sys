const agentService = require('../services/agent');
const { once } = require('node:events');

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

    const controller = new AbortController();
    let timedOut = false;

    // 限制这一轮流式处理的总时间。
    const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, 60000);

    const handleClose = () => {
        if (!res.writableEnded) {
            controller.abort();
        }
    };

    res.on('close', handleClose);

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
                    res.setHeader('X-Accel-Buffering', 'no');

                    res.flushHeaders();

                    await writeEvent('start', {
                        conversationId
                    });
                },

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


module.exports = {
    createConversation,
    sendMessage,
    sendMessageStream,
    getLatestConversation
};