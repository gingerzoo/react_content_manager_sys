const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const systemController = require('../controllers/system');

router.post('/users/list', authMiddleware, requireAdmin, systemController.getUsersList);

router.post('/role/list', authMiddleware, systemController.getRoleList);
router.post('/department/list', authMiddleware, systemController.getDepartmentList);
router.post('/menu/list', authMiddleware, systemController.getMenuList);
router.patch('/users/:id', authMiddleware, requireAdmin, systemController.editUser);
router.delete('/users/:id', authMiddleware, requireAdmin, systemController.deleteUser);
router.post('/users', authMiddleware, requireAdmin, systemController.createUser);


module.exports = router;
