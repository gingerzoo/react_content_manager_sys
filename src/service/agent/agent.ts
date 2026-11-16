import lxRequest from '..';
import { BASE_URL } from '../config';

// 页面消息结构：数据库 ID 和前端生成的临时 UUID 都统一保存为字符串。
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

// SSE done 的确认结果：完整回复已由服务端成功保存，不等同于一个普通 delta。
export interface StreamDoneData {
    conversationId: number;
    message: {
        role: 'assistant';
        content: string;
    };
}

// 历史面板的会话摘要；时间由接口序列化为字符串，展示时转换为本地时间。
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

// 消息游标分页：messages 旧到新排列；hasMore=false 时 nextCursor=null。
export interface ConversationMessagesPage {
    conversationId: number;
    title: string;
    messages: ChatMessage[];
    hasMore: boolean;
    nextCursor: number | null;
}


interface ConversationMessagesResponse {
    code: number;
    message: string;
    data?: ConversationMessagesPage
}


// signal 控制取消；onDelta 是增量文本回调，不负责确认问答已入库。
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
    data?: ConversationMessagesPage | null;
}

interface DeleteConversationResponse {
    code: number;
    message: string;
    data?: {
        conversationId: number;
    };
}



/**
 * 创建属于当前登录用户的空会话；默认标题在首次成功问答保存时由后端更新。
 *
 * @param {string} [title='新对话'] - 空会话初始标题。
 * @returns {Promise<CreateConversationResponse>} 包含业务状态码和新会话 ID、标题的接口响应。
 */
export function createAgentConversation(title = '新对话') {
    return lxRequest.request<CreateConversationResponse>({
        method: 'POST',
        url: '/agent/conversations',
        data: { title }
    });
}

/**
 * 非流式发送接口：等待完整 JSON 回复；保留给不需要逐段展示的调用方。
 *
 * @param {number} conversationId - 目标会话的数据库 ID。
 * @param {string} content - 本轮用户输入的完整文本。
 * @returns {Promise<SendMessageResponse>} 非流式完整回复；HTTP 请求失败时拒绝。
 */
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

/**
 * 获取当前用户最近会话的最新一页；data=null 表示还没有任何会话。
 *
 * @param {AbortSignal} [signal] - 可选取消信号；调用方卸载或切换时可取消请求。
 * @returns {Promise<LatestConversationResponse>} 最近会话最新一页；data 为 null 表示没有会话。
 */
export function getLatestAgentConversation(
    signal?: AbortSignal
) {
    return lxRequest.request<LatestConversationResponse>({
        method: 'GET',
        url: '/agent/conversations/latest',
        signal
    });
}

/**
 * 通过带 JWT 的 POST fetch 接收 SSE；每个 delta 回调增量更新页面，最终返回 done 数据。
 * signal 允许调用方取消；HTTP 错误、SSE error 或缺少 done 都按失败抛出。
 * fetch 不经过 lxRequest 的 Axios 拦截器，因此这里手动附加登录 token。
 *
 * @param {number} conversationId - 目标会话的数据库 ID。
 * @param {string} content - 本轮问题文本。
 * @param {StreamAgentMessageOptions} options - 流式请求配置，提供取消信号和增量回调。
 * @param {AbortSignal} [options.signal] - 取消浏览器 fetch 及响应流读取。
 * @param {(text: string) => void} options.onDelta - 收到 delta 后调用，参数为增量文本。
 * @returns {Promise<StreamDoneData>} 收到 done 并完成读取后返回最终问答结果。
 * @throws {Error} HTTP 失败、协议数据异常、SSE error 或缺失 done 时抛出。
 */
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

    // 开始 SSE 前的校验失败仍是普通 HTTP 响应；先读文本，兼容空响应或非 JSON 错误。
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
    // UTF-8 字符可能跨网络分块；stream:true 保留未完整解码的字节，避免中文乱码。
    const decoder = new TextDecoder();

    // 保存尚未组成完整 SSE 事件的文本；一个网络分块可能拆开事件，也可能包含多个事件。
    let buffer = '';
    // 只在收到 done 后赋值；连接结束本身不代表生成和保存成功。
    let doneData: StreamDoneData | null = null;

    /**
     * 解析一个完整 SSE 事件块：event 指定类型，多行 data 合并后作为 JSON 解码。
     * start 暂不处理；delta 通知页面，error 抛错，done 保存后端确认的最终结果。
     *
     * @param {string} block - 已按空行切出的完整 SSE 事件块，不是任意网络分块。
     * @returns {void} delta 调用回调，done 更新外层结果，start 忽略。
     * @throws {Error} 数据格式错误或收到 SSE error 时抛出。
     */
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

            // 当前后端以两个换行结束事件；反复提取完整块，半截保留到下次 read。
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
        // 解析或回调失败后停止继续读取；清理失败不能覆盖原始错误。
        await reader.cancel().catch(() => undefined);
        throw error;
    } finally {
        // 释放 reader 对响应流的独占锁。
        reader.releaseLock();
    }

    // 没有收到业务完成事件时，不将已显示的部分文本当成保存成功的回复。
    if (!doneData) {
        throw new Error(
            '流式连接已结束，但没有收到完成事件'
        );
    }

    return doneData;
}

/**
 * 查询当前用户的会话摘要列表；只用于历史面板，不加载完整消息。
 *
 * @param {AbortSignal} [signal] - 可选取消信号；调用方卸载或切换时可取消请求。
 * @returns {Promise<ConversationListResponse>} 当前用户的会话摘要列表响应。
 */
export function getAgentConversations(
    signal?: AbortSignal
) {
    return lxRequest.request<ConversationListResponse>({
        method: 'GET',
        url: '/agent/conversations',
        signal
    });
}

/**
 * 查询指定会话的一页消息；省略 beforeId 取最新页，传入游标取更早页。
 * signal 保持为第二个参数，兼容会话切换请求；params 由 Axios 编码为查询字符串。
 *
 * @param {number} conversationId - 目标会话的数据库 ID。
 * @param {AbortSignal} [signal] - 可选取消信号；调用方卸载或切换时可取消请求。
 * @param {number} [beforeId] - 可选排他消息游标；省略时查询最新一页。
 * @returns {Promise<ConversationMessagesResponse>} 会话消息页，包括 hasMore 和 nextCursor。
 */
export function getAgentConversationMessages(
    conversationId: number,
    signal?: AbortSignal,
    beforeId?: number
) {
    return lxRequest.request<ConversationMessagesResponse>({
        method: 'GET',
        url: `/agent/conversations/${conversationId}/messages`,
        signal,
        params: 
            beforeId === undefined
                ? undefined
                : { beforeId }
    });
}

/**
 * 删除指定会话及关联消息；会话归属与生成期间禁止删除均由后端再次检查。
 *
 * @param {number} conversationId - 目标会话的数据库 ID。
 * @returns {Promise<DeleteConversationResponse>} 删除结果及目标 ID；请求失败时拒绝。
 */
export function deleteAgentConversation(
    conversationId: number
) {
    return lxRequest.request<DeleteConversationResponse>({
        method: 'DELETE',
        url: `/agent/conversations/${conversationId}`
    });
}
