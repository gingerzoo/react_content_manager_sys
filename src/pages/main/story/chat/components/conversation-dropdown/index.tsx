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

/**
 * 将接口时间转为用户本地时区的简短日期时间；非法值返回空文本。
 *
 * @param {string} value - 接口返回的日期时间字符串。
 * @returns {string} 本地时区的月日时分；无法解析时返回空字符串。
 */
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

/**
 * 历史会话入口：内部管理悬浮、列表请求与确认弹窗；选择和删除交由父页面处理。
 *
 * @param {ConversationDropdownProps} props - 由父页面传入的状态和操作回调。
 * @param {number | null} props.currentConversationId - 当前会话 ID，用于高亮。
 * @param {boolean} props.disabled - 父页面繁忙时禁用入口并收起面板。
 * @param {(conversationId: number) => (void | Promise<void>)} props.onSelect - 通知父页面加载所选会话。
 * @param {(conversationId: number) => Promise<boolean>} props.onDelete - 请求父页面删除，成功返回 true。
 * @returns {import("react").ReactElement} 历史图标按钮及其受控下拉面板。
 */
const ConversationDropdown = ({
    currentConversationId,
    disabled,
    onSelect,
    onDelete
}: ConversationDropdownProps) => {
    // 历史面板是否展开，与父页面的聊天会话状态独立。
    const [open, setOpen] = useState(false);

    // 仅保存会话摘要，不包含完整消息。
    const [conversations, setConversations] =
        useState<AgentConversationSummary[]>([]);

    // 列表自身的 idle/loading/ready/error，与聊天页历史恢复状态分离。
    const [status, setStatus] =
        useState<ListStatus>('idle');

    // 列表请求失败提示，渲染重试入口。
    const [errorMessage, setErrorMessage] =
        useState('');

    // 列表请求同步锁，state 尚未渲染时也能阻止重复调用。
    const loadingRef = useRef(false);

    // 摘要列表请求控制器，与聊天页的流式、会话详情及分页请求分别管理。
    const requestControllerRef =
        useRef<AbortController | null>(null);

    const { modal } = AntdApp.useApp();

    // 卸载时取消摘要请求，避免继续等待已不需要的数据。
    useEffect(() => {
        return () => {
            requestControllerRef.current?.abort();
        };
    }, []);

    // 父页面繁忙时收起浮层，避免继续切换或打开操作入口。
    useEffect(() => {
        if (disabled) {
            setOpen(false);
        }
    }, [disabled]);

    /**
     * 打开面板或点击刷新时重取摘要，以同步新标题、删除结果和更新时间排序。
     * 同步锁防止反复悬浮产生重叠请求；卸载时可取消。
     *
     * 无入参；所需上下文从闭包或模块作用域读取。
     * @returns {Promise<void>} 操作结束后兑现；业务错误由函数内部处理并更新提示。
     */
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

    /**
     * 更新受控浮层开关，打开时刷新列表；关闭不清空已加载数据。
     *
     * @param {boolean} nextOpen - 浮层希望切换到的展开状态。
     * @returns {void} 不返回业务值，通过状态更新或 DOM 操作完成处理。
     */
    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (nextOpen) {
            void loadConversations();
        }
    };

    /**
     * 先关闭浮层；点击当前会话无需重复加载，其他会话通过回调通知父页面。
     *
     * @param {number} selectedConversationId - 点击条目的会话 ID。
     * @returns {void} 不返回业务值，通过状态更新或 DOM 操作完成处理。
     */
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

    /**
     * 关闭 hover 面板后打开独立确认弹窗，避免鼠标移出导致确认入口卸载。
     * 父组件返回 true 后才移除摘要；返回 false 时保留条目，错误由父组件提示。
     *
     * @param {AgentConversationSummary} conversation - 待删除会话摘要，用于 ID 和确认文案。
     * @returns {void} 打开确认弹窗；实际删除由 onOk 异步回调执行。
     */
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

            /**
             * 返回 Promise 让确认按钮等待异步删除；false 不移除本地条目。
             *
             * 无入参；所需上下文从闭包或模块作用域读取。
             * @returns {Promise<void>} 等待父页面删除；成功时移除摘要，返回 false 则保留条目。
             */
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


    // 自定义面板包含加载、失败、空列表和会话列表；由独立 styled 组件提供浮层样式。
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
