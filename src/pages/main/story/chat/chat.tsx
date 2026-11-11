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

const MAX_MESSAGE_LENGTH = 2000;
const BOTTOM_THRESHOLD = 48;

const Chat = () => {
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [creating, setCreating] = useState(false);
    const creatingRef = useRef(false);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sending, setSending] = useState(false);
    const [pendingContent, setPendingContent] = useState<string | null>(
        null
    );

    const sendingRef = useRef(false);
    const messageListRef = useRef<HTMLDivElement>(null);

    const shouldFollowRef = useRef(true);

    const [
        showScrollToBottom,
        setShowScrollToBottom
    ] = useState(false);

    const [historyStatus, setHistoryStatus] = useState<
        'loading' | 'ready' | 'error'
    >('loading');

    const [historyError, setHistoryError] = useState('');
    const [historyLoadKey, setHistoryLoadKey] = useState(0);

    const { message } = AntdApp.useApp();

    const [pendingReply, setPendingReply] = useState('');
    const [streamError, setStreamError] = useState('');

    const [
        deletingConversation,
        setDeletingConversation
    ] = useState(false);

    const deletingConversationRef = useRef(false);

    const streamControllerRef =
        useRef<AbortController | null>(null);

    const [
        switchingConversationId,
        setSwitchingConversationId
    ] = useState<number | null>(null);

    const switchConversationControllerRef =
        useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            streamControllerRef.current?.abort();
            switchConversationControllerRef.current?.abort();
        };
    }, []);

    useLayoutEffect(() => {
        const element = messageListRef.current;

        if (!element) return;

        if (shouldFollowRef.current) {
            element.scrollTop = element.scrollHeight;
            setShowScrollToBottom(false);
            return;
        }

        // 用户正在查看历史时，不修改 scrollTop。
        const distanceToBottom =
            element.scrollHeight -
            element.scrollTop -
            element.clientHeight;

        setShowScrollToBottom(
            distanceToBottom > BOTTOM_THRESHOLD
        );
    }, [
        messages,
        pendingContent,
        pendingReply,
        streamError
    ]);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        setHistoryStatus('loading');
        setHistoryError('');

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
                    setHistoryStatus('ready');
                    return;
                }

                const data = result.data;

                if (
                    !Number.isSafeInteger(data.conversationId) ||
                    data.conversationId <= 0 ||
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
                    throw new Error('历史记录返回格式不正确');
                }
                
                shouldFollowRef.current = true;
                setShowScrollToBottom(false);

                setConversationId(data.conversationId);
                setMessages(data.messages);
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

    const handleSend = async () => {
        if (
            historyStatus !== 'ready' ||
            sendingRef.current ||
            creatingRef.current ||
            deletingConversationRef.current ||
            conversationId === null
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
        setShowScrollToBottom(!isAtBottom);
    };

    const handleScrollToBottom = () => {
        const element = messageListRef.current;

        if (!element) return;

        shouldFollowRef.current = true;
        element.scrollTop = element.scrollHeight;
        setShowScrollToBottom(false);
    };

    const handleRetryHistory = () => {
        setHistoryStatus('loading');
        setHistoryLoadKey(previous => previous + 1);
    };

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
                                {messages.map(item => (
                                    <div
                                        key={item.id}
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