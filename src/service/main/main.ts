import lxRequest from '..';

export function getPageRoles() {
    return lxRequest.request({
        method: 'post',
        url: '/role/list'
    });
}

export function getPageDepartments() {
    return lxRequest.request({
        method: 'post',
        url: '/department/list'
    });
}

export function getPageMenus() {
    return lxRequest.request({
        method: 'post',
        url: '/menu/list'
    });
}
