const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const systemController = require('../controllers/system');

router.post('/users/list', authMiddleware, systemController.getUsersList);

router.post('/role/list', authMiddleware, systemController.getRoleList);
router.post('/department/list', authMiddleware, systemController.getDepartmentList);
router.post('/menu/list', authMiddleware, systemController.getMenuList);
router.patch('/users/:id', authMiddleware, systemController.editUser);
router.delete('/users/:id', authMiddleware, systemController.deleteUser);
router.post('/users', authMiddleware, systemController.createUser);


module.exports = router;
