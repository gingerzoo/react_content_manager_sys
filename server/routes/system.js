const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const requireAccess = require('../middleware/requireAccess');
const systemController = require('../controllers/system');
const organizationController = require('../controllers/organization');

router.post('/users/list', authMiddleware, requireAdmin, systemController.getUsersList);

router.post('/role/list', authMiddleware, requireAccess(), systemController.getRoleList);
router.post('/department/list', authMiddleware, requireAccess(), systemController.getDepartmentList);
router.post('/menu/list', authMiddleware, requireAccess(), systemController.getMenuList);
router.patch('/users/:id', authMiddleware, requireAdmin, systemController.editUser);
router.delete('/users/:id', authMiddleware, requireAdmin, systemController.deleteUser);
router.post('/users', authMiddleware, requireAdmin, systemController.createUser);
router.post(
    '/departments/list',
    authMiddleware,
    requireAccess('/main/system/department'),
    organizationController.departmentPage
);

router.get('/departments/options', authMiddleware, requireAccess('/main/system/department'), organizationController.departmentOptions);
router.post('/roles/list', authMiddleware, requireAccess('/main/system/role'), organizationController.rolePage);
router.post('/departments', authMiddleware, requireAdmin, organizationController.createDepartment);
router.patch('/departments/:id', authMiddleware, requireAdmin, organizationController.updateDepartment);
router.delete('/departments/:id', authMiddleware, requireAdmin, organizationController.deleteDepartment);
router.post('/roles', authMiddleware, requireAdmin, organizationController.createRole);
router.patch('/roles/:id', authMiddleware, requireAdmin, organizationController.updateRole);
router.delete('/roles/:id', authMiddleware, requireAdmin, organizationController.deleteRole);

module.exports = router;
