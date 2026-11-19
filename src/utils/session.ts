export function clearLoginStorage() {
    const keys = [
        'token',
        'password',
        'isPsdRemembered',
        'userInfo',
        'userMenus',
        'selectedKeys'
    ];

    keys.forEach(key => {
        localStorage.removeItem(key);
    });
}
