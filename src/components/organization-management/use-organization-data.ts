import { useEffect, useState } from 'react';
import axios from 'axios';
import { getOrganizationPage, getOrganizationOptions } from '@/service/main/organization';
import type { OrganizationKind, OrganizationRecord, MenuOption } from '@/service/main/organization';

/**
 * 将接口错误转换为用户提示。
 * @param {unknown} error - 请求或业务错误。
 * @returns {string} 可展示的错误消息。
 */
export function getOrganizationError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const serverMessage = error.response?.data?.message;
        if (typeof serverMessage === 'string') return serverMessage;
        if (!error.response) return '无法连接服务，请检查网络或后端服务';
    }
    return error instanceof Error ? error.message : '操作失败，请稍后重试';
}

/**
 * 管理独立的列表、筛选、分页及完整编辑选项，并取消过时请求。
 * @param {OrganizationKind} kind - 部门或角色，父页面通过 key 重置切换状态。
 * @param {boolean} canManage - 是否加载管理员编辑选项。
 * @returns {object} 数据、加载/错误状态及分页筛选控制器。
 */
export function useOrganizationData(kind: OrganizationKind, canManage: boolean) {
    // filters 仅存放已提交筛选；输入过程保留在 Form 内，不触发查询。
    const [filters, setFilters] = useState({ name: '', leader: '' });
    const [pagination, setPagination] = useState({ page: 1, size: 8 });
    const [rows, setRows] = useState<OrganizationRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // 写操作成功或手动重试时递增，统一重取列表及选项。
    const [refreshKey, setRefreshKey] = useState(0);
    const [departments, setDepartments] = useState<OrganizationRecord[]>([]);
    const [menus, setMenus] = useState<MenuOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsError, setOptionsError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        void getOrganizationPage(
            kind,
            {
                name: filters.name,
                ...(kind === 'department' ? { leader: filters.leader } : {}),
                offset: (pagination.page - 1) * pagination.size,
                size: pagination.size
            },
            controller.signal
        )
            .then(result => {
                if (controller.signal.aborted) return;
                const lastPage = Math.max(1, Math.ceil(result.totalCount / pagination.size));
                if (pagination.page > lastPage) {
                    // 删除最后一页最后一条后，修正页码并重新请求。
                    setPagination(previous => ({ ...previous, page: lastPage }));
                    return;
                }
                setRows(result.list);
                setTotal(result.totalCount);
            })
            .catch(failure => {
                if (!controller.signal.aborted) setError(getOrganizationError(failure));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [kind, filters, pagination, refreshKey]);

    useEffect(() => {
        if (!canManage) return;
        const controller = new AbortController();
        setOptionsLoading(true);
        setOptionsError('');
        void getOrganizationOptions(kind, controller.signal)
            .then(result => {
                if (controller.signal.aborted) return;
                if (kind === 'department') setDepartments(result as OrganizationRecord[]);
                else setMenus(result as MenuOption[]);
            })
            .catch(failure => {
                if (!controller.signal.aborted) setOptionsError(getOrganizationError(failure));
            })
            .finally(() => {
                if (!controller.signal.aborted) setOptionsLoading(false);
            });
        return () => controller.abort();
    }, [kind, canManage, refreshKey]);

    return {
        filters,
        setFilters,
        pagination,
        setPagination,
        rows,
        total,
        loading,
        error,
        departments,
        menus,
        optionsLoading,
        optionsError,
        refresh: () => setRefreshKey(previous => previous + 1)
    };
}
