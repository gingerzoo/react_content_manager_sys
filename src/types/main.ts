import type { ReactNode } from 'react';

interface IOption {
    label: string;
    value: string;
}

interface IHeader {
    title: string;
    btnTitle: string;
}

interface IFormItem {
    type: string;
    label: string;
    name: string;
    placeholder?: string;
    initialValue?: string;
    options?: IOption[];
}
interface ITableItem {
    title: string;
    dataIndex?: string;
    key?: string;
    width?: string;

    // 限制为 Ant Design 支持的对齐方式。
    align?: 'left' | 'center' | 'right';

    // 通用表格单元格渲染函数。
    render?: (
        value: any,
        record: any,
        index: number
    ) => ReactNode;
}

export interface ISearchConfig {
    pageName: string;
    formItems: IFormItem[];
}

export interface IContentConfig {
    pageName: string;
    header?: IHeader;
    tableItems: ITableItem[];
}

export interface IModalConfig {
    pageName: string;
    headerName: string;
    modalItems: IFormItem[];
}
