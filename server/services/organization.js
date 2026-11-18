const model = require('../models/organization');
const systemModel = require('../models/system');

/**
 * 拒绝无效组织管理参数，由 Controller 转为 400 响应。
 * @param {string} message - 给用户的校验提示。
 * @returns {never} 始终抛出校验错误。
 */
function invalid(message) {
    const error = new Error(message);
    error.status = 400;
    throw error;
}

/**
 * 校验对象及可提交字段，防止透传任意数据库字段。
 * @param {unknown} body - 请求体。
 * @param {string[]} fields - 允许的字段名称。
 * @returns {object} 校验后的对象。
 */
function objectBody(body, fields) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('参数必须是对象');
    if (Object.keys(body).some(key => !fields.includes(key))) invalid('包含不支持的字段');
    return body;
}

/**
 * 校验并规范化文本，保留名称中间的空格。
 * @param {unknown} value - 输入文本。
 * @param {number} max - 最大长度。
 * @param {string} label - 字段名称。
 * @param {boolean} required - 是否禁止空文本。
 * @returns {string} 去除首尾空白后的文本。
 */
function text(value, max, label, required = false) {
    if (typeof value !== 'string' || value.length > max) invalid(`${label}必须是字符串，且不能超过 ${max} 个字符`);
    const result = value.trim();
    if (required && !result) invalid(`请输入${label}`);
    return result;
}

/**
 * 查询组织管理分页；仅列表支持筛选，不与其他页面共享分页状态。
 * @param {'department' | 'role'} kind - 资源种类。
 * @param {unknown} body - 分页与筛选参数。
 * @returns {Promise<{list: object[], totalCount: number}>} 列表和总数。
 */
async function getPage(kind, body) {
    const data = objectBody(body ?? {}, kind === 'department' ? ['offset', 'size', 'name', 'leader'] : ['offset', 'size', 'name']);
    const { offset = 0, size = 8 } = data;
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(size) || size < 1 || size > 100) invalid('分页参数不正确');
    const name = text(data.name ?? '', kind === 'role' ? 50 : 100, '名称');
    if (kind === 'role') return model.findRolePage({ offset, size, name });
    const leader = text(data.leader ?? '', 100, '负责人');
    return systemModel.findDepartmentPage({ offset, size, name, leader });
}

/**
 * 校验增删改输入后调用对应的事务模型。
 * @param {'department' | 'role'} kind - 资源种类。
 * @param {'create' | 'update' | 'delete'} action - 操作种类。
 * @param {string | undefined} rawId - URL 中的目标 ID。
 * @param {unknown} body - 新增或编辑的完整表单。
 * @returns {Promise<{id: number}>} 已处理的资源 ID。
 */
async function mutate(kind, action, rawId, body) {
    let id = null;
    if (action !== 'create') {
        if (typeof rawId !== 'string' || !/^\d+$/.test(rawId)) invalid('ID 格式不正确');
        id = Number(rawId);
        if (!Number.isSafeInteger(id) || id < (kind === 'role' ? 0 : 1)) invalid('ID 格式不正确');
    }
    let values = {};
    if (action !== 'delete') {
        const data = objectBody(body, kind === 'department' ? ['name', 'leader', 'parentId'] : ['name', 'menuIds']);
        const name = text(data.name, kind === 'role' ? 50 : 100, '名称', true);
        if (kind === 'department') {
            const parentId = data.parentId ?? null;
            if (parentId !== null && (!Number.isSafeInteger(parentId) || parentId <= 0)) invalid('上级部门 ID 必须是正整数或 null');
            values = { name, leader: text(data.leader ?? '', 100, '负责人'), parentId };
        } else {
            if (!Array.isArray(data.menuIds) || data.menuIds.length > 100 || data.menuIds.some(value => !Number.isSafeInteger(value) || value <= 0)) invalid('菜单权限参数不正确');
            values = { name, menuIds: [...new Set(data.menuIds)] };
        }
    }
    return kind === 'department' ? model.mutateDepartment(action, id, values) : model.mutateRole(action, id, values);
}

module.exports = { getPage, mutate, getDepartmentOptions: model.findDepartmentOptions };
