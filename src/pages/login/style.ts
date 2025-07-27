import styled from 'styled-components';

const LoginWrap = styled.div`
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 380px;

    .content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        border: 1px solid #dcdfe6;
        /* background: red; */

        .ant-tabs-nav-list {
            flex: 1;

            .ant-tabs-tab {
                flex: 1;
                justify-content: center;
                border-radius: 0;
            }
        }

        /* .ant-form {
            padding: 0 8px;
        } */

        /* .ant-form-item-label {
            flex: 0 0 25%;
        } */

        .get-number-box {
            display: flex;

            .get-number-btn {
                margin-left: 10px;
            }
        }
    }

    h1 {
        text-align: center;
    }

    .bottom {
        .oper-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #409eff;
            font-size: 14px;
            margin: 8px 0;
        }
        .submit-btn {
            width: 100%;
        }
    }
`;

export default LoginWrap;
