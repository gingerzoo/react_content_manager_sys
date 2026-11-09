import { memo, useRef, useState, useEffect } from 'react';
import { 
    Button, 
    Empty,
    Input, 
    Typography,
    App as AntdApp
} from 'antd';
import ChatWrap from './style';
import axios from 'axios';
import { 
    createAgentConversation,
    sendAgentMessage
 } from '@/service/agent/agent';

const MAX_MESSAGE_LENGTH = 2000;

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

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

    const { message } = AntdApp.useApp();

    useEffect(() => {
        const element = messageListRef.current;

        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }, [messages, pendingContent]);


    const handleCreateConversation = async () => {
        if (creatingRef.current || sendingRef.current) return;

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
            sendingRef.current ||
            creatingRef.current ||
            conversationId === null
        ) {
            return;
        }

        const content = input.trim();

        if (!content || input.length > MAX_MESSAGE_LENGTH) {
            return;
        }

        sendingRef.current = true;
        setSending(true);
        setPendingContent(content);

        try {
            const result = await sendAgentMessage(
                conversationId,
                content
            );

            const data = result.data;

            if (
                result.code !== 200 ||
                !data ||
                data.conversationId !== conversationId ||
                data.message?.role !== 'assistant' ||
                typeof data.message.content !== 'string' ||
                !data.message.content.trim()
            ) {
                throw new Error(result.message || '回复数据格式不正确');
            }

            const userMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'user',
                content
            };

            const assistantMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: data.message.content
            };

            setMessages(previous => [
                ...previous,
                userMessage,
                assistantMessage
            ]);

            setInput('');
        } catch (error: unknown) {
            let errorMessage = '发送失败，请稍后重试';

            if (axios.isAxiosError(error)) {
                const serverMessage = error.response?.data?.message;

                if (
                    error.code === 'ECONNABORTED' ||
                    error.code === 'ETIMEDOUT'
                ) {
                    errorMessage = '等待回复超时，请稍后检查会话记录';
                } else if (
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
            sendingRef.current = false;
            setSending(false);
            setPendingContent(null);
        }
    };

    return (
        <ChatWrap 
            title='内容助手'
             extra={
                <Button
                    onClick={handleCreateConversation}
                    loading={creating}
                    disabled={creating || sending}
                >
                    新对话
                </Button>
            }           
        >
            <div className='message-list' ref={messageListRef}>
                {messages.length === 0 && pendingContent === null ? (
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
                                    {item.content}
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
                                    <Typography.Text type='secondary'>
                                        内容助手正在回复……
                                    </Typography.Text>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>




            <div className='chat-composer'>
                <Input.TextArea
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    placeholder='输入你的问题或内容创作需求'
                    autoSize={{ minRows: 3, maxRows: 8 }}
                    maxLength={MAX_MESSAGE_LENGTH}
                    disabled={conversationId === null || creating || sending}
                 
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
                            conversationId === null ||
                            creating ||
                            sending ||
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