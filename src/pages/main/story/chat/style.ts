import styled from 'styled-components';
import { Card } from 'antd';

const ChatWrap = styled(Card)`
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;

    .ant-card-head {
        flex-shrink: 0;
    }

    .ant-card-body {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .message-list {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 12px 0;
    }

    .empty-state {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .message-item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        margin-bottom: 20px;
    }

    .message-item.user {
        align-items: flex-end;
    }

    .message-bubble {
        max-width: 85%;
        padding: 12px 16px;
        border-radius: 12px;
        background: #f5f5f5;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }

    .message-item.user .message-bubble {
        background: #e8f7ef;
    }

    .chat-composer {
        flex-shrink: 0;
        margin-top: 24px;
    }

    .composer-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 16px;
        margin-top: 16px;
    }
`;

export default ChatWrap;