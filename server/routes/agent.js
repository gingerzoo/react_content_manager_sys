// 内容助手路由表，挂载前缀为 /api/agent。
// 所有接口先验证 JWT 和内容助手菜单权限；Service 继续检查会话归属。
const router = require('express').Router();

const authMiddleware = require('../middleware/auth');
const requireAccess = require('../middleware/requireAccess');
const requireAssistant = requireAccess('/main/story/chat');
const agentController = require('../controllers/agent');

router.post(
    // POST 创建空会话；GET 同一路径用于摘要列表，请求方法不同不会冲突。
    '/conversations',
    authMiddleware,
    requireAssistant,
    agentController.createConversation
);

router.post(
    // POST 普通完整回复；GET 同一路径查询历史分页。
    '/conversations/:id/messages',
    authMiddleware,
    requireAssistant,
    agentController.sendMessage
);

router.get(
    // 恢复最近会话最新一页；不是全部会话消息。
    '/conversations/latest',
    authMiddleware,
    requireAssistant,
    agentController.getLatestConversation
);

router.post(
    // POST 带 Authorization 和请求体，响应为 start/delta/done/error SSE 事件。
    '/conversations/:id/messages/stream',
    authMiddleware,
    requireAssistant,
    agentController.sendMessageStream
);

router.get(
    // POST 创建空会话；GET 同一路径用于摘要列表，请求方法不同不会冲突。
    '/conversations',
    authMiddleware,
    requireAssistant,
    agentController.getConversations
);

router.get(
    // POST 普通完整回复；GET 同一路径查询历史分页。
    '/conversations/:id/messages',
    authMiddleware,
    requireAssistant,
    agentController.getConversationMessages
);

router.delete(
    // DELETE 会话及级联消息；生成期间由 Service 拒绝删除。
    '/conversations/:id',
    authMiddleware,
    requireAssistant,
    agentController.deleteConversation
);

module.exports = router;
