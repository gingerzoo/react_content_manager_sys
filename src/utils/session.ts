export function clearLoginStorage() {
    const keys = [
        'token',
        'userInfo',
        'userMenus',
        'selectedKeys'
    ];

    keys.forEach(key => {
        localStorage.removeItem(key);
    });
}