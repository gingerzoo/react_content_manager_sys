const service = require('../services/organization');

/**
 * 将组织业务操作统一转换为 HTTP JSON 响应。
 * @param {(req: import('express').Request) => Promise<unknown>} operation - 已授权的业务操作。
 * @returns {import('express').RequestHandler} 包含校验错误转换的控制器。
 */
function handler(operation) {
    return async function organizationHandler(req, res, next) {
        try {
            const data = await operation(req);
            res.json({ code: 200, message: '操作成功', data });
        } catch (error) {
            if ([400, 403, 404, 409].includes(error.status)) {
                return res.status(error.status).json({ code: error.status, message: error.message });
            }
            next(error);
        }
    };
}

module.exports = {
    departmentPage: handler(req => service.getPage('department', req.body)),
    rolePage: handler(req => service.getPage('role', req.body)),
    departmentOptions: handler(() => service.getDepartmentOptions()),
    createDepartment: handler(req => service.mutate('department', 'create', undefined, req.body)),
    updateDepartment: handler(req => service.mutate('department', 'update', req.params.id, req.body)),
    deleteDepartment: handler(req => service.mutate('department', 'delete', req.params.id)),
    createRole: handler(req => service.mutate('role', 'create', undefined, req.body)),
    updateRole: handler(req => service.mutate('role', 'update', req.params.id, req.body)),
    deleteRole: handler(req => service.mutate('role', 'delete', req.params.id))
};
