import lxRequest from '..';
import { BASE_URL } from '../config';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export interface StreamDoneData {
    conversationId: number;
    message: {
        role: 'assistant';
        content: string;
    };
}

export interface AgentConversationSummary {
    id: number;
    title: string;
    createdAt: string;
    updatedAt: string;
}

interface ConversationListResponse {
    code: number;
    message: string;
    data?: AgentConversationSummary[];
}

interface ConversationMessagesResponse {
    code: number;
    message: string;
    data?: {
        conversationId: number;
        title: string;
        messages: ChatMessage[];
    };
}

interface StreamAgentMessageOptions {
    signal?: AbortSignal;
    onDelta: (text: string) => void;
}

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

interface LatestConversationResponse {
    code: number;
    message: string;
    data?: {
        conversationId: number;
        title: string;
        messages: ChatMessage[];
    } | null;
}

interface DeleteConversationResponse {
    code: number;
    message: string;
    data?: {
        conversationId: number;
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

export function getLatestAgentConversation(
    signal?: AbortSignal
) {
    return lxRequest.request<LatestConversationResponse>({
        method: 'GET',
        url: '/agent/conversations/latest',
        signal
    });
}

export async function streamAgentMessage(
    conversationId: number,
    content: string,
    options: StreamAgentMessageOptions
): Promise<StreamDoneData> {
    const token = localStorage.getItem('token');

    const response = await fetch(
        `${BASE_URL}/agent/conversations/${conversationId}/messages/stream`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token
                    ? { Authorization: `Bearer ${token}` }
                    : {})
            },
            body: JSON.stringify({ content }),
            signal: options.signal
        }
    );

    if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = `请求失败（${response.status}）`;

        if (responseText) {
            try {
                const errorData = JSON.parse(responseText);

                if (
                    typeof errorData.message === 'string' &&
                    errorData.message.trim()
                ) {
                    errorMessage = errorData.message;
                }
            } catch {
                errorMessage = responseText;
            }
        }

        throw new Error(errorMessage);
    }

    if (!response.body) {
        throw new Error('浏览器未提供流式响应内容');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    let doneData: StreamDoneData | null = null;

    const handleEventBlock = (block: string) => {
        let eventName = '';
        const dataLines: string[] = [];

        for (const line of block.split('\n')) {
            if (line.startsWith('event:')) {
                eventName = line.slice('event:'.length).trim();
            } else if (line.startsWith('data:')) {
                dataLines.push(
                    line.slice('data:'.length).trimStart()
                );
            }
        }

        if (!eventName || dataLines.length === 0) {
            return;
        }

        const payload: unknown = JSON.parse(
            dataLines.join('\n')
        );

        if (
            typeof payload !== 'object' ||
            payload === null
        ) {
            throw new Error('流式响应格式不正确');
        }

        if (eventName === 'delta') {
            const text = Reflect.get(payload, 'text');

            if (typeof text !== 'string') {
                throw new Error('回复片段格式不正确');
            }

            options.onDelta(text);
            return;
        }

        if (eventName === 'error') {
            const message = Reflect.get(payload, 'message');

            throw new Error(
                typeof message === 'string'
                    ? message
                    : '流式回复失败'
            );
        }

        if (eventName === 'done') {
            const conversationIdValue = Reflect.get(
                payload,
                'conversationId'
            );

            const message = Reflect.get(payload, 'message');

            if (
                !Number.isSafeInteger(conversationIdValue) ||
                typeof message !== 'object' ||
                message === null ||
                Reflect.get(message, 'role') !== 'assistant' ||
                typeof Reflect.get(message, 'content') !== 'string'
            ) {
                throw new Error('回复完成事件格式不正确');
            }

            doneData = payload as StreamDoneData;
        }
    };

    try {
        while (true) {
            const { value, done } = await reader.read();

            if (done) break;

            // 一次 read() 得到的内容不一定是完整的 SSE 事件。
            buffer += decoder.decode(value, {
                stream: true
            });

            let boundaryIndex = buffer.indexOf('\n\n');

            while (boundaryIndex !== -1) {
                const eventBlock = buffer.slice(
                    0,
                    boundaryIndex
                );

                buffer = buffer.slice(boundaryIndex + 2);

                if (eventBlock.trim()) {
                    handleEventBlock(eventBlock);
                }

                boundaryIndex = buffer.indexOf('\n\n');
            }
        }

        // 取出 TextDecoder 内部可能残留的字节。
        buffer += decoder.decode();

        if (buffer.trim()) {
            handleEventBlock(buffer);
        }
    } catch (error) {
        await reader.cancel().catch(() => undefined);
        throw error;
    } finally {
        reader.releaseLock();
    }

    if (!doneData) {
        throw new Error(
            '流式连接已结束，但没有收到完成事件'
        );
    }

    return doneData;
}

export function getAgentConversations(
    signal?: AbortSignal
) {
    return lxRequest.request<ConversationListResponse>({
        method: 'GET',
        url: '/agent/conversations',
        signal
    });
}

export function getAgentConversationMessages(
    conversationId: number,
    signal?: AbortSignal
) {
    return lxRequest.request<ConversationMessagesResponse>({
        method: 'GET',
        url: `/agent/conversations/${conversationId}/messages`,
        signal
    });
}

export function deleteAgentConversation(
    conversationId: number
) {
    return lxRequest.request<DeleteConversationResponse>({
        method: 'DELETE',
        url: `/agent/conversations/${conversationId}`
    });
}