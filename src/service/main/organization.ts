import lxRequest from '..';

export type OrganizationKind = 'department' | 'role';
export interface OrganizationRecord {
    id: number;
    name: string;
    leader?: string;
    parentId?: number | null;
    parentName?: string | null;
    createAt?: string;
    updateAt?: string;
    userCount?: number;
    menuIds?: number[];
    menuNames?: string[];
}
export interface MenuOption {
    id: number;
    name: string;
    parent_id: number | null;
}
interface ApiResult<T> {
    code: number;
    message: string;
    data: T;
}

/**
 * 请求组织管理分页，检查业务状态和列表结构。
 * @param {OrganizationKind} kind - 部门或角色。
 * @param {object} filters - 分页及筛选条件。
 * @param {AbortSignal} signal - 筛选更新或卸载时取消旧请求。
 * @returns {Promise<{list: OrganizationRecord[]; totalCount: number}>} 分页数据。
 */
export async function getOrganizationPage(
    kind: OrganizationKind,
    filters: {
        offset: number;
        size: number;
        name: string;
        leader?: string;
    },
    signal: AbortSignal
) {
    const result = await lxRequest.request<
        ApiResult<{ list: OrganizationRecord[]; totalCount: number }>
    >({
        method: 'POST',
        url: `/${kind}s/list`,
        data: filters,
        signal
    });
    if (
        result.code !== 200 ||
        !Array.isArray(result.data?.list) ||
        typeof result.data.totalCount !== 'number'
    ) {
        throw new Error(result.message || '列表数据格式不正确');
    }
    return result.data;
}

/**
 * 读取完整下拉选项，独立于表格分页和筛选。
 * @param {OrganizationKind} kind - 部门返回层级选项，角色返回菜单选项。
 * @param {AbortSignal} signal - 取消信号。
 * @returns {Promise<OrganizationRecord[] | MenuOption[]>} 下拉选项。
 */
export async function getOrganizationOptions(kind: OrganizationKind, signal: AbortSignal) {
    if (kind === 'department') {
        const result = await lxRequest.request<ApiResult<OrganizationRecord[]>>({
            method: 'GET',
            url: '/departments/options',
            signal
        });
        if (result.code !== 200 || !Array.isArray(result.data))
            throw new Error(result.message || '部门选项加载失败');
        return result.data;
    }
    const result = await lxRequest.request<ApiResult<{ list: MenuOption[] }>>({
        method: 'POST',
        url: '/menu/list',
        signal
    });
    if (result.code !== 200 || !Array.isArray(result.data?.list))
        throw new Error(result.message || '菜单选项加载失败');
    return result.data.list;
}

/**
 * 新增或编辑组织资源，检查服务端业务错误。
 * @param {OrganizationKind} kind - 资源种类。
 * @param {number | null} id - null 为新增，其余为编辑。
 * @param {object} values - 已校验的表单字段。
 * @returns {Promise<void>} 成功完成；HTTP 或业务失败时抛出错误。
 */
export async function saveOrganization(
    kind: OrganizationKind,
    id: number | null,
    values: object
): Promise<void> {
    const result = await lxRequest.request<ApiResult<{ id: number }>>({
        method: id === null ? 'POST' : 'PATCH',
        url: id === null ? `/${kind}s` : `/${kind}s/${id}`,
        data: values
    });
    if (result.code !== 200) throw new Error(result.message || '保存失败');
}

/**
 * 删除记录，保留后端关于关联关系和权限的错误。
 * @param {OrganizationKind} kind - 资源种类。
 * @param {number} id - 目标 ID。
 * @returns {Promise<void>} 删除完成。
 */
export async function deleteOrganization(kind: OrganizationKind, id: number): Promise<void> {
    const result = await lxRequest.request<ApiResult<{ id: number }>>({
        method: 'DELETE',
        url: `/${kind}s/${id}`
    });
    if (result.code !== 200) throw new Error(result.message || '删除失败');
}
