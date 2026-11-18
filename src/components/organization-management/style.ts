import styled from 'styled-components';

const OrganizationWrap = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    .search-fields {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: flex-start;
    }
    .search-fields .ant-form-item {
        margin-bottom: 0;
        flex: 1 1 260px;
        max-width: 380px;
    }
    .search-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 20px;
    }
    .table-scroll {
        overflow-x: auto;
    }
`;

export default OrganizationWrap;
