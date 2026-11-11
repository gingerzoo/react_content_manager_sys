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
        padding-bottom: 12px;
    }

    .message-list {
        height: 100%;
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

    .message-area {
        position: relative;
        flex: 1;
        min-height: 0;
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
    
    .message-item.assistant .message-bubble {
        white-space: normal;
    }

    .markdown-content {
        line-height: 1.7;
        overflow-wrap: anywhere;
    }

    .markdown-content > :first-child {
        margin-top: 0;
    }

    .markdown-content > :last-child {
        margin-bottom: 0;
    }

    .markdown-content p {
        margin: 0 0 10px;
    }

    .markdown-content h1,
    .markdown-content h2,
    .markdown-content h3,
    .markdown-content h4 {
        margin: 18px 0 10px;
        line-height: 1.4;
    }

    .markdown-content ul,
    .markdown-content ol {
        margin: 8px 0;
        padding-inline-start: 24px;
    }

    .markdown-content blockquote {
        margin: 10px 0;
        padding: 8px 12px;
        color: #666;
        background: #eeeeee;
        border-left: 4px solid #bfbfbf;
    }

    .markdown-content code {
        padding: 2px 6px;
        font-family: monospace;
        background: #e8e8e8;
        border-radius: 4px;
    }

    .markdown-content pre {
        margin: 12px 0;
        padding: 14px;
        color: #f5f5f5;
        background: #1f1f1f;
        border-radius: 8px;
        overflow-x: auto;
    }

    .markdown-content pre code {
        padding: 0;
        color: inherit;
        background: transparent;
        white-space: pre;
    }

    .markdown-content table {
        display: block;
        max-width: 100%;
        margin: 12px 0;
        border-collapse: collapse;
        overflow-x: auto;
    }

    .markdown-content th,
    .markdown-content td {
        padding: 8px 12px;
        border: 1px solid #d9d9d9;
    }

    .markdown-content th {
        background: #eeeeee;
    }

    .scroll-to-bottom {
        position: absolute;
        right: 16px;
        bottom: 16px;
        z-index: 2;
        box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
    }

    .history-alert {
        width: 100%;
        max-width: 560px;
        align-items: center;
    }

    .history-alert .ant-alert-content {
        flex: 1;
        min-width: 0;
    }

    .history-alert .ant-alert-description {
        overflow-wrap: anywhere;
    }

    .history-alert .ant-alert-action {
        flex-shrink: 0;
        margin-inline-start: 16px;
    }

    .chat-composer {
        flex-shrink: 0;
        margin-top: 12px;
    }

    .composer-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 16px;
        margin-top: 8px;
    }
`;

export default ChatWrap;