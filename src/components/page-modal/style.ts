import styled from 'styled-components';

interface IPageContent {
    $contentBgColor: string;
}

const PageModalWrap = styled.div`
    .my-modal-header {
        margin-bottom: 40px !important;
        background-color: red;
        .ant-modal-title {
            text-align: center;
        }
    }
`;

export default PageModalWrap;
