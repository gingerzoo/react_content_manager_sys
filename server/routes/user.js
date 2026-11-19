const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/user');
const requireAccess = require('../middleware/requireAccess');


router.get('/me/menus', authMiddleware, userController.getMenus);
router.get('/me', authMiddleware, requireAccess(), userController.getCurrentUser);

router.get('/:id', authMiddleware, requireAccess(), userController.getUserInfo);







module.exports = router;
