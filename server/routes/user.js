const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/user');


router.get('/me/menus', authMiddleware, userController.getMenus);

router.get('/:id', authMiddleware, userController.getUserInfo);







module.exports = router;
