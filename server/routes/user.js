const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/user');

router.get('/:id', authMiddleware, userController.getUserInfo);

router.get('/role/:id/menu', authMiddleware, userController.getMenus);






module.exports = router;
