const agentService = require('../services/agent');

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
    getLatestConversation
};