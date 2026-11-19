// 内容助手路由表，挂载前缀为 /api/agent。
// 内容助手会调用付费模型，仅管理员可使用；Service 继续检查会话归属。
const router = require('express').Router();

const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const agentController = require('../controllers/agent');

router.post(
    // POST 创建空会话；GET 同一路径用于摘要列表，请求方法不同不会冲突。
    '/conversations',
    authMiddleware,
    requireAdmin,
    agentController.createConversation
);

router.post(
    // POST 普通完整回复；GET 同一路径查询历史分页。
    '/conversations/:id/messages',
    authMiddleware,
    requireAdmin,
    agentController.sendMessage
);

router.get(
    // 恢复最近会话最新一页；不是全部会话消息。
    '/conversations/latest',
    authMiddleware,
    requireAdmin,
    agentController.getLatestConversation
);

router.post(
    // POST 带 Authorization 和请求体，响应为 start/delta/done/error SSE 事件。
    '/conversations/:id/messages/stream',
    authMiddleware,
    requireAdmin,
    agentController.sendMessageStream
);

router.get(
    // POST 创建空会话；GET 同一路径用于摘要列表，请求方法不同不会冲突。
    '/conversations',
    authMiddleware,
    requireAdmin,
    agentController.getConversations
);

router.get(
    // POST 普通完整回复；GET 同一路径查询历史分页。
    '/conversations/:id/messages',
    authMiddleware,
    requireAdmin,
    agentController.getConversationMessages
);

router.delete(
    // DELETE 会话及级联消息；生成期间由 Service 拒绝删除。
    '/conversations/:id',
    authMiddleware,
    requireAdmin,
    agentController.deleteConversation
);

module.exports = router;
