import styled from 'styled-components';

const HeaderInfoWrap = styled.div`
    display: flex;
    .operation {
        display: flex;

        svg {
            height: 18px;
            width: 18px;
        }

        .operation-item {
            position: relative;
            display: flex;
            align-items: center;

            .dot {
                position: absolute;
                right: -6px;
                top: 0px;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: red;
            }
            &:not(:last-child) {
                margin-right: 15px;
            }
        }
    }

    .user-info {
        display: flex;
        align-items: center;
        margin-left: 18px;
        color: #606264;
        .avatar-img {
            width: 30px;
            height: 30px;
            margin-right: 8px;
            border-radius: 15px;
        }

        .ant-space {
            cursor: pointer;
        }
    }
`;

export default HeaderInfoWrap;
