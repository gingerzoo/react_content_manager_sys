import styled from 'styled-components';

interface IPageSearch {
    $searchBgColor: string;
}

const PageSearchWrap = styled.div<IPageSearch>`
    padding: 30px 30px 24px 20px;
    background-color: ${({ $searchBgColor }) => $searchBgColor};
    border-radius: 20px 20px 20px 0;
    .ant-form {
        display: flex;
        flex-wrap: wrap;
        row-gap: 8px;
        column-gap: 60px;

        .ant-form-item {
            flex: 0 1 calc((100% - 150px) / 3); /* 三列，每列占宽度的三分之一，减去间隙 */
            min-width: 200px;
        }
    }
    .btns {
        display: flex;
        justify-content: end;
        margin-top: -5px;

        .ensure-btn {
            margin-left: 15px;
        }
    }
`;

export default PageSearchWrap;
