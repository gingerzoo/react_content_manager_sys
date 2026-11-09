import styled from 'styled-components';

interface IPageSearch {
    $searchBgColor: string;
}

const PageSearchWrap = styled.div<IPageSearch>`
    padding: 30px 30px 24px 20px;
    background-color: ${({ $searchBgColor }) => $searchBgColor};
    border-radius: 20px 20px 20px 0;
    .ant-form {
        display: grid;
        grid-template-columns:
            repeat(auto-fit, minmax(min(100%, 320px), 1fr));
        gap: 16px 24px;

        .ant-form-item {
            min-width: 0;
            margin-bottom: 0;
        }

        .ant-form-item-control {
            min-width: 0;
        }

        .ant-input,
        .ant-select,
        .ant-picker {
            width: 100%;
            min-width: 0;
        }
    }
    .btns {
        display: flex;
        justify-content: end;
        margin-top: 20px;

        .ensure-btn {
            margin-left: 15px;
        }
    }
`;

export default PageSearchWrap;
