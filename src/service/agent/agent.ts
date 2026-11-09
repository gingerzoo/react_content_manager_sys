import lxRequest from '..';

interface CreateConversationResponse {
    code: number;
    message: string;
    data?: {
        id: number;
        title: string;
    };
}

interface SendMessageResponse {
    code: number;
    message: string;
    data?: {
        conversationId: number;
        message: {
            role: 'assistant';
            content: string;
        };
    };
}

export function createAgentConversation(title = '新对话') {
    return lxRequest.request<CreateConversationResponse>({
        method: 'POST',
        url: '/agent/conversations',
        data: { title }
    });
}

export function sendAgentMessage(
    conversationId: number,
    content: string
) {
    return lxRequest.request<SendMessageResponse>({
        method: 'POST',
        url: `/agent/conversations/${conversationId}/messages`,
        data: { content },
        timeout: 45000
    });
}