let messageApi: any = null;

export function setMessageApi(api: any) {
    messageApi = api;
}

export function showMessage(type: 'success' | 'error', content: string) {
    if (messageApi) {
        messageApi[type](content);
    }
}
