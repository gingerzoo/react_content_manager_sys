import styled from 'styled-components';

const MainWrap = styled.div`
    /* height: 100vh;
    overflow: hidden; */
    .ant-layout-has-sider {
        height: 100vh;

        .ant-layout-sider {
            flex: 0 0 250px;
            max-width: 250px;
            min-width: 250px;
            width: 250px;
        }
    }

    .ant-modal .ant-modal-header {
        margin-bottom: 30px !important;
    }
    .ant-modal .ant-modal-title {
        text-align: center !important;
    }
`;

export default MainWrap;
