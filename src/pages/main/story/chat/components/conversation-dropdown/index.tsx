import {
    memo,
    useEffect,
    useRef,
    useState
} from 'react';
import {
    Button,
    Dropdown,
    Spin,
    Typography,
    App as AntdApp,
} from 'antd';
import axios from 'axios';

import {
    HistoryOutlined,
    DeleteOutlined,
} from '@ant-design/icons';

import {
    getAgentConversations
} from '@/service/agent/agent';

import type {
    AgentConversationSummary
} from '@/service/agent/agent';

import ConversationDropdownPanel from './style';

interface ConversationDropdownProps {
    currentConversationId: number | null;
    disabled: boolean;

    onSelect: (
        conversationId: number
    ) => void | Promise<void>;

    onDelete: (
        conversationId: number
    ) => Promise<boolean>;
}

type ListStatus =
    | 'idle'
    | 'loading'
    | 'ready'
    | 'error';

function formatConversationTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date);
}

const ConversationDropdown = ({
    currentConversationId,
    disabled,
    onSelect,
    onDelete
}: ConversationDropdownProps) => {
    const [open, setOpen] = useState(false);

    const [conversations, setConversations] =
        useState<AgentConversationSummary[]>([]);

    const [status, setStatus] =
        useState<ListStatus>('idle');

    const [errorMessage, setErrorMessage] =
        useState('');

    const loadingRef = useRef(false);

    const requestControllerRef =
        useRef<AbortController | null>(null);

    const { modal } = AntdApp.useApp();

    useEffect(() => {
        return () => {
            requestControllerRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (disabled) {
            setOpen(false);
        }
    }, [disabled]);

    const loadConversations = async () => {
        if (loadingRef.current) return;

        const controller = new AbortController();

        loadingRef.current = true;
        requestControllerRef.current = controller;

        setStatus('loading');
        setErrorMessage('');

        try {
            const result = await getAgentConversations(
                controller.signal
            );

            if (
                result.code !== 200 ||
                !Array.isArray(result.data) ||
                !result.data.every(item =>
                    item !== null &&
                    typeof item === 'object' &&
                    Number.isSafeInteger(item.id) &&
                    item.id > 0 &&
                    typeof item.title === 'string' &&
                    typeof item.createdAt === 'string' &&
                    typeof item.updatedAt === 'string'
                )
            ) {
                throw new Error(
                    result.message ||
                    '会话列表格式不正确'
                );
            }

            setConversations(result.data);
            setStatus('ready');
        } catch (error: unknown) {
            if (axios.isCancel(error)) return;

            let message =
                '加载会话列表失败，请稍后重试';

            if (axios.isAxiosError(error)) {
                const serverMessage =
                    error.response?.data?.message;

                if (
                    typeof serverMessage === 'string' &&
                    serverMessage.trim()
                ) {
                    message = serverMessage;
                } else if (!error.response) {
                    message =
                        '无法连接服务，请检查网络';
                }
            } else if (error instanceof Error) {
                message = error.message;
            }

            setErrorMessage(message);
            setStatus('error');
        } finally {
            if (
                requestControllerRef.current ===
                controller
            ) {
                requestControllerRef.current = null;
            }

            loadingRef.current = false;
        }
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (nextOpen) {
            void loadConversations();
        }
    };

    const handleSelect = (
        selectedConversationId: number
    ) => {
        setOpen(false);

        if (
            selectedConversationId ===
            currentConversationId
        ) {
            return;
        }

        void onSelect(selectedConversationId);
    };

    const handleRequestDelete = (
        conversation: AgentConversationSummary
    ) => {
        // 先关闭历史面板，确认弹窗独立显示。
        setOpen(false);

        modal.confirm({
            title: '确定删除这个会话吗？',
            content: `“${conversation.title}”及其全部消息都会被删除，且无法恢复。`,
            okText: '删除',
            cancelText: '取消',
            okButtonProps: {
                danger: true
            },

            onOk: async () => {
                const deleted =
                    await onDelete(conversation.id);

                if (!deleted) return;

                setConversations(previous =>
                    previous.filter(
                        item =>
                            item.id !== conversation.id
                    )
                );
            }
        });
    };


    const panel = (
        <ConversationDropdownPanel>
            <div className='conversation-dropdown-header'>
                <Typography.Text strong>
                    所有会话
                </Typography.Text>

                <Button
                    type='text'
                    size='small'
                    loading={status === 'loading'}
                    onClick={() => {
                        void loadConversations();
                    }}
                >
                    刷新
                </Button>
            </div>

            <div className='conversation-dropdown-list'>
                {status === 'loading' && (
                    <div className='conversation-dropdown-state'>
                        <Spin size='small' />

                        <Typography.Text type='secondary'>
                            正在加载会话……
                        </Typography.Text>
                    </div>
                )}

                {status === 'error' && (
                    <div className='conversation-dropdown-state'>
                        <Typography.Text type='danger'>
                            {errorMessage}
                        </Typography.Text>

                        <Button
                            size='small'
                            onClick={() => {
                                void loadConversations();
                            }}
                        >
                            重试
                        </Button>
                    </div>
                )}

                {status === 'ready' &&
                    conversations.length === 0 && (
                        <div className='conversation-dropdown-state'>
                            <Typography.Text type='secondary'>
                                暂无会话
                            </Typography.Text>
                        </div>
                    )}

                {status === 'ready' &&
                    conversations.map(item => {
                        const isActive =
                            item.id ===
                            currentConversationId;

                        return (
                            <div
                                key={item.id}
                                className={[
                                    'conversation-dropdown-item',
                                    isActive ? 'active' : ''
                                ].join(' ')}
                            >
                                <button
                                    type='button'
                                    className='conversation-select-button'
                                    onClick={() => {
                                        handleSelect(item.id);
                                    }}
                                >
                                    <span className='conversation-item-main'>
                                        <span
                                            className='conversation-item-title'
                                            title={item.title}
                                        >
                                            {item.title}
                                        </span>

                                        <span className='conversation-item-time'>
                                            {formatConversationTime(
                                                item.updatedAt
                                            )}
                                        </span>
                                    </span>

                                    {isActive && (
                                        <span className='active-mark'>
                                            当前
                                        </span>
                                    )}
                                </button>

                                <Button
                                    className='conversation-delete-button'
                                    type='text'
                                    size='small'
                                    danger
                                    icon={<DeleteOutlined />}
                                    title='删除会话'
                                    aria-label={`删除会话：${item.title}`}
                                    onClick={event => {
                                        // 防止点击删除时触发其他点击逻辑。
                                        event.stopPropagation();

                                        handleRequestDelete(item);
                                    }}
                                />
                            </div>
                           
                        );
                    })}
            </div>
        </ConversationDropdownPanel>
    );

    return (
        <Dropdown
            menu={{ items: [] }}
            trigger={['hover']}
            placement='bottomRight'
            open={open}
            onOpenChange={handleOpenChange}
            popupRender={() => panel}
            mouseEnterDelay={0.15}
            mouseLeaveDelay={0.2}
            disabled={disabled}
        >
            <Button
                type='text'
                shape='circle'
                icon={<HistoryOutlined />}
                disabled={disabled}
                title='查看历史会话'
                aria-label='查看历史会话'
            />
        </Dropdown>
    );
};

export default memo(ConversationDropdown);