import styled from 'styled-components';

interface IPageContent {
    $contentBgColor: string;
}

const PageContentWrap = styled.div<IPageContent>`
    overflow-y: scroll;
    margin-top: 20px;
    padding: 20px 15px;
    border-radius: 20px 0px 0px 20px;
    background-color: ${({ $contentBgColor }) => $contentBgColor};
    .content-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
    }
    .ant-form {
        display: flex;
        flex-wrap: wrap;
        row-gap: 16px;
        column-gap: 60px;
        padding: 20px 0px 0px 30px;

        .ant-form-item {
            flex: 0 1 calc((100% - 150px) / 3); /* 三列，每列占宽度的三分之一，减去间隙 */
        }
    }
    .btns {
        display: flex;
        justify-content: end;

        .ensure-btn {
            margin-left: 15px;
        }
    }
`;

export default PageContentWrap;
