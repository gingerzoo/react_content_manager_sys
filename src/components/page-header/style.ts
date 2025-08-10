import styled from 'styled-components';

interface IPageheader {
    $headerBgColor: string;
}

const PageHeaderWrap = styled.div<IPageheader>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 20px;
    background-color: ${({ $headerBgColor }) => $headerBgColor};
    /* background-color: */

    .header-left {
        display: flex;
        align-items: center;

        .ant-breadcrumb-link {
            font-size: 14px;
        }
    }

    .header-right {
        margin-right: 20px;
    }
`;

export default PageHeaderWrap;
