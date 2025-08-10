import lxRequest from '../..';
import type { Iaccount } from '@/types';

// 获取页面列表
export function getPageListData(pageName: string, queryInfo) {
    return lxRequest.request({
        method: 'post',
        url: `/${pageName}/list`,
        data: queryInfo
    });
}

// 根据id删除列表某一项
export function deletePageItemById(pageName: string, userId: number) {
    return lxRequest.request({
        method: 'delete',
        url: `/${pageName}/${userId}`
    });
}

// 新增一项
export function createNewPageItem(pageName: string, userInfo: any) {
    return lxRequest.request({
        method: 'post',
        url: `/${pageName}`,
        data: userInfo
    });
}

// 编辑列表某一项
export function editPageItemInfo(pageName: string, userId: number, userInfo: any) {
    return lxRequest.request({
        method: 'patch',
        url: `/${pageName}/${userId}`,
        data: userInfo,
        headers: {
            'Content-Type': 'application/json' // 明确指定
        }
    });
}
