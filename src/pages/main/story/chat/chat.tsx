import { memo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { 
    Button, 
    Empty,
    Input, 
    Typography,
    Alert,
    Spin,
    Space,
    App as AntdApp
} from 'antd';
import axios from 'axios';
import { 
    createAgentConversation,
    deleteAgentConversation,
    streamAgentMessage,
    getLatestAgentConversation,
    getAgentConversationMessages
 } from '@/service/agent/agent';
import MarkdownContent from './markdown-content';

import {
    PlusOutlined
} from '@ant-design/icons';

import type { 
    ChatMessage,
} from '@/service/agent/agent';
import ConversationDropdown from
    './components/conversation-dropdown';

import ChatWrap from './style';

// 单条输入的字符上限，与服务端校验保持一致；不是模型 token 上限。
const MAX_MESSAGE_LENGTH = 2000;
// 距离底部小于该像素数时视为到底，容忍像素取整与轻微滚动偏差。
const BOTTOM_THRESHOLD = 48;
// 接近顶部时提前加载，避免要求用户精确滚到 scrollTop=0。
const TOP_LOAD_THRESHOLD = 48;

/**
 * 内容助手页面：协调会话恢复、流式问答、历史分页和滚动位置。
 * 状态用于驱动界面；ref 用于保存 DOM、取消控制器、同步锁与一次性的滚动锚点。
 *
 * 无入参；所需上下文从闭包或模块作用域读取。
 * @returns {import("react").ReactElement} 内容助手页面的 React 元素。
 */
const Chat = () => {
    // 受控输入框文本；发送成功后清空，发送失败时保留以便用户处理。
    const [input, setInput] = useState('');
    // 当前选中会话的数据库 ID；null 表示尚无可发送消息的会话。
    const [conversationId, setConversationId] = useState<number | null>(null);
    // 创建请求的界面状态，用于显示加载图标和禁用操作。
    const [creating, setCreating] = useState(false);
    // 创建操作的同步锁：在第一次 await 前设置，避免连续点击穿透 state 更新。
    const creatingRef = useRef(false);

    // 已加载的正式消息，按旧到新排列；历史分页前插，成功问答后追加。
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    // 流式发送的界面状态，用于显示正在回复和禁用编辑。
    const [sending, setSending] = useState(false);
    // 本轮尚未转入正式列表的用户问题；null 表示没有临时问答。
    const [pendingContent, setPendingContent] = useState<string | null>(
        null
    );

    // 发送操作的同步锁，防止快速点击或 Enter 重复请求。
    const sendingRef = useRef(false);
    // 真实消息滚动容器的 DOM 引用，用于测量高度、读取和调整 scrollTop。
    const messageListRef = useRef<HTMLDivElement>(null);

    // 是否持续跟随底部：用户上翻后为 false，回到底部后为 true；不直接触发渲染。
    const shouldFollowRef = useRef(true);

    // 是否显示返回底部按钮；这是 UI state，与决定自动滚动的 shouldFollowRef 分工不同。
    const [
        showScrollToBottom,
        setShowScrollToBottom
    ] = useState(false);

    // 最近会话恢复状态：loading 显示恢复提示，ready 展示消息，error 展示重试入口。
    const [historyStatus, setHistoryStatus] = useState<
        'loading' | 'ready' | 'error'
    >('loading');

    // 最近会话恢复失败的可见提示，与单次顶部分页错误分开保存。
    const [historyError, setHistoryError] = useState('');
    // 恢复触发计数器：递增会重新运行恢复 Effect，本身不表示会话 ID 或页码。
    const [historyLoadKey, setHistoryLoadKey] = useState(0);

    const { message } = AntdApp.useApp();

    // 本轮 SSE delta 累积的临时助手文本，每次增加片段都会更新同一气泡。
    const [pendingReply, setPendingReply] = useState('');
    // 本轮回复未确认完成的错误；已有片段可能未保存，不能当作完整历史。
    const [streamError, setStreamError] = useState('');

    // 当前会话上方是否还有未加载消息，由后端多查一条的结果决定。
    const [hasMoreHistory, setHasMoreHistory] =
        useState(false);

    // 下一页 beforeId 游标；只使用数据库消息 ID，不使用前端临时 UUID。
    const [nextHistoryCursor, setNextHistoryCursor] =
        useState<number | null>(null);

    // 顶部分页请求的界面状态；不会清空现有消息，也不阻止用户继续阅读。
    const [loadingOlderHistory, setLoadingOlderHistory] =
        useState(false);

    // 顶部分页失败提示；有错误时停止自动重试，保留手动重试入口。
    const [olderHistoryError, setOlderHistoryError] =
        useState('');

    // 当前历史分页控制器，同时充当同步请求锁和响应身份标记。
    const olderHistoryControllerRef =
        useRef<AbortController | null>(null);

    // 删除请求的界面状态，用于禁用其他操作。
    const [
        deletingConversation,
        setDeletingConversation
    ] = useState(false);

    // 删除操作的同步锁，阻止删除期间再次发送、创建或删除。
    const deletingConversationRef = useRef(false);

    // 当前模型流式 fetch 的取消控制器，页面卸载时中断浏览器读取。
    const streamControllerRef =
        useRef<AbortController | null>(null);

    // 正在加载的目标会话 ID；null 表示没有切换请求，用于禁用会话操作。
    const [
        switchingConversationId,
        setSwitchingConversationId
    ] = useState<number | null>(null);

    // 指定会话消息请求的取消控制器，独立于模型生成与顶部分页。
    const switchConversationControllerRef =
        useRef<AbortController | null>(null);

    // 一次性阅读锚点：消息 ID + 消息顶部相对容器顶部的像素偏移。
    const historyAnchorRef = useRef<{
        messageId: string;
        offset: number;
    } | null>(null);



    // 卸载时取消三种独立任务，尽量阻止离开页面后继续读取数据。
    useEffect(() => {
        return () => {
            streamControllerRef.current?.abort();
            switchConversationControllerRef.current?.abort();
            olderHistoryControllerRef.current?.abort();
        };
    }, []);

    // DOM 提交后、浏览器绘制前恢复滚动位置，避免先显示跳动再纠正。
    // 先消费历史锚点；没有锚点时才按 shouldFollowRef 决定是否跟随底部。
    useLayoutEffect(() => {
        const container = messageListRef.current;

        if (!container) return;

        const anchor = historyAnchorRef.current;

        if (anchor) {
            // 使用后立即清除，只恢复这一次。
            historyAnchorRef.current = null;

            const target = Array.from(
                container.querySelectorAll<HTMLElement>(
                    '[data-message-id]'
                )
            ).find(
                element =>
                    element.dataset.messageId ===
                    anchor.messageId
            );

            if (target) {
                // getBoundingClientRect 使用浏览器视口坐标；加 clientTop 越过容器顶部边框。
                const containerTop =
                    container.getBoundingClientRect().top +
                    container.clientTop;

                const currentOffset =
                    target.getBoundingClientRect().top -
                    containerTop;

                // 新偏移减旧偏移，就是旧消息插入造成的位移；滚动同样距离将其抵消。
                // 测量同一条消息，避免把底部同时生成的内容高度误算进补偿。
                container.scrollTop +=
                    currentOffset - anchor.offset;

                const distanceToBottom =
                    container.scrollHeight -
                    container.scrollTop -
                    container.clientHeight;

                setShowScrollToBottom(
                    distanceToBottom > BOTTOM_THRESHOLD
                );

                return;
            }
        }



        if (shouldFollowRef.current) {
            container.scrollTop = container.scrollHeight;
            setShowScrollToBottom(false);
            return;
        }

        // 用户正在查看历史时，不修改 scrollTop。
        const distanceToBottom =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight;

        setShowScrollToBottom(
            distanceToBottom > BOTTOM_THRESHOLD
        );
    }, [
        messages,
        pendingContent,
        pendingReply,
        streamError
    ]);

    // 首次进入和 historyLoadKey 变化时恢复最新会话；清理函数令旧响应失效。
    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        setHistoryStatus('loading');
        setHistoryError('');

        /**
         * 恢复最近会话的最新一页，同时保存分页游标；data=null 表示没有会话。
         * active 防止失效 Effect 更新状态，AbortController 负责取消对应 HTTP 请求。
         *
         * 无入参；所需上下文从闭包或模块作用域读取。
         * @returns {Promise<void>} 操作结束后兑现；业务错误由函数内部处理并更新提示。
         */
        const restoreHistory = async () => {
            try {
                const result = await getLatestAgentConversation(
                    controller.signal
                );

                if (!active) return;

                if (
                    result.code !== 200 ||
                    result.data === undefined
                ) {
                    throw new Error(
                        result.message || '历史记录返回格式不正确'
                    );
                }

                // null 表示该账号还没有任何会话，是正常情况。
                if (result.data === null) {
                    setConversationId(null);
                    setMessages([]);
                    
                    setHasMoreHistory(false);
                    setNextHistoryCursor(null);

                    setHistoryStatus('ready');
                    return;
                }

            
                const data = result.data;

                // every 内只判断：每条消息是否符合页面需要的结构。
                const validMessages =
                    Array.isArray(data.messages) &&
                    data.messages.every(item =>
                        item !== null &&
                        typeof item === 'object' &&
                        typeof item.id === 'string' &&
                        (
                            item.role === 'user' ||
                            item.role === 'assistant'
                        ) &&
                        typeof item.content === 'string'
                );

                // 分页信息属于整个响应，不属于某一条消息，单独校验。
                const validPagination =
                    typeof data.hasMore === 'boolean' &&
                    (
                        data.hasMore
                            ? (
                                Number.isSafeInteger(data.nextCursor) &&
                                Number(data.nextCursor) > 0
                            )
                            : data.nextCursor === null
                    );

                if (
                    !Number.isSafeInteger(data.conversationId) ||
                    data.conversationId <= 0 ||
                    !validMessages ||
                    !validPagination
                ) {
                    throw new Error('历史记录返回格式不正确');
                }

                shouldFollowRef.current = true;
                setShowScrollToBottom(false);

                setConversationId(data.conversationId);
                setMessages(data.messages);
                setHasMoreHistory(data.hasMore);
                setNextHistoryCursor(data.nextCursor);
                setHistoryStatus('ready');
            } catch (error: unknown) {
                if (!active || axios.isCancel(error)) return;

                let errorMessage = '加载历史记录失败，请稍后重试';

                if (axios.isAxiosError(error)) {
                    const serverMessage =
                        error.response?.data?.message;

                    if (
                        typeof serverMessage === 'string' &&
                        serverMessage.trim()
                    ) {
                        errorMessage = serverMessage;
                    } else if (!error.response) {
                        errorMessage = '无法连接服务，请检查网络';
                    }
                } else if (error instanceof Error) {
                    errorMessage = error.message;
                }

                setHistoryError(errorMessage);
                setHistoryStatus('error');
            }
        };

        void restoreHistory();

        return () => {
            active = false;
            controller.abort();
        };
    }, [historyLoadKey]);

    /**
     * 在旧消息响应通过校验后、插入列表前调用，记录用户此刻的阅读位置。
     * 保存第一条尚未完全滚出顶部的消息 ID 和相对偏移；允许负偏移，保留半条消息的阅读进度。
     *
     * 无入参；所需上下文从闭包或模块作用域读取。
     * @returns {void} 不返回业务值，通过状态更新或 DOM 操作完成处理。
     */
    const captureHistoryAnchor = () => {
        const container = messageListRef.current;

        if (!container) return;

        historyAnchorRef.current = null;

        const containerTop =
            container.getBoundingClientRect().top +
            container.clientTop;

        const messageElements =
            container.querySelectorAll<HTMLElement>(
                '[data-message-id]'
            );

        for (const element of messageElements) {
            const rect = element.getBoundingClientRect();

            // 找到第一条尚未完全滚出容器顶部的消息。
            if (rect.bottom > containerTop) {
                const messageId = element.dataset.messageId;

                if (messageId) {
                    historyAnchorRef.current = {
                        messageId,
                        // 偏移可为负数，表示消息顶部已经滚出可视区域，但消息下半部分仍在阅读。
                        offset: rect.top - containerTop
                    };
                }

                break;
            }
        }
    };

    /**
     * 取消当前历史分页并作废它的身份，清空锚点、加载状态和错误。
     * 切换、新建、删除或重试恢复会话时调用，防止旧响应混入新会话。
     *
     * 无入参；所需上下文从闭包或模块作用域读取。
     * @returns {void} 不返回业务值，通过状态更新或 DOM 操作完成处理。
     */
    const cancelOlderHistory = () => {
        const controller =
            olderHistoryControllerRef.current;

        olderHistoryControllerRef.current = null;
        controller?.abort();

        historyAnchorRef.current = null;

        setLoadingOlderHistory(false);
        setOlderHistoryError('');
    };

    /**
     * 按 nextHistoryCursor 查询更早的一页；失败保留已有消息和游标，以便重试。
     * 允许与底部流式生成并行；只有同一会话的有效响应才能合并到列表前面。
     *
     * 无入参；所需上下文从闭包或模块作用域读取。
     * @returns {Promise<void>} 操作结束后兑现；业务错误由函数内部处理并更新提示。
     */
    const loadOlderHistory = async () => {
        if (
            historyStatus !== 'ready' ||
            conversationId === null ||
            !hasMoreHistory ||
            nextHistoryCursor === null ||
            olderHistoryControllerRef.current ||
            creatingRef.current ||
            deletingConversationRef.current ||
            switchConversationControllerRef.current
        ) {
            return;
        }

        const requestedConversationId = conversationId;
        const requestedCursor = nextHistoryCursor;
        const controller = new AbortController();

        // 第一次 await 前同步保存，避免重复触发。
        olderHistoryControllerRef.current = controller;

        setLoadingOlderHistory(true);
        setOlderHistoryError('');

        try {
            const result =
                await getAgentConversationMessages(
                    requestedConversationId,
                    controller.signal,
                    requestedCursor
                );

            // 切换、取消后，旧响应不能再更新当前页面。
            if (
                controller.signal.aborted ||
                olderHistoryControllerRef.current !==
                    controller
            ) {
                return;
            }

            const data = result.data;

            if (
                result.code !== 200 ||
                !data ||
                data.conversationId !==
                    requestedConversationId ||
                !Array.isArray(data.messages) ||
                !data.messages.every(item =>
                    item !== null &&
                    typeof item === 'object' &&
                    typeof item.id === 'string' &&
                    Number.isSafeInteger(Number(item.id)) &&
                    Number(item.id) > 0 &&
                    Number(item.id) < requestedCursor &&
                    (
                        item.role === 'user' ||
                        item.role === 'assistant'
                    ) &&
                    typeof item.content === 'string'
                ) ||
                typeof data.hasMore !== 'boolean' ||
                (
                    data.hasMore
                        ? (
                            !Number.isSafeInteger(
                                data.nextCursor
                            ) ||
                            Number(data.nextCursor) <= 0 ||
                            Number(data.nextCursor) >=
                                requestedCursor
                        )
                        : data.nextCursor !== null
                )
            ) {
                throw new Error('历史分页数据格式不正确');
            }

            const olderMessages = data.messages;

            // 用户可能在等待期间重新滚到底部。
            // 此时继续跟随底部；否则保留当前阅读位置。
            if (!shouldFollowRef.current) {
                captureHistoryAnchor();
            }

            // 用最新 state 合并并按 ID 去重，保留等待分页期间追加的正式问答。
            setMessages(previous => {
                const existingIds = new Set(
                    previous.map(item => item.id)
                );

                const newMessages =
                    olderMessages.filter(
                        item => !existingIds.has(item.id)
                    );

                return [
                    ...newMessages,
                    ...previous
                ];
            });

            setHasMoreHistory(data.hasMore);
            setNextHistoryCursor(data.nextCursor);
        } catch (error: unknown) {
            if (
                controller.signal.aborted ||
                olderHistoryControllerRef.current !==
                    controller ||
                axios.isCancel(error)
            ) {
                return;
            }

            let errorMessage =
                '加载更早消息失败，请重试';

            if (axios.isAxiosError(error)) {
                const serverMessage =
                    error.response?.data?.message;

                if (
                    typeof serverMessage === 'string' &&
                    serverMessage.trim()
                ) {
                    errorMessage = serverMessage;
                } else if (!error.response) {
                    errorMessage =
                        '无法连接服务，请检查网络';
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            setOlderHistoryError(errorMessage);
        } finally {
            if (
                olderHistoryControllerRef.current ===
                controller
            ) {
                olderHistoryControllerRef.current = null;
                setLoadingOlderHistory(false);
            }
        }
    };


    /**
     * 创建空会话，成功后切换到新 ID 并清空已加载消息及分页状态。
     * 请求前同步上锁；失败提示保留在 catch，finally 释放创建锁。
     *
     * 无入参；所需上下文从闭包或模块作用域读取。
     * @returns {Promise<void>} 操作结束后兑现；业务错误由函数内部处理并更新提示。
     */
    const handleCreateConversation = async () => {
        if (
            historyStatus !== 'ready' ||
            creatingRef.current ||
            sendingRef.current ||
            deletingConversationRef.current
        ) {
            return;
        }

        creatingRef.current = true;
        setCreating(true);
        cancelOlderHistory();

        try {
            const result = await createAgentConversation();
            const conversation = result.data;

            if (
                result.code !== 201 ||
                !conversation ||
                !Number.isSafeInteger(conversation.id) ||
                conversation.id <= 0
            ) {
                throw new Error(result.message || '创建对话失败');
            }

            shouldFollowRef.current = true;
            setShowScrollToBottom(false);
            setMessages([]);

            setConversationId(conversation.id);
            setInput('');
            setMessages([]);
            setHasMoreHistory(false);
            setNextHistoryCursor(null);

            message.success('新对话已创建');
        } catch (error: unknown) {
            let errorMessage = '创建对话失败，请稍后重试';

            if (axios.isAxiosError(error)) {
                const serverMessage = error.response?.data?.message;

                if (
                    typeof serverMessage === 'string' &&
                    serverMessage.trim()
                ) {
                    errorMessage = serverMessage;
                } else if (!error.response) {
                    errorMessage = '无法连接服务，请检查网络';
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            message.error(errorMessage);
        } finally {
            creatingRef.current = false;
            setCreating(false);
        }
    };

    /**
     * 发送当前输入并增量显示助手回复；只有收到 done 才将问答转入正式消息列表。
     * 失败保留临时回复并标记未完成；不自动重试，避免重复调用付费模型或重复保存。
     *
     * 无入参；所需上下文从闭包或模块作用域读取。
     * @returns {Promise<void>} 操作结束后兑现；业务错误由函数内部处理并更新提示。
     */
    const handleSend = async () => {
        if (
            historyStatus !== 'ready' ||
            sendingRef.current ||
            creatingRef.current ||
            deletingConversationRef.current ||
            conversationId === null ||
            switchConversationControllerRef.current
        ) {
            return;
        }

        const content = input.trim();

        if (!content || content.length > MAX_MESSAGE_LENGTH) {
            return;
        }

        const currentConversationId = conversationId;
        const controller = new AbortController();

        streamControllerRef.current = controller;
        sendingRef.current = true;

        setSending(true);
        setPendingContent(content);
        setPendingReply('');
        setStreamError('');

        try {
            const result = await streamAgentMessage(
                currentConversationId,
                content,
                {
                    signal: controller.signal,

                    /**
                     * 每个 delta 可能含多个字符；函数式更新避免连续片段覆盖彼此。
                     *
                     * @param {string} text - 本次 SSE 事件携带的增量文本，可能包含多个字符。
                     * @returns {void} 将文本追加到 pendingReply，不代表问答已经入库。
                     */
                    onDelta: text => {
                        if (controller.signal.aborted) return;

                        setPendingReply(previous =>
                            previous + text
                        );
                    }
                }
            );

            if (
                result.conversationId !== currentConversationId ||
                result.message.role !== 'assistant' ||
                typeof result.message.content !== 'string' ||
                !result.message.content.trim()
            ) {
                throw new Error('回复完成事件格式不正确');
            }

            // done 在后端事务提交后发送；最终文本取 done 的完整内容，避免读取尚未提交的 React state。
            // 这里的 UUID 只用于前端列表身份，重新恢复历史时会使用数据库 ID。
            const userMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'user',
                content
            };

            const assistantMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: result.message.content
            };

            setMessages(previous => [
                ...previous,
                userMessage,
                assistantMessage
            ]);

            setInput('');
            setPendingContent(null);
            setPendingReply('');
            setStreamError('');
        } catch (error: unknown) {
            // 离开页面主动取消时，不需要再弹错误提示。
            if (
                error instanceof DOMException &&
                error.name === 'AbortError'
            ) {
                return;
            }

            let errorMessage =
                '本次回复未完成，请刷新历史记录后检查';

            if (error instanceof TypeError) {
                errorMessage = '无法连接服务，请检查网络';
            } else if (
                error instanceof Error &&
                error.message.trim()
            ) {
                errorMessage = error.message;
            }

            // 不清空 pendingReply，保留已经显示的部分，
            // 但通过 streamError 告诉用户它可能不完整。
            setStreamError(errorMessage);
            message.error(errorMessage);
        } finally {
            if (streamControllerRef.current === controller) {
                streamControllerRef.current = null;
            }

            sendingRef.current = false;
            setSending(false);
        }
    };

    /**
     * 加载指定会话最新一页，成功后整体替换当前会话和分页信息。
     * 先取消旧分页，失败时保留原会话；切换成功后恢复底部跟随。
     *
     * @param {number} selectedConversationId - 用户选择的会话 ID。
     * @returns {Promise<void>} 操作结束后兑现；业务错误由函数内部处理并更新提示。
     */
    const handleSelectConversation = async (
        selectedConversationId: number
    ) => {
        if (
            sendingRef.current ||
            creatingRef.current ||
            deletingConversationRef.current ||
            switchingConversationId !== null
        ) {
            return;
        }

        cancelOlderHistory();

        const controller = new AbortController();

        switchConversationControllerRef.current =
            controller;

        setSwitchingConversationId(
            selectedConversationId
        );

        try {
            const result =
                await getAgentConversationMessages(
                    selectedConversationId,
                    controller.signal
                );

            const data = result.data;

            if (
                result.code !== 200 ||
                !data ||
                data.conversationId !==
                    selectedConversationId ||
                !Array.isArray(data.messages) ||
                !data.messages.every(item =>
                    item !== null &&
                    typeof item === 'object' &&
                    typeof item.id === 'string' &&
                    (
                        item.role === 'user' ||
                        item.role === 'assistant'
                    ) &&
                    typeof item.content === 'string'
                )
            ) {
                throw new Error(
                    result.message ||
                    '会话消息格式不正确'
                );
            }

            shouldFollowRef.current = true;
            setShowScrollToBottom(false);

            setConversationId(data.conversationId);
            setMessages(data.messages);
            setHasMoreHistory(data.hasMore);
            setNextHistoryCursor(data.nextCursor);

            setInput('');
            setPendingContent(null);
            setPendingReply('');
            setStreamError('');
        } catch (error: unknown) {
            if (axios.isCancel(error)) return;

            let errorMessage =
                '加载会话消息失败，请稍后重试';

            if (axios.isAxiosError(error)) {
                const serverMessage =
                    error.response?.data?.message;

                if (
                    typeof serverMessage === 'string' &&
                    serverMessage.trim()
                ) {
                    errorMessage = serverMessage;
                } else if (!error.response) {
                    errorMessage =
                        '无法连接服务，请检查网络';
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            message.error(errorMessage);
        } finally {
            if (
                switchConversationControllerRef.current ===
                controller
            ) {
                switchConversationControllerRef.current = null;
                setSwitchingConversationId(null);
            }
        }
    };

    /**
     * 读取真实滚动位置，更新用户是否愿意跟随底部；接近顶部时触发历史分页。
     * 失败后等待用户点击重试，防止滚动事件反复触发失败请求。
     *
     * 无入参；所需上下文从闭包或模块作用域读取。
     * @returns {void} 不返回业务值，通过状态更新或 DOM 操作完成处理。
     */
    const handleMessageListScroll = () => {
        const element = messageListRef.current;

        if (!element) return;

        const distanceToBottom =
            element.scrollHeight -
            element.scrollTop -
            element.clientHeight;

        const isAtBottom =
            distanceToBottom <= BOTTOM_THRESHOLD;

        shouldFollowRef.current = isAtBottom;
        // 记录用户当前的跟随意图；后续内容变高后不能仅凭新距离判断原来是否在底部。
        setShowScrollToBottom(!isAtBottom);

        if (
            element.scrollTop <= TOP_LOAD_THRESHOLD &&
            !isAtBottom &&
            !olderHistoryError
        ) {
            void loadOlderHistory();
        }
    };

    /**
     * 点击后立即滚到底部，并恢复后续流式输出的自动跟随；隐藏返回底部按钮。
     *
     * 无入参；所需上下文从闭包或模块作用域读取。
     * @returns {void} 不返回业务值，通过状态更新或 DOM 操作完成处理。
     */
    const handleScrollToBottom = () => {
        const element = messageListRef.current;

        if (!element) return;

        shouldFollowRef.current = true;
        element.scrollTop = element.scrollHeight;
        setShowScrollToBottom(false);
    };

    /**
     * 重新触发最近会话恢复 Effect；先取消旧分页，避免两份历史数据相互覆盖。
     *
     * 无入参；所需上下文从闭包或模块作用域读取。
     * @returns {void} 不返回业务值，通过状态更新或 DOM 操作完成处理。
     */
    const handleRetryHistory = () => {
        setHistoryStatus('loading');
        cancelOlderHistory();
        setHistoryLoadKey(previous => previous + 1);
    };

    /**
     * 删除会话并返回成功标记供历史面板移除条目。
     * 删除非当前会话不改变聊天内容；删除当前会话则清理页面并触发最近会话恢复。
     *
     * @param {number} deletedConversationId - 用户确认删除的会话 ID。
     * @returns {Promise<boolean>} 删除成功返回 true，失败或被并发保护拦截返回 false。
     */
    const handleDeleteConversation = async (
        deletedConversationId: number
    ): Promise<boolean> => {
        if (
            deletingConversationRef.current ||
            sendingRef.current ||
            creatingRef.current ||
            switchingConversationId !== null
        ) {
            return false;
        }

        deletingConversationRef.current = true;
        setDeletingConversation(true);

        cancelOlderHistory();

        try {
            const result =
                await deleteAgentConversation(
                    deletedConversationId
                );

            if (
                result.code !== 200 ||
                result.data?.conversationId !==
                    deletedConversationId
            ) {
                throw new Error(
                    result.message || '删除会话失败'
                );
            }

            const deletingCurrentConversation =
                deletedConversationId === conversationId;

            if (deletingCurrentConversation) {
                // 清理已删除会话在页面上的所有状态。
                shouldFollowRef.current = true;
                setShowScrollToBottom(false);

                setConversationId(null);
                setMessages([]);
                setInput('');
                setPendingContent(null);
                setPendingReply('');
                setStreamError('');
                setHasMoreHistory(false);
                setNextHistoryCursor(null);

                // 触发现有的最近会话恢复 Effect。
                setHistoryStatus('loading');
                setHistoryLoadKey(
                    previous => previous + 1
                );
            }

            message.success('会话已删除');
            return true;
        } catch (error: unknown) {
            let errorMessage =
                '删除会话失败，请稍后重试';

            if (axios.isAxiosError(error)) {
                const serverMessage =
                    error.response?.data?.message;

                if (
                    typeof serverMessage === 'string' &&
                    serverMessage.trim()
                ) {
                    errorMessage = serverMessage;
                } else if (!error.response) {
                    errorMessage =
                        '无法连接服务，请检查网络';
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            message.error(errorMessage);
            return false;
        } finally {
            deletingConversationRef.current = false;
            setDeletingConversation(false);
        }
    };

    return (
        <ChatWrap 
            title='内容助手'
            extra={
                <Space size={4}>
                    <ConversationDropdown
                        currentConversationId={conversationId}
                        disabled={
                            historyStatus !== 'ready' ||
                            creating ||
                            sending ||
                            deletingConversation ||
                            switchingConversationId !== null
                        }
                        onSelect={handleSelectConversation}
                        onDelete={handleDeleteConversation}
                    />

                    <Button
                        type='text'
                        shape='circle'
                        icon={<PlusOutlined />}
                        loading={creating}
                        disabled={
                            historyStatus !== 'ready' ||
                            creating ||
                            sending ||
                            switchingConversationId !== null
                        }
                        onClick={handleCreateConversation}
                        title='新建会话'
                        aria-label='新建会话'
                    />
                </Space>
            }   
        >
            <div className="message-area">
                <div 
                    className='message-list' 
                    ref={messageListRef}
                    onScroll={handleMessageListScroll}
                >
                    {/* 顶部提示属于滚动内容；固定占位高度，切换加载/失败文案时不推移消息。 */}
                    {historyStatus === 'ready' && (
                        <div className='older-history-bar'>
                            {loadingOlderHistory ? (
                                <Space size={8}>
                                    <Spin size='small' />
                                    <Typography.Text type='secondary'>
                                        正在加载更早消息……
                                    </Typography.Text>
                                </Space>
                            ) : olderHistoryError ? (
                                <Button
                                    type='link'
                                    size='small'
                                    danger
                                    onClick={() => {
                                        void loadOlderHistory();
                                    }}
                                    title={olderHistoryError}
                                >
                                    加载失败，点击重试
                                </Button>
                            ) : hasMoreHistory ? (
                                <Button
                                    type='link'
                                    size='small'
                                    onClick={() => {
                                        void loadOlderHistory();
                                    }}
                                >
                                    加载更早消息
                                </Button>
                            ) : messages.length > 0 ? (
                                <Typography.Text type='secondary'>
                                    已到最早消息
                                </Typography.Text>
                            ) : null}
                        </div>
                    )}
                    {historyStatus === 'loading' && (
                        <div className='empty-state'>
                            <Space direction='vertical' align='center'>
                                <Spin />

                                <Typography.Text type='secondary'>
                                    正在恢复最近对话……
                                </Typography.Text>
                            </Space>
                        </div>
                    )}

                    {historyStatus === 'error' && (
                        <div className='empty-state'>
                            <Alert
                                className='history-alert'
                                type='error'
                                showIcon
                                description={historyError}
                                action={
                                    <Button onClick={handleRetryHistory}>
                                        重试
                                    </Button>
                                }
                            />
                        </div>
                    )}
                    {historyStatus === 'ready' && (
                        messages.length === 0 && pendingContent === null ? (
                            <div className='empty-state'>
                                <Empty description='暂无消息，开始你的第一场对话吧' />
                            </div>
                        ) : (
                            <>
                                {/* key 给 React 识别列表项；data-message-id 供 DOM 锚点查找同一条消息。 */}
                                {messages.map(item => (
                                    <div
                                        key={item.id}
                                        data-message-id={item.id}
                                        className={`message-item ${item.role}`}
                                    >
                                        <Typography.Text type='secondary'>
                                            {item.role === 'user' ? '我' : '内容助手'}
                                        </Typography.Text>

                                        <div className='message-bubble'>
                                            {item.role === 'assistant' ? (
                                                <MarkdownContent content={item.content} />
                                            ) : (
                                                item.content
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* 临时问答单独渲染：收到 done 才并入 messages，失败时保留片段并标记未完成。 */}
                                {pendingContent !== null && (
                                    <>
                                        <div className='message-item user'>
                                            <Typography.Text type='secondary'>
                                                我
                                            </Typography.Text>

                                            <div className='message-bubble'>
                                                {pendingContent}
                                            </div>
                                        </div>
                                        <div className='message-item assistant'>
                                            <Typography.Text
                                                type={streamError ? 'danger' : 'secondary'}
                                            >
                                                {sending
                                                    ? '内容助手正在回复……'
                                                    : streamError
                                                        ? '内容助手（回复未完成）'
                                                        : '内容助手'}
                                            </Typography.Text>

                                            <div className='message-bubble'>
                                                {pendingReply ? (
                                                    <MarkdownContent content={pendingReply} />
                                                ) : sending ? (
                                                    '正在生成回复……'
                                                ) : (
                                                    '未收到有效回复'
                                                )}
                                            </div>

                                            {streamError && (
                                                <Typography.Text type='danger'>
                                                    {streamError}
                                                </Typography.Text>
                                            )}
                                        </div>
                                    </>
                                )}
                            </>
                        )
                    )}
                </div>
                {historyStatus === 'ready' &&
                    showScrollToBottom && (
                        <Button
                            className='scroll-to-bottom'
                            onClick={handleScrollToBottom}
                        >
                            回到底部 ↓
                        </Button>
                    )}
            </div>
            <div className='chat-composer'>
                <Input.TextArea
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    placeholder='输入你的问题或内容创作需求'
                    autoSize={{ minRows: 3, maxRows: 8 }}
                    maxLength={MAX_MESSAGE_LENGTH}
                    // Enter 发送，Shift+Enter 换行；输入法组合期间 Enter 只确认选词。
                    onPressEnter={event => {
                        if (event.shiftKey) return;
                        if (event.nativeEvent.isComposing) return;

                        event.preventDefault();
                        void handleSend();
                    }}
                    disabled={
                        historyStatus !== 'ready' ||
                        conversationId === null ||
                        creating ||
                        sending ||
                        deletingConversation
                    }
                />

                <div className='composer-footer'>
                    <Typography.Text type='secondary'>
                        {input.length} / {MAX_MESSAGE_LENGTH}
                    </Typography.Text>

                    <Button
                        type='primary'
                        onClick={handleSend}
                        loading={sending}
                        disabled={
                            historyStatus !== 'ready' ||
                            conversationId === null ||
                            creating ||
                            sending ||
                            deletingConversation ||
                            !input.trim()
                        }
                    >
                        发送
                    </Button>
                </div>
            </div>
        </ChatWrap>
    );
};

export default memo(Chat); 
