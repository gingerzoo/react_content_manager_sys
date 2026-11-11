import styled from 'styled-components';

const ConversationDropdownPanel = styled.div`
    width: 320px;
    padding: 8px;
    background: #fff;
    border-radius: 8px;
    box-shadow:
        0 6px 16px rgb(0 0 0 / 8%),
        0 3px 6px -4px rgb(0 0 0 / 12%);

    .conversation-dropdown-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px 8px;
        border-bottom: 1px solid #f0f0f0;
    }

    .conversation-dropdown-list {
        max-height: 320px;
        overflow-y: auto;
        padding-top: 6px;
    }

    .conversation-dropdown-state {
        min-height: 96px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px;
        text-align: center;
    }

    .conversation-dropdown-item {
        width: 100%;
        min-height: 56px;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px;
        border-radius: 6px;
    }

    .conversation-dropdown-item:hover {
        background: #f5f5f5;
    }

    .conversation-dropdown-item.active {
        background: #e8f7ef;
    }

  

    .conversation-item-main {
        min-width: 0;
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 4px;
    }

    .conversation-item-title {
        overflow: hidden;
        font-weight: 500;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .conversation-item-time {
        color: #8c8c8c;
        font-size: 12px;
    }

    .conversation-select-button {
        min-width: 0;
        min-height: 48px;
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 4px 6px;
        color: inherit;
        font: inherit;
        text-align: left;
        background: transparent;
        border: 0;
        cursor: pointer;
    }

    .conversation-delete-button {
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.2s;
        margin-right: 12px;
    }

    .conversation-dropdown-item:hover
    .conversation-delete-button,
    .conversation-dropdown-item:focus-within
    .conversation-delete-button {
        opacity: 1;
    }

    .active-mark {
        flex-shrink: 0;
        color: #00b96b;
        font-size: 12px;
    }
`;

export default ConversationDropdownPanel;