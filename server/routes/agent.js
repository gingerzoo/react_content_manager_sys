const router = require('express').Router();

const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const agentController = require('../controllers/agent');

router.post(
    '/conversations',
    authMiddleware,
    requireAdmin,
    agentController.createConversation
);

router.post(
    '/conversations/:id/messages',
    authMiddleware,
    requireAdmin,
    agentController.sendMessage
);

router.get(
    '/conversations/latest',
    authMiddleware,
    requireAdmin,
    agentController.getLatestConversation
);

router.post(
    '/conversations/:id/messages/stream',
    authMiddleware,
    requireAdmin,
    agentController.sendMessageStream
);

router.get(
    '/conversations',
    authMiddleware,
    requireAdmin,
    agentController.getConversations
);

router.get(
    '/conversations/:id/messages',
    authMiddleware,
    requireAdmin,
    agentController.getConversationMessages
);

router.delete(
    '/conversations/:id',
    authMiddleware,
    requireAdmin,
    agentController.deleteConversation
);

module.exports = router;