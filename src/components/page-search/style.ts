import styled from 'styled-components';

interface IPageSearch {
    $searchBgColor: string;
}

const PageSearchWrap = styled.div<IPageSearch>`
    padding: 30px 30px 24px 20px;
    background-color: ${({ $searchBgColor }) => $searchBgColor};
    border-radius: 20px 20px 20px 0;
    /* 根据卡片自身宽度布局，兼容侧栏展开、折叠后的可用空间。 */
    container-type: inline-size;

    .ant-form {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 16px 24px;

        .ant-form-item {
            min-width: 0;
            margin-bottom: 0;
        }

        .ant-form-item-row {
            flex-wrap: nowrap;
        }

        .ant-form-item-label {
            flex: 0 0 84px;
            max-width: 84px;
            padding: 0;
            white-space: normal;
        }

        .ant-form-item-control {
            flex: 1 1 0;
            max-width: 100%;
            min-width: 0;
        }

        .ant-input,
        .ant-select,
        .ant-picker {
            width: 100%;
            min-width: 0;
        }
    }

    @container (min-width: 680px) {
        .ant-form {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    @container (min-width: 1000px) {
        .ant-form {
            /* 最多三列：第一行三个文本框，第二行状态和创建时间。 */
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }

    @container (max-width: 419px) {
        .ant-form {
            .ant-form-item-row {
                flex-direction: column;
                gap: 6px;
            }

            .ant-form-item-label {
                flex: 0 0 auto;
                max-width: 100%;
                text-align: left;
            }

            .ant-form-item-control {
                flex: 1 1 auto;
                width: 100%;
            }
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
